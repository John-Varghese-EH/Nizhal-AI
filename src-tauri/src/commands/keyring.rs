use serde::Serialize;

const SERVICE_NAME: &str = "nizhal-ai";

#[derive(Serialize)]
pub struct KeyringStatus {
    pub available: bool,
    pub backend: String,
}

/// Save an API key to the OS keychain
#[tauri::command]
pub async fn keyring_save_key(service: String, key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &service)
        .map_err(|e| format!("Keyring init error: {}", e))?;
    entry
        .set_password(&key)
        .map_err(|e| format!("Keyring save error: {}", e))?;
    log::info!("[Keyring] Saved credential for: {}", service);
    Ok(())
}

/// Retrieve an API key from the OS keychain
#[tauri::command]
pub async fn keyring_get_key(service: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &service)
        .map_err(|e| format!("Keyring init error: {}", e))?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Keyring read error: {}", e)),
    }
}

/// Delete an API key from the OS keychain
#[tauri::command]
pub async fn keyring_delete_key(service: String) -> Result<(), String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &service)
        .map_err(|e| format!("Keyring init error: {}", e))?;
    match entry.delete_credential() {
        Ok(()) => {
            log::info!("[Keyring] Deleted credential for: {}", service);
            Ok(())
        }
        Err(keyring::Error::NoEntry) => Ok(()), // Already gone
        Err(e) => Err(format!("Keyring delete error: {}", e)),
    }
}

/// Check if a key exists in the OS keychain
#[tauri::command]
pub async fn keyring_has_key(service: String) -> Result<bool, String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &service)
        .map_err(|e| format!("Keyring init error: {}", e))?;
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Keyring check error: {}", e)),
    }
}

/// Check if the keyring backend is available on this platform
#[tauri::command]
pub async fn keyring_status() -> Result<KeyringStatus, String> {
    match keyring::Entry::new(SERVICE_NAME, "__probe__") {
        Ok(_entry) => Ok(KeyringStatus {
            available: true,
            backend: std::env::consts::OS.to_string(),
        }),
        Err(_) => Ok(KeyringStatus {
            available: false,
            backend: "none".to_string(),
        }),
    }
}

/// Migrate plaintext keys from tauri-plugin-store into the OS keyring.
/// Called once during app upgrade. Returns count of migrated keys.
#[tauri::command]
pub async fn keyring_migrate_from_store(app: tauri::AppHandle) -> Result<u32, String> {
    use tauri_plugin_store::StoreExt;

    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let providers = ["gemini", "openai", "anthropic", "groq", "huggingface", "together", "custom", "elevenlabs"];
    let mut migrated: u32 = 0;

    for provider in &providers {
        let store_key = format!("apiKeys.{}", provider);
        if let Some(val) = store.get(&store_key) {
            if let Some(key_str) = val.as_str() {
                if !key_str.is_empty() {
                    // Store in keyring
                    let entry = keyring::Entry::new(SERVICE_NAME, provider)
                        .map_err(|e| format!("Migration keyring error: {}", e))?;
                    if entry.set_password(key_str).is_ok() {
                        // Remove plaintext from store
                        store.delete(&store_key);
                        migrated += 1;
                        log::info!("[Keyring] Migrated key for: {}", provider);
                    }
                }
            }
        }
    }

    if migrated > 0 {
        let _ = store.save();
    }

    Ok(migrated)
}
