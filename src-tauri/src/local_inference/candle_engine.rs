use std::path::Path;
use candle_core::{Device, Tensor};
use candle_core::quantized::gguf_file;
use candle_transformers::generation::LogitsProcessor;
use candle_transformers::models::quantized_llama as model;
use tokenizers::Tokenizer;

/// Core inference engine wrapping a quantized GGUF model via Candle
pub struct CandleEngine {
    model: Option<model::ModelWeights>,
    tokenizer: Option<Tokenizer>,
    device: Device,
}

impl CandleEngine {
    /// Create engine with best available device (CUDA > Metal > CPU)
    pub fn new() -> Self {
        let device = Self::detect_best_device();
        log::info!("[CandleEngine] Using device: {:?}", device);
        Self {
            model: None,
            tokenizer: None,
            device,
        }
    }

    fn detect_best_device() -> Device {
        #[cfg(feature = "cuda")]
        {
            if let Ok(dev) = Device::new_cuda(0) {
                log::info!("[CandleEngine] CUDA device available");
                return dev;
            }
        }
        #[cfg(feature = "metal")]
        {
            if let Ok(dev) = Device::new_metal(0) {
                log::info!("[CandleEngine] Metal device available");
                return dev;
            }
        }
        log::info!("[CandleEngine] Using CPU");
        Device::Cpu
    }

    /// Detect available hardware acceleration
    pub fn detect_gpu() -> serde_json::Value {
        let cuda = cfg!(feature = "cuda");
        let metal = cfg!(feature = "metal");
        let cpu_cores = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(1);

        serde_json::json!({
            "cuda": cuda,
            "metal": metal,
            "cpu_cores": cpu_cores,
            "device": if cuda { "cuda" } else if metal { "metal" } else { "cpu" }
        })
    }

    /// Load GGUF model weights and tokenizer from disk
    pub fn load_model(&mut self, model_path: &Path, tokenizer_path: &Path) -> Result<(), String> {
        log::info!("[CandleEngine] Loading model from {:?}", model_path);

        // Load tokenizer
        let tokenizer = Tokenizer::from_file(tokenizer_path)
            .map_err(|e| format!("Tokenizer load error: {}", e))?;
        self.tokenizer = Some(tokenizer);

        // Load GGUF model
        let mut file = std::fs::File::open(model_path)
            .map_err(|e| format!("Model file open error: {}", e))?;
        let content = gguf_file::Content::read(&mut file)
            .map_err(|e| format!("GGUF parse error: {}", e))?;

        let weights = model::ModelWeights::from_gguf(content, &mut file, &self.device)
            .map_err(|e| format!("Model weights load error: {}", e))?;
        self.model = Some(weights);

        log::info!("[CandleEngine] Model loaded successfully");
        Ok(())
    }

    pub fn is_loaded(&self) -> bool {
        self.model.is_some() && self.tokenizer.is_some()
    }

    /// Run text generation
    pub fn generate(
        &mut self,
        prompt: &str,
        max_tokens: usize,
        temperature: f64,
    ) -> Result<String, String> {
        let model = self.model.as_mut().ok_or("Model not loaded")?;
        let tokenizer = self.tokenizer.as_ref().ok_or("Tokenizer not loaded")?;

        // Tokenize
        let encoding = tokenizer
            .encode(prompt, true)
            .map_err(|e| format!("Tokenize error: {}", e))?;
        let tokens = encoding.get_ids().to_vec();

        if tokens.is_empty() {
            return Err("Empty input after tokenization".to_string());
        }

        // Sampling configuration
        let mut logits_processor = LogitsProcessor::new(
            42, // seed
            Some(temperature),
            Some(0.9), // top_p
        );

        let mut all_tokens = tokens.clone();
        let eos_token = tokenizer
            .token_to_id("</s>")
            .or_else(|| tokenizer.token_to_id("<eos>"))
            .unwrap_or(2);

        // Forward pass for prefill (process entire prompt at once)
        let input = Tensor::new(tokens.as_slice(), &self.device)
            .map_err(|e| format!("Tensor error: {}", e))?
            .unsqueeze(0)
            .map_err(|e| format!("Unsqueeze error: {}", e))?;

        let logits = model
            .forward(&input, 0)
            .map_err(|e| format!("Forward error: {}", e))?;

        let logits = logits
            .squeeze(0)
            .map_err(|e| format!("Squeeze error: {}", e))?;
        let last_logits = logits
            .get(logits.dim(0).map_err(|e| e.to_string())? - 1)
            .map_err(|e| format!("Get last logits error: {}", e))?;

        let next_token = logits_processor
            .sample(&last_logits)
            .map_err(|e| format!("Sample error: {}", e))?;
        all_tokens.push(next_token);

        if next_token == eos_token {
            return Ok(String::new());
        }

        // Autoregressive generation
        for i in 1..max_tokens {
            let input = Tensor::new(&[next_token], &self.device)
                .map_err(|e| format!("Tensor error: {}", e))?
                .unsqueeze(0)
                .map_err(|e| format!("Unsqueeze error: {}", e))?;

            let pos = tokens.len() + i;
            let logits = model
                .forward(&input, pos)
                .map_err(|e| format!("Forward error at step {}: {}", i, e))?;

            let logits = logits
                .squeeze(0)
                .map_err(|e| format!("Squeeze error: {}", e))?;
            let last_logits = logits
                .get(logits.dim(0).map_err(|e| e.to_string())? - 1)
                .map_err(|e| format!("Get logits error: {}", e))?;

            let next_token_id = logits_processor
                .sample(&last_logits)
                .map_err(|e| format!("Sample error: {}", e))?;
            all_tokens.push(next_token_id);

            if next_token_id == eos_token {
                break;
            }
        }

        // Decode generated tokens (skip prompt tokens)
        let generated_tokens = &all_tokens[tokens.len()..];
        let output = tokenizer
            .decode(generated_tokens, true)
            .map_err(|e| format!("Decode error: {}", e))?;

        Ok(output.trim().to_string())
    }

    /// Get device info string
    pub fn device_info(&self) -> String {
        format!("{:?}", self.device)
    }
}
