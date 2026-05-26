use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use futures_util::StreamExt;
use serde::Serialize;
use tauri::Emitter;

/// Default model specification
const DEFAULT_MODEL_REPO: &str = "bartowski/gemma-2-2b-it-GGUF";
const DEFAULT_MODEL_FILE: &str = "gemma-2-2b-it-Q4_K_M.gguf";
const DEFAULT_TOKENIZER_REPO: &str = "google/gemma-2-2b-it";
const DEFAULT_TOKENIZER_FILE: &str = "tokenizer.json";

#[derive(Serialize, Clone, Debug)]
pub struct ModelStatus {
    pub ready: bool,
    pub model_name: String,
    pub model_path: Option<String>,
    pub tokenizer_path: Option<String>,
    pub size_bytes: Option<u64>,
}

#[derive(Serialize, Clone, Debug)]
pub struct DownloadProgress {
    pub stage: String,
    pub percent: f32,
    pub bytes_downloaded: u64,
    pub bytes_total: u64,
}

pub struct ModelManager {
    pub models_dir: PathBuf,
    pub progress: Arc<Mutex<f32>>,
}

impl ModelManager {
    pub fn new() -> Self {
        let models_dir = dirs_next_or_fallback();
        Self {
            models_dir,
            progress: Arc::new(Mutex::new(0.0)),
        }
    }

    /// Get the path where models are stored
    pub fn get_models_dir(&self) -> &PathBuf {
        &self.models_dir
    }

    /// Check if the default model files exist
    pub fn is_model_ready(&self) -> bool {
        self.model_path().exists() && self.tokenizer_path().exists()
    }

    pub fn model_path(&self) -> PathBuf {
        self.models_dir.join(DEFAULT_MODEL_FILE)
    }

    pub fn tokenizer_path(&self) -> PathBuf {
        self.models_dir.join(DEFAULT_TOKENIZER_FILE)
    }

    pub fn get_status(&self) -> ModelStatus {
        let model_path = self.model_path();
        let tokenizer_path = self.tokenizer_path();
        let ready = model_path.exists() && tokenizer_path.exists();
        let size = if model_path.exists() {
            std::fs::metadata(&model_path).ok().map(|m| m.len())
        } else {
            None
        };

        ModelStatus {
            ready,
            model_name: DEFAULT_MODEL_FILE.to_string(),
            model_path: if model_path.exists() {
                Some(model_path.to_string_lossy().to_string())
            } else {
                None
            },
            tokenizer_path: if tokenizer_path.exists() {
                Some(tokenizer_path.to_string_lossy().to_string())
            } else {
                None
            },
            size_bytes: size,
        }
    }

    /// Download model and tokenizer from HuggingFace, emitting progress events
    pub async fn download_model(&self, app: &tauri::AppHandle) -> Result<(), String> {
        // Ensure directory exists
        std::fs::create_dir_all(&self.models_dir)
            .map_err(|e| format!("Failed to create models directory: {}", e))?;

        // Download tokenizer first (small file)
        let tokenizer_url = format!(
            "https://huggingface.co/{}/resolve/main/{}",
            DEFAULT_TOKENIZER_REPO, DEFAULT_TOKENIZER_FILE
        );
        self.download_file(app, &tokenizer_url, &self.tokenizer_path(), "tokenizer")
            .await?;

        // Download model (large file)
        let model_url = format!(
            "https://huggingface.co/{}/resolve/main/{}",
            DEFAULT_MODEL_REPO, DEFAULT_MODEL_FILE
        );
        self.download_file(app, &model_url, &self.model_path(), "model")
            .await?;

        Ok(())
    }

    async fn download_file(
        &self,
        app: &tauri::AppHandle,
        url: &str,
        dest: &PathBuf,
        stage: &str,
    ) -> Result<(), String> {
        // Check if file already exists
        if dest.exists() {
            log::info!("[ModelManager] {} already exists, skipping download", stage);
            return Ok(());
        }

        log::info!("[ModelManager] Downloading {} from {}", stage, url);

        let client = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::limited(10))
            .build()
            .map_err(|e| format!("HTTP client error: {}", e))?;

        let response = client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Download request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Download failed with status: {}", response.status()));
        }

        let total_size = response.content_length().unwrap_or(0);
        let mut downloaded: u64 = 0;

        // Write to temp file first, rename on completion
        let temp_path = dest.with_extension("tmp");
        let mut file = tokio::fs::File::create(&temp_path)
            .await
            .map_err(|e| format!("Failed to create temp file: {}", e))?;

        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("Download stream error: {}", e))?;
            tokio::io::AsyncWriteExt::write_all(&mut file, &chunk)
                .await
                .map_err(|e| format!("File write error: {}", e))?;

            downloaded += chunk.len() as u64;
            let percent = if total_size > 0 {
                (downloaded as f32 / total_size as f32) * 100.0
            } else {
                0.0
            };

            if let Ok(mut p) = self.progress.lock() {
                *p = percent;
            }

            // Emit progress to frontend
            let _ = app.emit(
                "model-download-progress",
                DownloadProgress {
                    stage: stage.to_string(),
                    percent,
                    bytes_downloaded: downloaded,
                    bytes_total: total_size,
                },
            );
        }

        tokio::io::AsyncWriteExt::flush(&mut file)
            .await
            .map_err(|e| format!("File flush error: {}", e))?;
        drop(file);

        // Rename temp to final
        tokio::fs::rename(&temp_path, dest)
            .await
            .map_err(|e| format!("File rename error: {}", e))?;

        log::info!(
            "[ModelManager] {} download complete ({} bytes)",
            stage,
            downloaded
        );
        Ok(())
    }
}

/// Resolve model storage directory: ~/.config/nizhal/models/
fn dirs_next_or_fallback() -> PathBuf {
    if let Some(config) = dirs::config_dir() {
        config.join("nizhal").join("models")
    } else {
        PathBuf::from(".").join(".nizhal_models")
    }
}
