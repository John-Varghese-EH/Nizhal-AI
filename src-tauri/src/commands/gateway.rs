use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tauri::State;

use crate::local_inference::candle_engine::CandleEngine;
use crate::local_inference::model_manager::ModelManager;

/// Shared application AI state
pub struct AIGatewayState {
    pub engine: Arc<Mutex<CandleEngine>>,
    pub model_manager: Arc<ModelManager>,
}

#[derive(Debug)]
enum TaskComplexity {
    Simple,
    Complex,
}

/// Intent classifier using keyword heuristics
fn classify_intent(message: &str) -> TaskComplexity {
    let msg = message.to_lowercase();
    let word_count = message.split_whitespace().count();

    let complex_keywords = [
        "analyze", "research", "compare", "explain in detail",
        "write an essay", "summarize this article", "code review",
        "debug", "refactor", "translate this", "create a plan",
        "write a story", "generate code", "solve this problem",
        "what do you think about", "deep dive", "comprehensive",
    ];

    let has_complex = complex_keywords
        .iter()
        .any(|kw| msg.contains(kw));

    if word_count > 50 || has_complex {
        TaskComplexity::Complex
    } else {
        TaskComplexity::Simple
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GatewayResponse {
    pub success: bool,
    pub response: String,
    pub provider: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub routed_as: String, // "local" | "cloud"
}

/// Detect available GPU hardware
#[tauri::command]
pub async fn detect_gpu() -> Result<serde_json::Value, String> {
    Ok(CandleEngine::detect_gpu())
}

/// Get local model download/load status
#[tauri::command]
pub async fn local_model_status(
    state: State<'_, AIGatewayState>,
) -> Result<crate::local_inference::model_manager::ModelStatus, String> {
    Ok(state.model_manager.get_status())
}

/// Trigger model download (async, emits progress events)
#[tauri::command]
pub async fn local_model_download(
    app: tauri::AppHandle,
    state: State<'_, AIGatewayState>,
) -> Result<(), String> {
    state.model_manager.download_model(&app).await
}

/// Load downloaded model into memory for inference
#[tauri::command]
pub async fn local_model_load(
    state: State<'_, AIGatewayState>,
) -> Result<(), String> {
    let mm = &state.model_manager;
    if !mm.is_model_ready() {
        return Err("Model files not downloaded yet".to_string());
    }

    let model_path = mm.model_path();
    let tokenizer_path = mm.tokenizer_path();

    let engine = state.engine.clone();
    // Load in a blocking task to avoid starving the async runtime
    tokio::task::spawn_blocking(move || {
        let mut eng = engine.lock().map_err(|e| format!("Lock error: {}", e))?;
        eng.load_model(&model_path, &tokenizer_path)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

/// Run inference on the local model
#[tauri::command]
pub async fn local_chat(
    state: State<'_, AIGatewayState>,
    message: String,
    system_prompt: Option<String>,
) -> Result<GatewayResponse, String> {
    let engine = state.engine.clone();

    let prompt = if let Some(sys) = system_prompt {
        format!(
            "<start_of_turn>user\n{}\n\n{}<end_of_turn>\n<start_of_turn>model\n",
            sys, message
        )
    } else {
        format!(
            "<start_of_turn>user\n{}<end_of_turn>\n<start_of_turn>model\n",
            message
        )
    };

    let result = tokio::task::spawn_blocking(move || {
        let mut eng = engine.lock().map_err(|e| format!("Lock error: {}", e))?;
        if !eng.is_loaded() {
            return Err("Local model not loaded".to_string());
        }
        eng.generate(&prompt, 512, 0.7)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))??;

    Ok(GatewayResponse {
        success: true,
        response: result,
        provider: "local-candle".to_string(),
        error: None,
        routed_as: "local".to_string(),
    })
}

/// Smart hybrid chat: routes between local and cloud based on intent
#[tauri::command]
pub async fn gateway_chat(
    app: tauri::AppHandle,
    state: State<'_, AIGatewayState>,
    message: String,
) -> Result<GatewayResponse, String> {
    let complexity = classify_intent(&message);
    let local_available = {
        let eng = state.engine.lock().map_err(|e| format!("Lock: {}", e))?;
        eng.is_loaded()
    };

    match complexity {
        TaskComplexity::Simple if local_available => {
            // Route to local
            log::info!("[Gateway] Routing SIMPLE task to local model");
            match local_chat(state, message.clone(), None).await {
                Ok(resp) => Ok(resp),
                Err(_) => {
                    // Fallback to cloud
                    log::warn!("[Gateway] Local inference failed, falling back to cloud");
                    route_to_cloud(&app, &message).await
                }
            }
        }
        _ => {
            // Route to cloud, fallback to local
            log::info!("[Gateway] Routing {:?} task to cloud", complexity);
            match route_to_cloud(&app, &message).await {
                Ok(resp) => Ok(resp),
                Err(cloud_err) if local_available => {
                    log::warn!(
                        "[Gateway] Cloud failed ({}), falling back to local",
                        cloud_err
                    );
                    // Attempt local fallback
                    let engine = state.engine.clone();
                    let prompt = format!(
                        "<start_of_turn>user\n{}<end_of_turn>\n<start_of_turn>model\n",
                        message
                    );
                    let result = tokio::task::spawn_blocking(move || {
                        let mut eng = engine.lock().map_err(|e| format!("Lock: {}", e))?;
                        eng.generate(&prompt, 512, 0.7)
                    })
                    .await
                    .map_err(|e| format!("Join: {}", e))??;

                    Ok(GatewayResponse {
                        success: true,
                        response: result,
                        provider: "local-candle (fallback)".to_string(),
                        error: None,
                        routed_as: "local".to_string(),
                    })
                }
                Err(e) => Ok(GatewayResponse {
                    success: false,
                    response: format!(
                        "No AI available. Cloud error: {}. Local model not loaded.",
                        e
                    ),
                    provider: "none".to_string(),
                    error: Some(e),
                    routed_as: "none".to_string(),
                }),
            }
        }
    }
}

/// Route a message to the existing cloud AI backend
async fn route_to_cloud(app: &tauri::AppHandle, message: &str) -> Result<GatewayResponse, String> {
    // Delegate to the existing ai::chat command logic
    let result = super::ai::chat(app.clone(), message.to_string()).await?;

    if result.success {
        Ok(GatewayResponse {
            success: true,
            response: result.response,
            provider: result.provider.unwrap_or_else(|| "cloud".to_string()),
            error: None,
            routed_as: "cloud".to_string(),
        })
    } else {
        Err(result
            .error
            .unwrap_or_else(|| "Cloud provider failed".to_string()))
    }
}
