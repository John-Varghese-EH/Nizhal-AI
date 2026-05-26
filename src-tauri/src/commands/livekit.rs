use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::process::Child;

lazy_static::lazy_static! {
    static ref ACTIVE_AGENT_PROCESS: Mutex<Option<Child>> = Mutex::new(None);
}

/// Stop the active Python agent process safely and free its resources.
pub fn cleanup_livekit_agent() {
    stop_active_agent();
}

fn stop_active_agent() {
    match ACTIVE_AGENT_PROCESS.lock() {
        Ok(mut lock) => {
            if let Some(mut child) = lock.take() {
                println!("[LiveKit] Terminating active agent process (PID={})", child.id());
                let _ = child.kill();
                match child.wait() {
                    Ok(status) => println!("[LiveKit] Agent process terminated with status: {}", status),
                    Err(e) => eprintln!("[LiveKit] Error waiting for agent process termination: {}", e),
                }
            }
        }
        Err(e) => {
            eprintln!("[LiveKit] Failed to lock agent process mutex for stop: {}", e);
        }
    }
}

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
    _user_name: Option<String>,
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
    let room = room_name.unwrap_or_else(|| {
        format!("nizhal-{}", uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("room"))
    });

    Ok(LiveKitConnectionResult {
        success: true,
        token: None, // Token fetched dynamically by client from livekit-backend
        url: Some(url),
        room_name: Some(room),
        error: None,
    })
}

#[tauri::command]
pub async fn livekit_disconnect() -> Result<serde_json::Value, String> {
    // If the frontend disconnects, we also ensure any companion agent is clean.
    stop_active_agent();
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
pub async fn livekit_get_status() -> Result<LiveKitStatus, String> {
    let agent_running = match ACTIVE_AGENT_PROCESS.lock() {
        Ok(mut lock) => {
            if let Some(ref mut child) = *lock {
                // Check if the process has exited without blocking
                match child.try_wait() {
                    Ok(None) => true, // Still running
                    _ => {
                        // Exited or error, clear the slot
                        *lock = None;
                        false
                    }
                }
            } else {
                false
            }
        }
        Err(_) => false,
    };

    Ok(LiveKitStatus {
        configured: is_livekit_configured(),
        url: std::env::var("LIVEKIT_URL").ok(),
        agent_running,
    })
}

#[tauri::command]
pub async fn livekit_start_agent(
    _app: tauri::AppHandle,
    personality: Option<String>,
    _room_name: Option<String>,
) -> Result<serde_json::Value, String> {
    if !is_livekit_configured() {
        return Ok(serde_json::json!({"success": false, "error": "LiveKit not configured"}));
    }

    // Strict schema-level validation of arguments before reaching system handlers
    super::validation::validate_personality(personality.as_deref())?;

    let personality = personality.unwrap_or_else(|| "gf".into());

    // Ensure we terminate any currently running agent to prevent resource orphans
    stop_active_agent();

    // Determine platform-appropriate command
    #[cfg(target_os = "windows")]
    let cmd = "python";
    #[cfg(not(target_os = "windows"))]
    let cmd = "python3";

    println!("[LiveKit] Spawning system Python agent with personality: {}", personality);

    let child_result = std::process::Command::new(cmd)
        .args([
            "livekit-agent/agent.py",
            "--personality",
            &personality,
        ])
        .spawn();

    // Fallback block if command search fails
    let child = match child_result {
        Ok(c) => c,
        Err(e) => {
            eprintln!("[LiveKit] Primary spawn failed: {}. Retrying with 'python'...", e);
            std::process::Command::new("python")
                .args([
                    "livekit-agent/agent.py",
                    "--personality",
                    &personality,
                ])
                .spawn()
                .map_err(|err| format!("Failed to spawn Python subprocess: {}", err))?
        }
    };

    let pid = child.id();
    println!("[LiveKit] Subprocess started successfully (PID={})", pid);

    // Save running process handle safely
    match ACTIVE_AGENT_PROCESS.lock() {
        Ok(mut lock) => {
            *lock = Some(child);
        }
        Err(e) => {
            return Err(format!("Failed to lock active process mutex: {}", e));
        }
    }

    Ok(serde_json::json!({
        "success": true, 
        "personality": personality,
        "pid": pid
    }))
}

#[tauri::command]
pub async fn livekit_stop_agent() -> Result<serde_json::Value, String> {
    stop_active_agent();
    Ok(serde_json::json!({"success": true}))
}
