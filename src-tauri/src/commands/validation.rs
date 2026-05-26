use url::Url;

/// Validate environment variable keys to prevent unauthorized environment modification
pub fn validate_env_key(key: &str) -> Result<(), String> {
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

    if allowed_keys.contains(&key) {
        Ok(())
    } else {
        Err(format!("Access to environment variable '{}' is forbidden", key))
    }
}

/// Validate external URLs to prevent arbitrary protocol handler exploits (e.g. file:// or command execution)
pub fn validate_url(url_str: &str) -> Result<(), String> {
    let parsed = Url::parse(url_str).map_err(|e| format!("Invalid URL format: {}", e))?;
    let scheme = parsed.scheme().to_lowercase();
    
    if scheme == "http" || scheme == "https" || scheme == "mailto" {
        Ok(())
    } else {
        Err(format!("Scheme '{}' is not permitted. Only http, https, or mailto are allowed.", scheme))
    }
}

/// Validate personality modes to prevent command injections or unexpected behavior when spawning the Python agent
pub fn validate_personality(personality: Option<&str>) -> Result<(), String> {
    let allowed_personalities = ["gf", "bf", "jarvis", "lachu", "auto"];
    if let Some(p) = personality {
        if allowed_personalities.contains(&p) {
            Ok(())
        } else {
            Err(format!("Invalid personality '{}'. Allowed: {:?}", p, allowed_personalities))
        }
    } else {
        Ok(())
    }
}

/// Validate window dimension bounds to prevent extremely small, negative, or extremely large values
pub fn validate_window_dimensions(width: u32, height: u32) -> Result<(), String> {
    if width < 50 || width > 4000 {
        return Err(format!("Window width {} is out of range [50, 4000]", width));
    }
    if height < 50 || height > 4000 {
        return Err(format!("Window height {} is out of range [50, 4000]", height));
    }
    Ok(())
}

/// Validate window positioning bounds
pub fn validate_window_position(x: i32, y: i32) -> Result<(), String> {
    if x < -10000 || x > 10000 {
        return Err(format!("Window X position {} is out of range [-10000, 10000]", x));
    }
    if y < -10000 || y > 10000 {
        return Err(format!("Window Y position {} is out of range [-10000, 10000]", y));
    }
    Ok(())
}

/// Validate message content and length to prevent excessive memory/CPU usage
pub fn validate_message(message: &str) -> Result<(), String> {
    if message.len() > 100000 {
        return Err("Input message is too long (maximum 100,000 characters)".into());
    }
    Ok(())
}

/// Validate third-party provider API keys using a real live endpoint ping via reqwest
#[tauri::command]
pub async fn validate_provider_api_key(provider: String, key: String) -> Result<bool, String> {
    if key.is_empty() {
        return Err("API Key cannot be empty".to_string());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let prov = provider.to_lowercase();

    match prov.as_str() {
        "gemini" => {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models?key={}",
                key
            );
            let res = client.get(&url).send().await
                .map_err(|e| format!("Network request failed: {}", e))?;
            if res.status().is_success() {
                Ok(true)
            } else {
                Err("Gemini API key verification failed. Please check your credentials.".to_string())
            }
        }
        "openai" => {
            let url = "https://api.openai.com/v1/models";
            let res = client
                .get(url)
                .bearer_auth(&key)
                .send()
                .await
                .map_err(|e| format!("Network request failed: {}", e))?;
            if res.status().is_success() {
                Ok(true)
            } else {
                Err("OpenAI API key verification failed. Please check your credentials.".to_string())
            }
        }
        "anthropic" => {
            let url = "https://api.anthropic.com/v1/models";
            let res = client
                .get(url)
                .header("x-api-key", &key)
                .header("anthropic-version", "2023-06-01")
                .send()
                .await
                .map_err(|e| format!("Network request failed: {}", e))?;
            if res.status().is_success() {
                Ok(true)
            } else {
                Err("Anthropic API key verification failed. Please check your credentials.".to_string())
            }
        }
        "groq" => {
            let url = "https://api.groq.com/openai/v1/models";
            let res = client
                .get(url)
                .bearer_auth(&key)
                .send()
                .await
                .map_err(|e| format!("Network request failed: {}", e))?;
            if res.status().is_success() {
                Ok(true)
            } else {
                Err("Groq API key verification failed. Please check your credentials.".to_string())
            }
        }
        "huggingface" => {
            let url = "https://api-infer.huggingface.co/models/gpt2";
            let res = client
                .get(url)
                .bearer_auth(&key)
                .send()
                .await
                .map_err(|e| format!("Network request failed: {}", e))?;
            if res.status() == reqwest::StatusCode::UNAUTHORIZED {
                Err("HuggingFace API token verification failed. Please check your credentials.".to_string())
            } else {
                Ok(true)
            }
        }
        "together" => {
            let url = "https://api.together.xyz/v1/models";
            let res = client
                .get(url)
                .bearer_auth(&key)
                .send()
                .await
                .map_err(|e| format!("Network request failed: {}", e))?;
            if res.status().is_success() {
                Ok(true)
            } else {
                Err("Together AI API key verification failed. Please check your credentials.".to_string())
            }
        }
        "elevenlabs" => {
            let url = "https://api.elevenlabs.io/v1/voices";
            let res = client
                .get(url)
                .header("xi-api-key", &key)
                .send()
                .await
                .map_err(|e| format!("Network request failed: {}", e))?;
            if res.status().is_success() {
                Ok(true)
            } else {
                Err("ElevenLabs API key verification failed. Please check your credentials.".to_string())
            }
        }
        "deepgram" => {
            let url = "https://api.deepgram.com/v1/projects";
            let res = client
                .get(url)
                .header("Authorization", format!("Token {}", key))
                .send()
                .await
                .map_err(|e| format!("Network request failed: {}", e))?;
            if res.status().is_success() {
                Ok(true)
            } else {
                Err("Deepgram API key verification failed. Please check your credentials.".to_string())
            }
        }
        _ => {
            Ok(true)
        }
    }
}
