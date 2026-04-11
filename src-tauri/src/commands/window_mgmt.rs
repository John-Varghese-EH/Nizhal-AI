use serde::{Deserialize, Serialize};
use tauri::Manager;

// Desktop-only imports for multi-window support
#[cfg(desktop)]
use tauri::{WebviewUrl, WebviewWindowBuilder};

#[derive(Serialize, Deserialize, Clone)]
pub struct MonitorInfo {
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
}

#[derive(Serialize, Deserialize)]
pub struct WindowState {
    pub is_maximized: bool,
    pub is_minimized: bool,
    pub is_visible: bool,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Position {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Platform info returned to frontend for adaptive behavior
#[derive(Serialize, Deserialize, Clone)]
pub struct PlatformInfo {
    pub platform: String,       // "windows", "macos", "linux", "android", "ios"
    pub is_mobile: bool,
    pub is_desktop: bool,
    pub supports_overlay: bool, // true on Android (SYSTEM_ALERT_WINDOW) and desktop
    pub supports_local_ai: bool, // true only on desktop (Ollama, etc.)
}

#[tauri::command]
pub async fn get_platform_info() -> Result<PlatformInfo, String> {
    let platform = if cfg!(target_os = "android") {
        "android"
    } else if cfg!(target_os = "ios") {
        "ios"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    };

    let is_mobile = cfg!(any(target_os = "android", target_os = "ios"));

    Ok(PlatformInfo {
        platform: platform.to_string(),
        is_mobile,
        is_desktop: !is_mobile,
        supports_overlay: !cfg!(target_os = "ios"), // All except iOS
        supports_local_ai: !is_mobile,
    })
}

// ============================================================
// Desktop-only window management commands
// These use multi-window APIs not available on mobile
// ============================================================

#[tauri::command]
pub async fn get_available_monitors(app: tauri::AppHandle) -> Result<Vec<MonitorInfo>, String> {
    #[cfg(desktop)]
    {
        let monitors = app.available_monitors().map_err(|e| e.to_string())?;
        Ok(monitors.into_iter().map(|m| {
            MonitorInfo {
                name: m.name().map(|n| n.to_string()).unwrap_or_else(|| "Unknown".to_string()),
                width: m.size().width,
                height: m.size().height,
                x: m.position().x,
                y: m.position().y,
            }
        }).collect())
    }
    #[cfg(not(desktop))]
    {
        let _ = app;
        Ok(vec![])
    }
}

#[tauri::command]
pub async fn set_character_monitor(app: tauri::AppHandle, monitor_name: String) -> Result<(), String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            let monitors = app.available_monitors().map_err(|e| e.to_string())?;
            if let Some(target) = monitors.iter().find(|m| m.name().map_or(false, |n| n == monitor_name.as_str())) {
                window.set_position(target.position().clone()).map_err(|e| e.to_string())?;
                let _ = window.unmaximize();
                let _ = window.maximize();
            }
        }
    }
    #[cfg(not(desktop))]
    {
        let _ = (app, monitor_name);
    }
    Ok(())
}

#[tauri::command]
pub async fn minimize_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn maximize_window(window: tauri::WebviewWindow) -> Result<bool, String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.maximize().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
pub async fn close_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn show_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn hide_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_window_state(window: tauri::WebviewWindow) -> Result<WindowState, String> {
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let pos = window.outer_position().map_err(|e| e.to_string())?;

    Ok(WindowState {
        is_maximized: window.is_maximized().unwrap_or(false),
        is_minimized: window.is_minimized().unwrap_or(false),
        is_visible: window.is_visible().unwrap_or(true),
        width: size.width,
        height: size.height,
        x: pos.x,
        y: pos.y,
    })
}

#[tauri::command]
pub async fn create_character_window(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(desktop)]
    {
        // Check if window already exists
        if app.get_webview_window("character").is_some() {
            return Ok(());
        }

        let _character_window = WebviewWindowBuilder::new(
            &app,
            "character",
            WebviewUrl::App("character.html".into()),
        )
        .title("Nizhal Character")
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .maximized(true)
        .shadow(false)
        .build()
        .map_err(|e| e.to_string())?;

        // Default to click-through for full screen overlay
        let _ = _character_window.set_ignore_cursor_events(true);
    }
    #[cfg(not(desktop))]
    {
        let _ = app;
        // On mobile, overlay is handled natively (Android OverlayService / iOS PiP)
        // This is a no-op — the frontend will use PlatformBridge to trigger native overlay
    }
    Ok(())
}

#[tauri::command]
pub async fn show_character_window(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            window.show().map_err(|e| e.to_string())?;
        }
    }
    #[cfg(not(desktop))]
    { let _ = app; }
    Ok(())
}

#[tauri::command]
pub async fn hide_character_window(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            window.hide().map_err(|e| e.to_string())?;
        }
    }
    #[cfg(not(desktop))]
    { let _ = app; }
    Ok(())
}

#[tauri::command]
pub async fn set_character_position(
    app: tauri::AppHandle,
    x: i32,
    y: i32,
) -> Result<(), String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            window
                .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
                .map_err(|e| e.to_string())?;
        }
    }
    #[cfg(not(desktop))]
    { let _ = (app, x, y); }
    Ok(())
}

#[tauri::command]
pub async fn set_character_size(
    app: tauri::AppHandle,
    width: u32,
    height: u32,
) -> Result<(), String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            window
                .set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
                .map_err(|e| e.to_string())?;
        }
    }
    #[cfg(not(desktop))]
    { let _ = (app, width, height); }
    Ok(())
}

#[tauri::command]
pub async fn snap_character(app: tauri::AppHandle, position: String) -> Result<(), String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            let monitor = window.current_monitor().map_err(|e| e.to_string())?;
            if let Some(monitor) = monitor {
                let size = monitor.size();
                let position_margin = 20;
                
                let char_size = window.outer_size().unwrap_or(tauri::PhysicalSize { width: 300, height: 400 });

                let mut x = monitor.position().x;
                let mut y = monitor.position().y;

                match position.as_str() {
                    "top-right" => {
                        x += size.width as i32 - char_size.width as i32 - position_margin;
                        y += position_margin;
                    }
                    "bottom-right" => {
                        x += size.width as i32 - char_size.width as i32 - position_margin;
                        y += size.height as i32 - char_size.height as i32 - position_margin - 40;
                    }
                    "bottom-left" => {
                        x += position_margin;
                        y += size.height as i32 - char_size.height as i32 - position_margin - 40;
                    }
                    _ => {}
                }

                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
                    .map_err(|e| e.to_string())?;
            }
        }
    }
    #[cfg(not(desktop))]
    { let _ = (app, position); }
    Ok(())
}

#[tauri::command]
pub async fn get_character_position(app: tauri::AppHandle) -> Result<Position, String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            let pos = window.outer_position().map_err(|e| e.to_string())?;
            let size = window.outer_size().map_err(|e| e.to_string())?;
            return Ok(Position {
                x: pos.x,
                y: pos.y,
                width: size.width,
                height: size.height,
            });
        }
    }
    #[cfg(not(desktop))]
    { let _ = app; }
    Ok(Position {
        x: 0,
        y: 0,
        width: 300,
        height: 400,
    })
}

#[tauri::command]
pub async fn toggle_character_always_on_top(app: tauri::AppHandle) -> Result<bool, String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            let current = window.is_always_on_top().unwrap_or(false);
            window
                .set_always_on_top(!current)
                .map_err(|e| e.to_string())?;
            return Ok(!current);
        }
    }
    #[cfg(not(desktop))]
    { let _ = app; }
    Ok(false)
}

#[tauri::command]
pub async fn set_character_click_through(
    app: tauri::AppHandle,
    enable: bool,
) -> Result<(), String> {
    #[cfg(desktop)]
    {
        if let Some(window) = app.get_webview_window("character") {
            window
                .set_ignore_cursor_events(enable)
                .map_err(|e| e.to_string())?;
        }
    }
    #[cfg(not(desktop))]
    { let _ = (app, enable); }
    Ok(())
}

// ============================================================
// Desktop-only: Window polling for 3D collision detection
// ============================================================

// Struct to store window rects for React Three Fiber collision
#[derive(Serialize, Deserialize, Clone)]
pub struct WindowRect {
    pub id: u32,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct WindowUpdatePayload {
    pub windows: Vec<WindowRect>,
    pub character: Option<Position>,
}

#[cfg(windows)]
pub fn start_window_polling(app: tauri::AppHandle) {
    use std::time::Duration;
    use tauri::Emitter;
    use winapi::shared::windef::{HWND, RECT};

    let mut was_alt_pressed = false;

    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_millis(100)); // ~10Hz
            
            // Only poll if character window exists and needs environment mapping
            if app.get_webview_window("character").is_none() {
                continue;
            }

            let mut windows = Vec::new();
            
            unsafe extern "system" fn enum_windows_proc(hwnd: HWND, lparam: isize) -> i32 {
                let windows_ptr = lparam as *mut Vec<WindowRect>;
                let windows = &mut *windows_ptr;

                if winapi::um::winuser::IsWindowVisible(hwnd) != 0 {
                    let mut rect = RECT { left: 0, top: 0, right: 0, bottom: 0 };
                    if winapi::um::winuser::GetWindowRect(hwnd, &mut rect) != 0 {
                        let width = rect.right - rect.left;
                        let height = rect.bottom - rect.top;
                        
                        if width > 150 && height > 150 && rect.left > -10000 {
                            windows.push(WindowRect {
                                id: hwnd as usize as u32,
                                x: rect.left,
                                y: rect.top,
                                width,
                                height,
                            });
                        }
                    }
                }
                1 // Continue
            }

            unsafe {
                winapi::um::winuser::EnumWindows(Some(enum_windows_proc), &mut windows as *mut Vec<WindowRect> as isize);
            }

            let payload = WindowUpdatePayload {
                windows,
                character: None, 
            };

            let _ = app.emit("window:update", payload);

            // --- Alt Key Interaction Hook ---
            unsafe {
                let alt_state = winapi::um::winuser::GetAsyncKeyState(winapi::um::winuser::VK_MENU) as i16;
                let is_alt_pressed = alt_state < 0;

                if is_alt_pressed != was_alt_pressed {
                    was_alt_pressed = is_alt_pressed;
                    
                    if let Some(char_win) = app.get_webview_window("character") {
                        let _ = char_win.set_ignore_cursor_events(!is_alt_pressed);
                    }
                }
            }
        }
    });
}

// ============================================================
// Mobile-specific commands
// ============================================================

/// Check if the app is running on a mobile device
#[tauri::command]
pub async fn is_mobile_platform() -> Result<bool, String> {
    Ok(cfg!(any(target_os = "android", target_os = "ios")))
}

/// Get device performance tier for adaptive rendering
/// Returns: "high", "medium", or "low"
#[tauri::command]
pub async fn get_device_tier(state: tauri::State<'_, super::system::AppState>) -> Result<String, String> {
    let sys = state.system.lock().map_err(|e| e.to_string())?;
    let total_gb = sys.total_memory() as f64 / 1_073_741_824.0;
    let cores = sys.cpus().len();

    let tier = if total_gb >= 6.0 && cores >= 6 {
        "high"
    } else if total_gb >= 4.0 && cores >= 4 {
        "medium"
    } else {
        "low"
    };

    Ok(tier.to_string())
}
