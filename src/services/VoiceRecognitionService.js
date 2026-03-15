/**
 * VoiceRecognitionService.js
 * Handles speech-to-text with multiple providers including free Web Speech API
 * Supports: Web Speech API, Whisper API, and local models
 */

export class VoiceRecognitionService {
    constructor(options = {}) {
        this.isListening = false;
        this.isSupported = false;
        this.recognition = null;
        this.currentProvider = null;
        
        // Providers configuration
        this.providers = {
            webspeech: { enabled: true, priority: 1 },
            whisper: { enabled: !!options.whisperApiKey, priority: 2 },
            local: { enabled: false, priority: 3 }
        };
        
        // Event callbacks
        this.onResult = options.onResult || (() => {});
        this.onError = options.onError || (() => {});
        this.onStart = options.onStart || (() => {});
        this.onEnd = options.onEnd || (() => {});
        
        // Initialize primary provider
        this.initializeWebSpeech();
    }
    
    /**
     * Initialize Web Speech API for free voice recognition
     */
    initializeWebSpeech() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            // Event handlers
            this.recognition.onstart = () => {
                this.isListening = true;
                this.currentProvider = 'webspeech';
                this.onStart({ provider: 'webspeech' });
                console.log('[VoiceRecognition] Web Speech API started');
            };
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    this.onResult({
                        transcript: finalTranscript.trim(),
                        isFinal: true,
                        provider: 'webspeech',
                        confidence: event.results[event.results.length - 1][0].confidence
                    });
                }
                
                if (interimTranscript) {
                    this.onResult({
                        transcript: interimTranscript.trim(),
                        isFinal: false,
                        provider: 'webspeech',
                        confidence: 0.5
                    });
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('[VoiceRecognition] Web Speech error:', event.error);
                this.onError({
                    error: event.error,
                    provider: 'webspeech',
                    message: this.getErrorMessage(event.error)
                });
                
                // Auto-restart on network errors
                if (event.error === 'network' && this.isListening) {
                    setTimeout(() => this.start(), 1000);
                }
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.onEnd({ provider: 'webspeech' });
                console.log('[VoiceRecognition] Web Speech API ended');
                
                // Auto-restart if we should still be listening
                if (this.shouldRestart) {
                    setTimeout(() => this.start(), 100);
                }
            };
            
            this.isSupported = true;
            console.log('[VoiceRecognition] ✓ Web Speech API initialized');
        } else {
            console.warn('[VoiceRecognition] Web Speech API not supported');
            this.isSupported = false;
        }
    }
    
    /**
     * Start voice recognition
     */
    async start(options = {}) {
        if (!this.isSupported) {
            throw new Error('Voice recognition not supported in this browser');
        }
        
        if (this.isListening) {
            console.log('[VoiceRecognition] Already listening');
            return;
        }
        
        const {
            language = 'en-US',
            continuous = true,
            interimResults = true,
            provider = 'auto'
        } = options;
        
        // Try providers in order
        const providers = provider === 'auto' 
            ? ['webspeech', 'whisper', 'local']
            : [provider];
        
        for (const providerName of providers) {
            if (!this.providers[providerName]?.enabled) continue;
            
            try {
                await this.startProvider(providerName, options);
                return;
            } catch (error) {
                console.warn(`[VoiceRecognition] ${providerName} failed:`, error.message);
            }
        }
        
        throw new Error('All voice recognition providers failed');
    }
    
    /**
     * Start specific provider
     */
    async startProvider(provider, options) {
        switch (provider) {
            case 'webspeech':
                return this.startWebSpeech(options);
            case 'whisper':
                return this.startWhisper(options);
            case 'local':
                return this.startLocal(options);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }
    
    /**
     * Start Web Speech API
     */
    startWebSpeech(options) {
        if (!this.recognition) {
            throw new Error('Web Speech API not initialized');
        }
        
        // Update settings
        this.recognition.lang = options.language || 'en-US';
        this.recognition.continuous = options.continuous !== false;
        this.recognition.interimResults = options.interimResults !== false;
        
        this.shouldRestart = options.continuous !== false;
        
        this.recognition.start();
        console.log('[VoiceRecognition] Web Speech API started');
    }
    
    /**
     * Start Whisper API (placeholder)
     */
    async startWhisper(options) {
        throw new Error('Whisper API not implemented yet');
    }
    
    /**
     * Start local recognition (placeholder)
     */
    async startLocal(options) {
        throw new Error('Local recognition not implemented yet');
    }
    
    /**
     * Stop voice recognition
     */
    stop() {
        this.shouldRestart = false;
        
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            console.log('[VoiceRecognition] Stopping Web Speech API');
        }
        
        this.isListening = false;
    }
    
    /**
     * Abort voice recognition immediately
     */
    abort() {
        this.shouldRestart = false;
        
        if (this.recognition) {
            this.recognition.abort();
            console.log('[VoiceRecognition] Aborting Web Speech API');
        }
        
        this.isListening = false;
    }
    
    /**
     * Update language
     */
    setLanguage(language) {
        if (this.recognition) {
            this.recognition.lang = language;
            console.log(`[VoiceRecognition] Language set to: ${language}`);
        }
    }
    
    /**
     * Get available languages for Web Speech API
     */
    getAvailableLanguages() {
        // Common languages that Web Speech API supports
        return [
            { code: 'en-US', name: 'English (US)' },
            { code: 'en-GB', name: 'English (UK)' },
            { code: 'es-ES', name: 'Spanish (Spain)' },
            { code: 'es-MX', name: 'Spanish (Mexico)' },
            { code: 'fr-FR', name: 'French (France)' },
            { code: 'de-DE', name: 'German (Germany)' },
            { code: 'it-IT', name: 'Italian (Italy)' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)' },
            { code: 'ru-RU', name: 'Russian (Russia)' },
            { code: 'ja-JP', name: 'Japanese (Japan)' },
            { code: 'ko-KR', name: 'Korean (South Korea)' },
            { code: 'zh-CN', name: 'Chinese (China)' },
            { code: 'hi-IN', name: 'Hindi (India)' },
            { code: 'ml-IN', name: 'Malayalam (India)' }
        ];
    }
    
    /**
     * Get available providers
     */
    getAvailableProviders() {
        return Object.entries(this.providers)
            .filter(([_, config]) => config.enabled)
            .map(([name, config]) => ({ name, priority: config.priority }));
    }
    
    /**
     * Check if voice recognition is supported
     */
    get isRecognitionSupported() {
        return this.isSupported;
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            isListening: this.isListening,
            isSupported: this.isSupported,
            currentProvider: this.currentProvider,
            availableProviders: this.getAvailableProviders()
        };
    }
    
    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try speaking clearly.',
            'audio-capture': 'Microphone not available. Please check your permissions.',
            'not-allowed': 'Microphone permission denied. Please allow microphone access.',
            'network': 'Network error. Please check your internet connection.',
            'service-not-allowed': 'Voice recognition service not allowed. Please try again.',
            'aborted': 'Voice recognition was aborted.',
            'language-not-supported': 'Language not supported. Please try a different language.'
        };
        
        return errorMessages[error] || `Voice recognition error: ${error}`;
    }
}

export default VoiceRecognitionService;
