/**
 * ws_bridge.rs — WebSocket Bridge Server for the Nizhal Browser Extension
 *
 * Spins up a local WebSocket server on a configurable port (default 9721)
 * that the browser extension connects to. All messages use a typed JSON
 * envelope: { "type": "...", "id": "...", "payload": {...} }
 *
 * The bridge proxies requests from the extension into the Tauri app's
 * existing command infrastructure, keeping ALL business logic inside the
 * main Tauri process and treating the extension as a "dumb terminal."
 */

use futures_util::{SinkExt, StreamExt};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::Message;

// ─── Types ────────────────────────────────────────────────────────────

/// Envelope for every message crossing the WebSocket.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsEnvelope {
    /// Message type: "chat", "status", "page_context", "ping", "error", etc.
    #[serde(rename = "type")]
    pub msg_type: String,
    /// Unique request ID so the extension can correlate responses.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    /// Arbitrary JSON payload.
    #[serde(default)]
    pub payload: serde_json::Value,
}

// Internal server state — tracks whether the WS server is running.
lazy_static! {
    static ref WS_RUNNING: AtomicBool = AtomicBool::new(false);
    static ref WS_PORT: Mutex<u16> = Mutex::new(9721);
    /// Broadcast channel to push events from Tauri → all connected extensions.
    static ref EVENT_TX: Mutex<Option<broadcast::Sender<String>>> = Mutex::new(None);
}

// ─── Tauri Commands ───────────────────────────────────────────────────

/// Start the WebSocket bridge server on the configured port.
#[tauri::command]
pub async fn start_ws_bridge(port: Option<u16>) -> Result<u16, String> {
    let port = port.unwrap_or(9721);

    if WS_RUNNING.load(Ordering::SeqCst) {
        return Ok(port); // Already running — idempotent
    }

    // Set the port
    if let Ok(mut p) = WS_PORT.lock() {
        *p = port;
    }

    // Create the broadcast channel for outbound events
    let (tx, _) = broadcast::channel::<String>(128);
    if let Ok(mut etx) = EVENT_TX.lock() {
        *etx = Some(tx.clone());
    }

    // Spawn the server on a background Tokio task
    tokio::spawn(async move {
        if let Err(e) = run_ws_server(port, tx).await {
            log::error!("[WsBridge] Server error: {}", e);
            WS_RUNNING.store(false, Ordering::SeqCst);
        }
    });

    WS_RUNNING.store(true, Ordering::SeqCst);
    log::info!("[WsBridge] Started on ws://localhost:{}", port);
    Ok(port)
}

/// Stop the WebSocket bridge server.
#[tauri::command]
pub fn stop_ws_bridge() -> Result<(), String> {
    WS_RUNNING.store(false, Ordering::SeqCst);
    if let Ok(mut etx) = EVENT_TX.lock() {
        *etx = None;
    }
    log::info!("[WsBridge] Server stopped");
    Ok(())
}

/// Check the bridge status.
#[tauri::command]
pub fn ws_bridge_status() -> Result<serde_json::Value, String> {
    let running = WS_RUNNING.load(Ordering::SeqCst);
    let port = WS_PORT.lock().map(|p| *p).unwrap_or(9721);
    Ok(serde_json::json!({
        "running": running,
        "port": port,
        "url": format!("ws://localhost:{}", port)
    }))
}

/// Push an event to all connected extension clients.
#[tauri::command]
pub fn ws_bridge_emit(event_type: String, payload: serde_json::Value) -> Result<(), String> {
    let envelope = WsEnvelope {
        msg_type: event_type,
        id: None,
        payload,
    };
    let json = serde_json::to_string(&envelope).map_err(|e| e.to_string())?;

    if let Ok(etx) = EVENT_TX.lock() {
        if let Some(tx) = etx.as_ref() {
            let _ = tx.send(json); // Ignore errors if no receivers
        }
    }
    Ok(())
}

// ─── Server Implementation ───────────────────────────────────────────

async fn run_ws_server(
    port: u16,
    event_tx: broadcast::Sender<String>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr).await?;
    log::info!("[WsBridge] Listening on {}", addr);

    while WS_RUNNING.load(Ordering::SeqCst) {
        // Accept with a timeout so we can check the running flag
        let accept_result = tokio::time::timeout(
            std::time::Duration::from_secs(2),
            listener.accept(),
        )
        .await;

        match accept_result {
            Ok(Ok((stream, peer))) => {
                log::info!("[WsBridge] New connection from {}", peer);
                let _tx = event_tx.clone();
                let mut rx = event_tx.subscribe();

                tokio::spawn(async move {
                    match accept_async(stream).await {
                        Ok(ws_stream) => {
                            let (mut write, mut read) = ws_stream.split();

                            // Send a welcome message
                            let welcome = serde_json::json!({
                                "type": "connected",
                                "payload": {
                                    "version": "1.0.0",
                                    "app": "Nizhal AI",
                                    "capabilities": ["chat", "status", "page_context"]
                                }
                            });
                            let _ = write
                                .send(Message::Text(welcome.to_string().into()))
                                .await;

                            loop {
                                tokio::select! {
                                    // Inbound: messages from the extension
                                    msg = read.next() => {
                                        match msg {
                                            Some(Ok(Message::Text(text))) => {
                                                let response = handle_extension_message(&text).await;
                                                let _ = write.send(Message::Text(response.into())).await;
                                            }
                                            Some(Ok(Message::Ping(data))) => {
                                                let _ = write.send(Message::Pong(data)).await;
                                            }
                                            Some(Ok(Message::Close(_))) | None => {
                                                log::info!("[WsBridge] Client {} disconnected", peer);
                                                break;
                                            }
                                            _ => {} // Ignore binary, pong, etc.
                                        }
                                    }
                                    // Outbound: events pushed from Tauri → extension
                                    event = rx.recv() => {
                                        if let Ok(event_json) = event {
                                            let _ = write.send(Message::Text(event_json.into())).await;
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            log::error!("[WsBridge] WebSocket handshake failed: {}", e);
                        }
                    }
                });
            }
            Ok(Err(e)) => {
                log::error!("[WsBridge] Accept error: {}", e);
            }
            Err(_) => {
                // Timeout — just loop back and check WS_RUNNING
            }
        }
    }

    log::info!("[WsBridge] Server loop exited cleanly");
    Ok(())
}

/// Route an inbound message from the extension to the appropriate handler.
async fn handle_extension_message(raw: &str) -> String {
    let envelope: WsEnvelope = match serde_json::from_str(raw) {
        Ok(e) => e,
        Err(e) => {
            return make_error(None, &format!("Invalid message format: {}", e));
        }
    };

    let response_payload = match envelope.msg_type.as_str() {
        // ── Heartbeat ───
        "ping" => serde_json::json!({ "pong": true, "ts": chrono::Utc::now().to_rfc3339() }),

        // ── Chat request ───
        "chat" => {
            let user_msg = envelope
                .payload
                .get("message")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let page_ctx = envelope
                .payload
                .get("pageContext")
                .cloned()
                .unwrap_or(serde_json::Value::Null);

            // Build response envelope — the actual AI call is handled on the frontend
            // via the existing AIService. Here we just relay it.
            serde_json::json!({
                "acknowledged": true,
                "message": user_msg,
                "pageContext": page_ctx,
                "hint": "Route this through AIService on the main frontend"
            })
        }

        // ── Status query ───
        "status" => serde_json::json!({
            "app": "Nizhal AI",
            "version": "1.0.0",
            "status": "running",
            "uptime_ms": std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis())
                .unwrap_or(0)
        }),

        // ── Page context received ───
        "page_context" => {
            // The extension sends the active tab's content for AI processing
            serde_json::json!({
                "received": true,
                "url": envelope.payload.get("url"),
                "title": envelope.payload.get("title")
            })
        }

        _ => serde_json::json!({
            "error": format!("Unknown message type: {}", envelope.msg_type)
        }),
    };

    let response = WsEnvelope {
        msg_type: format!("{}_response", envelope.msg_type),
        id: envelope.id,
        payload: response_payload,
    };

    serde_json::to_string(&response).unwrap_or_else(|_| {
        r#"{"type":"error","payload":{"message":"Serialization failed"}}"#.to_string()
    })
}

/// Utility: build an error response envelope.
fn make_error(id: Option<String>, message: &str) -> String {
    let envelope = WsEnvelope {
        msg_type: "error".to_string(),
        id,
        payload: serde_json::json!({ "message": message }),
    };
    serde_json::to_string(&envelope).unwrap_or_default()
}
