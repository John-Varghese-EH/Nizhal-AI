use std::collections::HashMap;

#[tauri::command]
pub async fn get_all_env() -> Result<HashMap<String, String>, String> {
    let mut vars = HashMap::new();

    // Only expose specific expected keys, not the entire environment
    let allowed_keys = [
        "GEMINI_API_KEY",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GROQ_API_KEY",
        "HUGGINGFACE_API_KEY",
        "TOGETHER_API_KEY",
        "CUSTOM_API_KEY",
        "CUSTOM_BASE_URL",
        "CUSTOM_MODEL",
        "ELEVENLABS_API_KEY",
        "DEEPGRAM_API_KEY",
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "OLLAMA_URL",
    ];

    for key in &allowed_keys {
        if let Ok(val) = std::env::var(key) {
            // Mask sensitive values - only show last 4 chars
            if key.contains("KEY") || key.contains("SECRET") {
                if val.len() > 4 {
                    let masked = format!("{}...{}", &"*".repeat(val.len() - 4), &val[val.len() - 4..]);
                    vars.insert(key.to_string(), masked);
                } else {
                    vars.insert(key.to_string(), val);
                }
            } else {
                vars.insert(key.to_string(), val);
            }
        }
    }

    Ok(vars)
}

#[tauri::command]
pub async fn set_env(key: String, value: String) -> Result<(), String> {
    // Only allow setting specific keys
    let allowed_keys = [
        "GEMINI_API_KEY",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GROQ_API_KEY",
        "HUGGINGFACE_API_KEY",
        "TOGETHER_API_KEY",
        "CUSTOM_API_KEY",
        "CUSTOM_BASE_URL",
        "CUSTOM_MODEL",
        "ELEVENLABS_API_KEY",
        "DEEPGRAM_API_KEY",
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "OLLAMA_URL",
    ];

    if !allowed_keys.contains(&key.as_str()) {
        return Err(format!("Setting '{}' is not allowed", key));
    }

    std::env::set_var(&key, &value);
    Ok(())
}

#[tauri::command]
pub async fn delete_env(key: String) -> Result<(), String> {
    std::env::remove_var(&key);
    Ok(())
}
