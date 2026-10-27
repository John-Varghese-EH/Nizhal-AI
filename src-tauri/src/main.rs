// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Fix for WebKitGTK transparency and composite buffer rendering on Wayland compositors (Niri, Hyprland, Sway)
        // WEBKIT_DISABLE_DMABUF_RENDERER avoids driver buffer sync collisions
        // Note: Do NOT disable compositing mode (WEBKIT_DISABLE_COMPOSITING_MODE=1) because disabling GPU compositing
        // triggers CPU software fallback (Cairo SHM surfaces) which does not clear transparent damage rects, producing ghosting trails.
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    nizhal_ai_lib::run()
}
