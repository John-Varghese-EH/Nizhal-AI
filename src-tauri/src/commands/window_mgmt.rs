use serde::{Deserialize, Serialize};
use tauri::Manager;
use tauri::{WebviewUrl, WebviewWindowBuilder};

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

    Ok(())
}

#[tauri::command]
pub async fn show_character_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("character") {
        window.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn hide_character_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("character") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn set_character_position(
    app: tauri::AppHandle,
    x: i32,
    y: i32,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("character") {
        window
            .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn set_character_size(
    app: tauri::AppHandle,
    width: u32,
    height: u32,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("character") {
        window
            .set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn snap_character(app: tauri::AppHandle, position: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("character") {
        let monitor = window.current_monitor().map_err(|e| e.to_string())?;
        if let Some(monitor) = monitor {
            let size = monitor.size();
            let position_margin = 20;
            
            // Assume character window size is roughly 300x400 if not retrieved
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
                    y += size.height as i32 - char_size.height as i32 - position_margin - 40; // 40 for taskbar
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
    Ok(())
}

#[tauri::command]
pub async fn get_character_position(app: tauri::AppHandle) -> Result<Position, String> {
    if let Some(window) = app.get_webview_window("character") {
        let pos = window.outer_position().map_err(|e| e.to_string())?;
        let size = window.outer_size().map_err(|e| e.to_string())?;
        Ok(Position {
            x: pos.x,
            y: pos.y,
            width: size.width,
            height: size.height,
        })
    } else {
        Ok(Position {
            x: 0,
            y: 0,
            width: 300,
            height: 400,
        })
    }
}

#[tauri::command]
pub async fn toggle_character_always_on_top(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("character") {
        let current = window.is_always_on_top().unwrap_or(false);
        window
            .set_always_on_top(!current)
            .map_err(|e| e.to_string())?;
        Ok(!current)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn set_character_click_through(
    app: tauri::AppHandle,
    enable: bool,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("character") {
        window
            .set_ignore_cursor_events(enable)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

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
                        
                        // Ignore extremely small windows or taskbars if needed (taskbar usually left for default)
                        // Ignore windows off screen
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
        }
    });
}
