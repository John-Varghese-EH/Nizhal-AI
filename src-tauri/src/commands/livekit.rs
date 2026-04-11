use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct LiveKitStatus {
    pub configured: bool,
    pub url: Option<String>,
    pub agent_running: bool,
}

#[derive(Serialize, Deserialize)]
pub struct LiveKitConnectionResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub room_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

fn is_livekit_configured() -> bool {
    std::env::var("LIVEKIT_URL").is_ok()
        && std::env::var("LIVEKIT_API_KEY").is_ok()
        && std::env::var("LIVEKIT_API_SECRET").is_ok()
}

#[tauri::command]
pub async fn livekit_connect(
    _app: tauri::AppHandle,
    user_name: Option<String>,
    room_name: Option<String>,
) -> Result<LiveKitConnectionResult, String> {
    if !is_livekit_configured() {
        return Ok(LiveKitConnectionResult {
            success: false,
            token: None,
            url: None,
            room_name: None,
            error: Some("LiveKit not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in .env".into()),
        });
    }

    let url = std::env::var("LIVEKIT_URL").unwrap_or_default();
    let _api_key = std::env::var("LIVEKIT_API_KEY").unwrap_or_default();
    let _api_secret = std::env::var("LIVEKIT_API_SECRET").unwrap_or_default();

    let room = room_name.unwrap_or_else(|| {
        format!("nizhal-{}", uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("room"))
    });

    // Note: Full JWT token generation would require a LiveKit JWT library
    // For now, return the config for frontend to connect via the LiveKit backend server
    Ok(LiveKitConnectionResult {
        success: true,
        token: None, // Token will be fetched from livekit-backend server
        url: Some(url),
        room_name: Some(room),
        error: None,
    })
}

#[tauri::command]
pub async fn livekit_disconnect() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
pub async fn livekit_get_status() -> Result<LiveKitStatus, String> {
    Ok(LiveKitStatus {
        configured: is_livekit_configured(),
        url: std::env::var("LIVEKIT_URL").ok(),
        agent_running: false, // Would need process tracking
    })
}

#[tauri::command]
pub async fn livekit_start_agent(
    app: tauri::AppHandle,
    personality: Option<String>,
    room_name: Option<String>,
) -> Result<serde_json::Value, String> {
    if !is_livekit_configured() {
        return Ok(serde_json::json!({"success": false, "error": "LiveKit not configured"}));
    }

    // Use tauri shell plugin to start the Python agent
    use tauri_plugin_shell::ShellExt;
    let personality = personality.unwrap_or_else(|| "gf".into());

    let shell = app.shell();
    let result = shell
        .command("python")
        .args([
            "livekit-agent/agent.py",
            "--personality",
            &personality,
        ])
        .spawn();

    match result {
        Ok(_child) => Ok(serde_json::json!({"success": true, "personality": personality})),
        Err(e) => Ok(serde_json::json!({"success": false, "error": e.to_string()})),
    }
}

#[tauri::command]
pub async fn livekit_stop_agent() -> Result<serde_json::Value, String> {
    // Agent process management would need proper PID tracking
    Ok(serde_json::json!({"success": true}))
}
