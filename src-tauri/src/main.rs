// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // WebKitGTK & Wayland Rendering Configuration:
        // Do NOT set WEBKIT_DISABLE_DMABUF_RENDERER=1 on modern WebKitGTK (2.46+ / 2.54+):
        // Upstream WebKitGTK and Tauri Issue #14924 confirm that disabling the DMABUF renderer
        // forces fallback shared-memory (SHM) surfaces, which completely breaks buffer swapping
        // on transparent windows, leaving cumulative ghosting trails of every rendered frame!
        // Instead, ensure Mesa routes rendering through the primary Intel integrated GPU (renderD128)
        // to avoid NVIDIA secondary GPU DRI2/DMABUF sync collision.
        if std::env::var("DRI_PRIME").is_err() {
            std::env::set_var("DRI_PRIME", "pci-0000_00_02_0");
        }
        if std::env::var("__NV_DISABLE_EXPLICIT_SYNC").is_err() {
            std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");
        }
    }

    nizhal_ai_lib::run()
}
