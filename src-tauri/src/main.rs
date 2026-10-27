// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Fix for WebKitGTK transparency and composite buffer rendering on Wayland compositors (Niri, Hyprland, Sway)
        // 1. WEBKIT_DISABLE_DMABUF_RENDERER avoids driver buffer sync collisions on Wayland
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
        // 2. Disable NVIDIA explicit sync protocol conflict which stalls Wayland frame-clearing damage rects
        if std::env::var("__NV_DISABLE_EXPLICIT_SYNC").is_err() {
            std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");
        }
    }

    nizhal_ai_lib::run()
}
