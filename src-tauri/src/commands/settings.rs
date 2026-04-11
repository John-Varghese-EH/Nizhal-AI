use serde::{Deserialize, Serialize};
use tauri::Manager;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub default_model: String,
    pub temperature: f32,
    pub max_tokens: u32,
    pub stream: bool,
    pub font_size: u32,
    pub voice_enabled: bool,
    pub privacy_mode: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".into(),
            language: "en".into(),
            default_model: "gemini-1.5-flash".into(),
            temperature: 0.7,
            max_tokens: 4096,
            stream: true,
            font_size: 14,
            voice_enabled: false,
            privacy_mode: false,
        }
    }
}

#[tauri::command]
pub async fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let settings = store
        .get("appSettings")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(settings)
}

#[tauri::command]
pub async fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set(
        "appSettings",
        serde_json::to_value(&settings).unwrap_or_default(),
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_setting(
    app: tauri::AppHandle,
    category: String,
    key: Option<String>,
) -> Result<serde_json::Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let path = match key {
        Some(k) => format!("settings.{}.{}", category, k),
        None => format!("settings.{}", category),
    };
    Ok(store.get(&path).unwrap_or(serde_json::Value::Null))
}

#[tauri::command]
pub async fn set_setting(
    app: tauri::AppHandle,
    category: String,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let path = format!("settings.{}.{}", category, key);
    store.set(&path, value);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_all_settings(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    Ok(store
        .get("settings")
        .unwrap_or(serde_json::Value::Object(serde_json::Map::new())))
}

#[tauri::command]
pub async fn reset_settings(
    app: tauri::AppHandle,
    category: Option<String>,
) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    match category {
        Some(cat) => {
            store.delete(&format!("settings.{}", cat));
        }
        None => {
            store.delete("settings");
            store.set(
                "appSettings",
                serde_json::to_value(AppSettings::default()).unwrap(),
            );
        }
    }
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn export_settings(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut export = serde_json::Map::new();

    if let Some(settings) = store.get("settings") {
        export.insert("settings".into(), settings);
    }
    if let Some(app_settings) = store.get("appSettings") {
        export.insert("appSettings".into(), app_settings);
    }

    Ok(serde_json::Value::Object(export))
}

#[tauri::command]
pub async fn import_settings(
    app: tauri::AppHandle,
    data: serde_json::Value,
) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;

    if let Some(obj) = data.as_object() {
        for (key, value) in obj {
            store.set(key, value.clone());
        }
    }

    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
