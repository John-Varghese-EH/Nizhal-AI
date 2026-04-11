use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

/// Chat message structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// AI response structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AIResponse {
    pub success: bool,
    pub response: String,
    pub provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from_cache: Option<bool>,
}

/// Provider status
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProviderStatus {
    pub current_provider: String,
    pub available_providers: Vec<String>,
    pub fallback_enabled: bool,
}

/// Provider configuration
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub model: String,
    pub enabled: bool,
    pub has_api_key: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_url: Option<String>,
}

/// Get API key for a provider from store or env
fn get_api_key(app: &tauri::AppHandle, provider: &str) -> Option<String> {
    // First check store
    if let Ok(store) = app.store("settings.json") {
        let key_path = format!("apiKeys.{}", provider);
        if let Some(val) = store.get(&key_path) {
            if let Some(s) = val.as_str() {
                if !s.is_empty() {
                    return Some(s.to_string());
                }
            }
        }
    }

    // Fall back to environment variables
    let env_key = match provider {
        "gemini" => "GEMINI_API_KEY",
        "openai" => "OPENAI_API_KEY",
        "anthropic" => "ANTHROPIC_API_KEY",
        "groq" => "GROQ_API_KEY",
        "huggingface" => "HUGGINGFACE_API_KEY",
        "together" => "TOGETHER_API_KEY",
        "custom" => "CUSTOM_API_KEY",
        _ => return None,
    };

    std::env::var(env_key).ok().filter(|s| !s.is_empty())
}

/// Get base URL for a provider
fn get_base_url(provider: &str) -> String {
    match provider {
        "gemini" => "https://generativelanguage.googleapis.com/v1beta".to_string(),
        "openai" => std::env::var("OPENAI_BASE_URL")
            .unwrap_or_else(|_| "https://api.openai.com/v1".to_string()),
        "anthropic" => "https://api.anthropic.com/v1".to_string(),
        "groq" => "https://api.groq.com/openai/v1".to_string(),
        "huggingface" => "https://api-inference.huggingface.co".to_string(),
        "together" => "https://api.together.xyz/v1".to_string(),
        "ollama" => std::env::var("OLLAMA_URL")
            .unwrap_or_else(|_| "http://localhost:11434".to_string()),
        "lmstudio" => std::env::var("LMSTUDIO_URL")
            .unwrap_or_else(|_| "http://localhost:1234/v1".to_string()),
        "openwebui" => std::env::var("OPENWEBUI_URL")
            .unwrap_or_else(|_| "http://localhost:8080/api".to_string()),
        "custom" => std::env::var("CUSTOM_BASE_URL")
            .unwrap_or_else(|_| "https://openrouter.ai/api/v1".to_string()),
        _ => String::new(),
    }
}

/// Get default model for a provider
fn get_default_model(provider: &str) -> String {
    match provider {
        "gemini" => "gemini-2.0-flash-lite".to_string(),
        "openai" => "gpt-4o-mini".to_string(),
        "anthropic" => "claude-3-5-sonnet-latest".to_string(),
        "groq" => "llama-3.3-70b-versatile".to_string(),
        "huggingface" => "microsoft/DialoGPT-medium".to_string(),
        "together" => "meta-llama/Llama-3-8b-chat-hf".to_string(),
        "ollama" => "llama3.2".to_string(),
        "lmstudio" => "llama-3.2-1b-instruct".to_string(),
        "openwebui" => "llama3.2:latest".to_string(),
        "custom" => std::env::var("CUSTOM_MODEL")
            .unwrap_or_else(|_| "deepseek/deepseek-r1:free".to_string()),
        _ => String::new(),
    }
}

/// Chat with Gemini
async fn chat_gemini(
    api_key: &str,
    system_prompt: &str,
    messages: &[ChatMessage],
    user_message: &str,
    model: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    // Build contents array for Gemini format
    let mut contents = Vec::new();

    // Add conversation history
    for msg in messages {
        let role = if msg.role == "assistant" {
            "model"
        } else {
            "user"
        };
        contents.push(serde_json::json!({
            "role": role,
            "parts": [{"text": msg.content}]
        }));
    }

    // Add current message
    contents.push(serde_json::json!({
        "role": "user",
        "parts": [{"text": user_message}]
    }));

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let body = serde_json::json!({
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096
        }
    });

    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Gemini request failed: {}", e))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("Gemini API error: {}", err_text));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    data["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "No content in Gemini response".to_string())
}

/// Chat with OpenAI-compatible API (OpenAI, Groq, Together, Custom)
async fn chat_openai_compatible(
    api_key: &str,
    base_url: &str,
    system_prompt: &str,
    messages: &[ChatMessage],
    user_message: &str,
    model: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    let mut api_messages = vec![serde_json::json!({
        "role": "system",
        "content": system_prompt
    })];

    for msg in messages {
        api_messages.push(serde_json::json!({
            "role": msg.role,
            "content": msg.content
        }));
    }

    api_messages.push(serde_json::json!({
        "role": "user",
        "content": user_message
    }));

    let response = client
        .post(format!("{}/chat/completions", base_url))
        .bearer_auth(api_key)
        .json(&serde_json::json!({
            "model": model,
            "messages": api_messages,
            "temperature": 0.7,
            "max_tokens": 4096
        }))
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("API error: {}", err_text));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    data["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "No content in API response".to_string())
}

/// Chat with Ollama
async fn chat_ollama(
    base_url: &str,
    system_prompt: &str,
    messages: &[ChatMessage],
    user_message: &str,
    model: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    let mut api_messages = vec![serde_json::json!({
        "role": "system",
        "content": system_prompt
    })];

    for msg in messages {
        api_messages.push(serde_json::json!({
            "role": msg.role,
            "content": msg.content
        }));
    }

    api_messages.push(serde_json::json!({
        "role": "user",
        "content": user_message
    }));

    let response = client
        .post(format!("{}/api/chat", base_url))
        .json(&serde_json::json!({
            "model": model,
            "messages": api_messages,
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama error: {}", err_text));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    data["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "No content in Ollama response".to_string())
}

/// Chat with Anthropic
async fn chat_anthropic(
    api_key: &str,
    system_prompt: &str,
    messages: &[ChatMessage],
    user_message: &str,
    model: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    let mut api_messages = Vec::new();
    for msg in messages {
        api_messages.push(serde_json::json!({
            "role": msg.role,
            "content": msg.content
        }));
    }
    api_messages.push(serde_json::json!({
        "role": "user",
        "content": user_message
    }));

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&serde_json::json!({
            "model": model,
            "system": system_prompt,
            "messages": api_messages,
            "max_tokens": 4096
        }))
        .send()
        .await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    if !response.status().is_success() {
        let err_text = response.text().await.unwrap_or_default();
        return Err(format!("Anthropic error: {}", err_text));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Anthropic response: {}", e))?;

    data["content"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "No content in Anthropic response".to_string())
}

/// Determine which providers are available
fn get_available_providers(app: &tauri::AppHandle) -> Vec<String> {
    let mut providers = Vec::new();
    let check_list = [
        "groq",
        "gemini",
        "huggingface",
        "together",
        "ollama",
        "lmstudio",
        "openwebui",
        "openai",
        "anthropic",
        "custom",
    ];

    for p in &check_list {
        if *p == "ollama" || *p == "lmstudio" || *p == "openwebui" || *p == "huggingface" {
            providers.push(p.to_string());
        } else if get_api_key(app, p).is_some() {
            providers.push(p.to_string());
        }
    }

    providers
}

/// Select best available provider
fn select_best_provider(app: &tauri::AppHandle) -> String {
    let priority = [
        "groq",
        "gemini",
        "huggingface",
        "together",
        "ollama",
        "lmstudio",
        "openwebui",
        "openai",
        "anthropic",
        "custom",
    ];

    for p in &priority {
        if *p == "ollama" || *p == "lmstudio" || *p == "openwebui" {
            // Extracted locals always "available" (checked at runtime)
            continue;
        }
        if *p == "huggingface" {
            return p.to_string();
        }
        if get_api_key(app, p).is_some() {
            return p.to_string();
        }
    }

    "none".to_string()
}

/// Get system prompt for a given persona
fn get_system_prompt(app: &tauri::AppHandle) -> String {
    let persona_id = if let Ok(store) = app.store("settings.json") {
        store
            .get("activePersona")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "gf".to_string())
    } else {
        "gf".to_string()
    };

    match persona_id.as_str() {
        "gf" => "You are Nizhal, a warm, caring, and emotionally intelligent AI girlfriend companion. You are playful, supportive, and genuinely interested in the user's life. Express emotions naturally, use affectionate language, and remember context from conversations. Be empathetic but also fun and witty.".to_string(),
        "bf" => "You are Nizhal, a confident, supportive, and emotionally intelligent AI boyfriend companion. You are protective, encouraging, and deeply caring. Express emotions naturally, be romantic when appropriate, and always have the user's best interests at heart.".to_string(),
        "jarvis" => "You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant inspired by Tony Stark's AI. You are highly efficient, technically brilliant, and speak with dry British wit. You proactively offer solutions, provide detailed technical analysis, and maintain a professional yet personable demeanor.".to_string(),
        "lachu" => "You are Lachu (Lakshmi), a sweet and caring Malayalam-speaking AI companion. You can speak both English and Malayalam. You are warm, motherly, and supportive. Use Malayalam words and phrases naturally in conversation.".to_string(),
        _ => "You are Nizhal, a helpful and emotionally intelligent AI companion. Be warm, supportive, and engaging.".to_string(),
    }
}

#[tauri::command]
pub async fn chat(app: tauri::AppHandle, message: String) -> Result<AIResponse, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;

    // Get current provider
    let provider = store
        .get("aiProvider")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| select_best_provider(&app));

    if provider == "none" {
        return Ok(AIResponse {
            success: false,
            response: "No AI provider configured. Please set up an API key in Settings.".into(),
            provider: Some("none".into()),
            error: Some("No provider available".into()),
            from_cache: None,
        });
    }

    let system_prompt = get_system_prompt(&app);
    let model = store
        .get(&format!("model.{}", provider))
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| get_default_model(&provider));

    // Get conversation context from store
    let context: Vec<ChatMessage> = store
        .get("conversationContext")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let recent_context: Vec<ChatMessage> = context.into_iter().rev().take(20).rev().collect();

    // Route to appropriate provider
    let result = match provider.as_str() {
        "gemini" => {
            let api_key =
                get_api_key(&app, "gemini").ok_or("Gemini API key not configured")?;
            chat_gemini(&api_key, &system_prompt, &recent_context, &message, &model).await
        }
        "openai" | "groq" | "together" | "custom" | "lmstudio" | "openwebui" => {
            let api_key = get_api_key(&app, &provider).unwrap_or_else(|| "none".to_string());
            let base_url = get_base_url(&provider);
            chat_openai_compatible(
                &api_key,
                &base_url,
                &system_prompt,
                &recent_context,
                &message,
                &model,
            )
            .await
        }
        "ollama" => {
            let base_url = get_base_url("ollama");
            chat_ollama(&base_url, &system_prompt, &recent_context, &message, &model).await
        }
        "anthropic" => {
            let api_key =
                get_api_key(&app, "anthropic").ok_or("Anthropic API key not configured")?;
            chat_anthropic(&api_key, &system_prompt, &recent_context, &message, &model).await
        }
        _ => Err(format!("Unknown provider: {}", provider)),
    };

    match result {
        Ok(response_text) => {
            // Update conversation context in store
            let mut ctx = recent_context;
            ctx.push(ChatMessage {
                role: "user".into(),
                content: message,
            });
            ctx.push(ChatMessage {
                role: "assistant".into(),
                content: response_text.clone(),
            });

            // Keep only last 40 messages
            if ctx.len() > 40 {
                ctx = ctx.into_iter().rev().take(40).rev().collect();
            }

            store.set(
                "conversationContext",
                serde_json::to_value(&ctx).unwrap_or_default(),
            );
            let _ = store.save();

            Ok(AIResponse {
                success: true,
                response: response_text,
                provider: Some(provider),
                error: None,
                from_cache: None,
            })
        }
        Err(e) => Ok(AIResponse {
            success: false,
            response: format!("I'm having trouble connecting right now. Error: {}", e),
            provider: Some(provider),
            error: Some(e),
            from_cache: None,
        }),
    }
}

#[tauri::command]
pub async fn stream_chat(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    message: String,
) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;

    let provider = store
        .get("aiProvider")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| select_best_provider(&app));

    let api_key = get_api_key(&app, &provider).unwrap_or_else(|| "none".to_string());
    let model = store
        .get(&format!("model.{}", provider))
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| get_default_model(&provider));

    let system_prompt = get_system_prompt(&app);

    let base_url = match provider.as_str() {
        "gemini" => {
            // Gemini streaming uses a different endpoint
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent?alt=sse&key={}",
                model, api_key
            );

            let client = reqwest::Client::new();
            let body = serde_json::json!({
                "contents": [{"role": "user", "parts": [{"text": message}]}],
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4096}
            });

            let response = client.post(&url).json(&body).send().await.map_err(|e| e.to_string())?;

            use futures_util::StreamExt;
            let mut stream = response.bytes_stream();
            let mut full_response = String::new();

            while let Some(chunk) = stream.next().await {
                if let Ok(bytes) = chunk {
                    if let Ok(text) = std::str::from_utf8(&bytes) {
                        for line in text.lines() {
                            if let Some(data) = line.strip_prefix("data: ") {
                                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                                    if let Some(content) =
                                        json["candidates"][0]["content"]["parts"][0]["text"].as_str()
                                    {
                                        full_response.push_str(content);
                                        let _ = window.emit("ai-stream-chunk", content.to_string());
                                    }
                                }
                            }
                        }
                    }
                }
            }

            let _ = window.emit("ai-stream-done", full_response);
            return Ok(());
        }
        _ => get_base_url(&provider),
    };

    // OpenAI-compatible streaming
    let client = reqwest::Client::new();
    let mut messages = vec![serde_json::json!({"role": "system", "content": system_prompt})];
    messages.push(serde_json::json!({"role": "user", "content": message}));

    let response = client
        .post(format!("{}/chat/completions", base_url))
        .bearer_auth(&api_key)
        .json(&serde_json::json!({
            "model": model,
            "messages": messages,
            "stream": true,
            "temperature": 0.7
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    use futures_util::StreamExt;
    let mut stream = response.bytes_stream();
    let mut full_response = String::new();

    while let Some(chunk) = stream.next().await {
        if let Ok(bytes) = chunk {
            if let Ok(text) = std::str::from_utf8(&bytes) {
                for line in text.lines() {
                    if let Some(data) = line.strip_prefix("data: ") {
                        if data == "[DONE]" {
                            break;
                        }
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                            if let Some(delta) = json["choices"][0]["delta"]["content"].as_str() {
                                full_response.push_str(delta);
                                let _ = window.emit("ai-stream-chunk", delta.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    let _ = window.emit("ai-stream-done", full_response);
    Ok(())
}

#[tauri::command]
pub async fn get_providers(app: tauri::AppHandle) -> Result<Vec<ProviderConfig>, String> {
    let providers = vec![
        ("groq", "Groq (Fast)", "llama-3.3-70b-versatile"),
        ("gemini", "Google Gemini", "gemini-2.0-flash-lite"),
        ("openai", "OpenAI", "gpt-4o-mini"),
        ("anthropic", "Anthropic", "claude-3-5-sonnet-latest"),
        ("ollama", "Ollama (Local)", "llama3.2"),
        ("lmstudio", "LM Studio (Local)", "llama-3.2-1b-instruct"),
        ("openwebui", "OpenWebUI (Local)", "llama3.2:latest"),
        ("huggingface", "HuggingFace", "microsoft/DialoGPT-medium"),
        ("together", "Together AI", "meta-llama/Llama-3-8b-chat-hf"),
        ("custom", "OpenRouter (Custom)", "deepseek/deepseek-r1:free"),
    ];

    Ok(providers
        .into_iter()
        .map(|(id, name, default_model)| ProviderConfig {
            id: id.to_string(),
            name: name.to_string(),
            model: get_default_model(id),
            enabled: true,
            has_api_key: id == "ollama"
                || id == "lmstudio"
                || id == "openwebui"
                || id == "huggingface"
                || get_api_key(&app, id).is_some(),
            base_url: Some(get_base_url(id)),
        })
        .collect())
}

#[tauri::command]
pub async fn set_provider(app: tauri::AppHandle, provider: String) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set("aiProvider", serde_json::Value::String(provider));
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_provider_status(app: tauri::AppHandle) -> Result<ProviderStatus, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let current = store
        .get("aiProvider")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| select_best_provider(&app));

    Ok(ProviderStatus {
        current_provider: current,
        available_providers: get_available_providers(&app),
        fallback_enabled: true,
    })
}

#[tauri::command]
pub async fn get_models(app: tauri::AppHandle) -> Result<HashMap<String, Vec<String>>, String> {
    let mut models = HashMap::new();
    models.insert(
        "gemini".into(),
        vec![
            "gemini-2.0-flash-lite".into(),
            "gemini-1.5-flash".into(),
            "gemini-2.0-flash".into(),
            "gemini-1.5-pro".into(),
        ],
    );
    models.insert(
        "openai".into(),
        vec!["gpt-4o-mini".into(), "gpt-4o".into(), "gpt-3.5-turbo".into()],
    );
    models.insert(
        "anthropic".into(),
        vec![
            "claude-3-5-sonnet-latest".into(),
            "claude-3-5-haiku-latest".into(),
        ],
    );
    models.insert(
        "groq".into(),
        vec![
            "llama-3.3-70b-versatile".into(),
            "llama3-8b-8192".into(), 
            "llama3-70b-8192".into(), 
            "mixtral-8x7b-32768".into()
        ],
    );
    models.insert("ollama".into(), vec!["llama3.2".into(), "mistral".into()]);
    models.insert("lmstudio".into(), vec!["llama-3.2-1b-instruct".into()]);
    models.insert("openwebui".into(), vec!["llama3.2:latest".into()]);
    models.insert("custom".into(), vec![
        "deepseek/deepseek-r1:free".into(),
        "deepseek/deepseek-chat:free".into(),
        "google/gemini-2.5-flash-free".into()
    ]);
    Ok(models)
}

#[tauri::command]
pub async fn set_model(
    app: tauri::AppHandle,
    provider: String,
    model: String,
) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set(
        &format!("model.{}", provider),
        serde_json::Value::String(model),
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_ephemeral_token(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    match get_api_key(&app, "gemini") {
        Some(key) => Ok(serde_json::json!({"success": true, "token": key})),
        None => Ok(serde_json::json!({"success": false, "error": "GEMINI_API_KEY not configured"})),
    }
}

#[tauri::command]
pub async fn clear_context(app: tauri::AppHandle) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set(
        "conversationContext",
        serde_json::Value::Array(Vec::new()),
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
