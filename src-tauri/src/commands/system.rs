use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use sysinfo::System;

/// Shared application state
pub struct AppState {
    pub system: Mutex<System>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            system: Mutex::new(System::new_all()),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub os_version: String,
    pub hostname: String,
    pub cpu_count: usize,
    pub total_memory_gb: f64,
    pub used_memory_gb: f64,
    pub cpu_usage: f32,
}

#[derive(Serialize, Deserialize)]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub memory_used_gb: f64,
    pub memory_total_gb: f64,
    pub memory_percent: f64,
    pub uptime: u64,
}

#[derive(Serialize, Deserialize)]
pub struct PerformanceMode {
    pub is_low_end: bool,
    pub total_memory_gb: f64,
    pub cpu_cores: usize,
}

#[tauri::command]
pub async fn get_system_info(state: tauri::State<'_, AppState>) -> Result<SystemInfo, String> {
    let mut sys = state.system.lock().map_err(|e| e.to_string())?;
    sys.refresh_all();

    Ok(SystemInfo {
        os: System::name().unwrap_or_else(|| "Unknown".into()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".into()),
        hostname: System::host_name().unwrap_or_else(|| "Unknown".into()),
        cpu_count: sys.cpus().len(),
        total_memory_gb: sys.total_memory() as f64 / 1_073_741_824.0,
        used_memory_gb: sys.used_memory() as f64 / 1_073_741_824.0,
        cpu_usage: sys.global_cpu_usage(),
    })
}

#[tauri::command]
pub async fn get_system_stats(state: tauri::State<'_, AppState>) -> Result<SystemStats, String> {
    let mut sys = state.system.lock().map_err(|e| e.to_string())?;
    sys.refresh_all();

    let total = sys.total_memory() as f64 / 1_073_741_824.0;
    let used = sys.used_memory() as f64 / 1_073_741_824.0;

    Ok(SystemStats {
        cpu_usage: sys.global_cpu_usage(),
        memory_used_gb: used,
        memory_total_gb: total,
        memory_percent: if total > 0.0 {
            (used / total) * 100.0
        } else {
            0.0
        },
        uptime: System::uptime(),
    })
}

#[tauri::command]
pub async fn get_performance_mode(
    state: tauri::State<'_, AppState>,
) -> Result<PerformanceMode, String> {
    let sys = state.system.lock().map_err(|e| e.to_string())?;
    let total_gb = sys.total_memory() as f64 / 1_073_741_824.0;
    let cores = sys.cpus().len();

    Ok(PerformanceMode {
        is_low_end: total_gb < 4.0 || cores < 4,
        total_memory_gb: total_gb,
        cpu_cores: cores,
    })
}

#[tauri::command]
pub async fn open_external_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    // On Android/iOS, URL opening is handled by tauri-plugin-opener on the frontend
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        let _ = url;
        // No-op: use tauri-plugin-opener from frontend instead
    }
    Ok(())
}

#[tauri::command]
pub async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
pub async fn get_app_theme() -> Result<String, String> {
    // In Tauri, theme detection is best done on the frontend
    // This returns a default and the frontend overrides with CSS media query
    Ok("dark".to_string())
}
