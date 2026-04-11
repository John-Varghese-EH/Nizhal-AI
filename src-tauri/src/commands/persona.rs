use serde::{Deserialize, Serialize};
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Persona {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub color: String,
    pub icon: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PersonaState {
    pub mood: String,
    pub emotion: String,
    pub energy: f32,
    pub engagement: f32,
}

impl Default for PersonaState {
    fn default() -> Self {
        Self {
            mood: "neutral".into(),
            emotion: "calm".into(),
            energy: 0.7,
            engagement: 0.5,
        }
    }
}

fn get_all_persona_defs() -> Vec<Persona> {
    vec![
        Persona {
            id: "gf".into(),
            name: "Girlfriend".into(),
            display_name: "Girlfriend Mode".into(),
            description: "Warm, caring AI companion with emotional intelligence".into(),
            color: "#ff6b9d".into(),
            icon: "💕".into(),
        },
        Persona {
            id: "bf".into(),
            name: "Boyfriend".into(),
            display_name: "Boyfriend Mode".into(),
            description: "Confident, supportive AI companion".into(),
            color: "#6b8cff".into(),
            icon: "💙".into(),
        },
        Persona {
            id: "jarvis".into(),
            name: "JARVIS".into(),
            display_name: "JARVIS Mode".into(),
            description: "Advanced AI assistant with dry British wit".into(),
            color: "#00d4ff".into(),
            icon: "🤖".into(),
        },
        Persona {
            id: "lachu".into(),
            name: "Lakshmi".into(),
            display_name: "Lachu Mode".into(),
            description: "Sweet Malayalam-speaking AI companion".into(),
            color: "#ffd700".into(),
            icon: "🌸".into(),
        },
        Persona {
            id: "auto".into(),
            name: "Auto".into(),
            display_name: "Auto Mode".into(),
            description: "Automatically adapts personality to context".into(),
            color: "#a855f7".into(),
            icon: "✨".into(),
        },
    ]
}

#[tauri::command]
pub async fn get_active_persona(app: tauri::AppHandle) -> Result<Persona, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let active_id = store
        .get("activePersona")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "gf".to_string());

    get_all_persona_defs()
        .into_iter()
        .find(|p| p.id == active_id)
        .ok_or_else(|| "Persona not found".to_string())
}

#[tauri::command]
pub async fn set_active_persona(app: tauri::AppHandle, persona_id: String) -> Result<Persona, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set("activePersona", serde_json::Value::String(persona_id.clone()));
    store.save().map_err(|e| e.to_string())?;

    get_all_persona_defs()
        .into_iter()
        .find(|p| p.id == persona_id)
        .ok_or_else(|| "Persona not found".to_string())
}

#[tauri::command]
pub async fn get_all_personas() -> Result<Vec<Persona>, String> {
    Ok(get_all_persona_defs())
}

#[tauri::command]
pub async fn get_persona_state(app: tauri::AppHandle) -> Result<PersonaState, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let state = store
        .get("personaState")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(state)
}

#[tauri::command]
pub async fn update_mood(app: tauri::AppHandle, mood: String) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut state: PersonaState = store
        .get("personaState")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    state.mood = mood;
    store.set(
        "personaState",
        serde_json::to_value(&state).unwrap_or_default(),
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_personality_config(
    app: tauri::AppHandle,
    mode: Option<String>,
) -> Result<serde_json::Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let active = mode.unwrap_or_else(|| {
        store
            .get("activePersona")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "gf".to_string())
    });

    let persona = get_all_persona_defs()
        .into_iter()
        .find(|p| p.id == active);

    match persona {
        Some(p) => Ok(serde_json::to_value(p).unwrap_or_default()),
        None => Err("Persona not found".to_string()),
    }
}
