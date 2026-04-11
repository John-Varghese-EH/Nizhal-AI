use serde::{Deserialize, Serialize};
use tauri::Manager;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MemoryEntry {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct UserPreferences {
    #[serde(default)]
    pub voice_enabled: bool,
    #[serde(default)]
    pub privacy_mode: bool,
    #[serde(default)]
    pub onboarding_complete: bool,
    #[serde(default)]
    pub gemini_api_key: Option<String>,
    #[serde(flatten)]
    pub extra: std::collections::HashMap<String, serde_json::Value>,
}

#[tauri::command]
pub async fn get_history(
    app: tauri::AppHandle,
    limit: Option<usize>,
) -> Result<Vec<MemoryEntry>, String> {
    let store = app.store("memory.json").map_err(|e| e.to_string())?;
    let entries: Vec<MemoryEntry> = store
        .get("history")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let limit = limit.unwrap_or(50);
    Ok(entries.into_iter().rev().take(limit).rev().collect())
}

#[tauri::command]
pub async fn search_memory(
    app: tauri::AppHandle,
    query: String,
) -> Result<Vec<MemoryEntry>, String> {
    let store = app.store("memory.json").map_err(|e| e.to_string())?;
    let entries: Vec<MemoryEntry> = store
        .get("history")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let query_lower = query.to_lowercase();
    let results: Vec<MemoryEntry> = entries
        .into_iter()
        .filter(|e| e.content.to_lowercase().contains(&query_lower))
        .collect();

    Ok(results)
}

#[tauri::command]
pub async fn add_entry(app: tauri::AppHandle, entry: MemoryEntry) -> Result<(), String> {
    let store = app.store("memory.json").map_err(|e| e.to_string())?;
    let mut entries: Vec<MemoryEntry> = store
        .get("history")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    entries.push(entry);

    // Keep last 1000 entries
    if entries.len() > 1000 {
        entries = entries.into_iter().rev().take(1000).rev().collect();
    }

    store.set(
        "history",
        serde_json::to_value(&entries).unwrap_or_default(),
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_user_preferences(
    app: tauri::AppHandle,
) -> Result<UserPreferences, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let prefs = store
        .get("userPreferences")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(prefs)
}

#[tauri::command]
pub async fn set_user_preferences(
    app: tauri::AppHandle,
    prefs: UserPreferences,
) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set(
        "userPreferences",
        serde_json::to_value(&prefs).unwrap_or_default(),
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_privacy_mode(app: tauri::AppHandle) -> Result<bool, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let prefs_val = store.get("userPreferences");
    let privacy = prefs_val
        .as_ref()
        .and_then(|v| v.get("privacy_mode"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    Ok(privacy)
}

#[tauri::command]
pub async fn set_privacy_mode(
    app: tauri::AppHandle,
    enabled: bool,
) -> Result<bool, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut prefs: UserPreferences = store
        .get("userPreferences")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    prefs.privacy_mode = enabled;
    store.set(
        "userPreferences",
        serde_json::to_value(&prefs).unwrap_or_default(),
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(enabled)
}
