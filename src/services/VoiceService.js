/**
 * Enhanced VoiceService.js
 * Handles Text-to-Speech synthesis and audio playback with multiple providers
 * Supports: Web Speech API, ElevenLabs, Edge TTS, and local models
 */

export class VoiceService {
    constructor(apiKey = '') {
        this.apiKey = apiKey;
        this.synthesizer = null;
        this.audioQueue = [];
        this.isPlaying = false;
        this.synth = null;
        this.voices = [];
        this.webSpeechAvailable = true;
        
        // Voice providers
        this.providers = {
            webspeech: { enabled: true, priority: 1 },
            elevenlabs: { enabled: !!apiKey, priority: 2 },
            edge: { enabled: true, priority: 3 },
            local: { enabled: false, priority: 4 }
        };
        
        // Only initialize Web Speech if we're in a browser environment
        if (typeof window !== 'undefined') {
            this.initializeWebSpeech();
        } else {
            console.warn('[VoiceService] Running in main process - Web Speech will be initialized in renderer');
            this.webSpeechAvailable = false;
        }
        
        // Mock ElevenLabs API URL
        this.apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech';
    }
    
    /**
     * Initialize Web Speech API for free voice synthesis
     */
    initializeWebSpeech() {
        // Check if we're in a browser environment (renderer process)
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            this.loadVoices();
            
            // Reload voices when they change
            this.synth.onvoiceschanged = () => {
                this.loadVoices();
            };
            
            console.log('[VoiceService] ✓ Web Speech API initialized');
        } else {
            console.warn('[VoiceService] Web Speech API not available in main process - will be initialized in renderer');
            this.webSpeechAvailable = false;
        }
    }
    
    /**
     * Load available voices
     */
    loadVoices() {
        if (this.synth) {
            this.voices = this.synth.getVoices();
            console.log(`[VoiceService] Loaded ${this.voices.length} voices`);
        }
    }
    
    /**
     * Get available voices for current provider
     */
    getVoices(provider = null) {
        if (provider === 'webspeech' || !provider) {
            return this.voices.map(voice => ({
                id: voice.name,
                name: voice.name,
                lang: voice.lang,
                provider: 'webspeech'
            }));
        }
        return [];
    }
    
    /**
     * Set voice for synthesis
     */
    setVoice(voiceId) {
        this.selectedVoice = this.voices.find(voice => voice.name === voiceId);
        if (this.selectedVoice) {
            console.log(`[VoiceService] Voice set to: ${voiceId}`);
        }
    }
    
    /**
     * Primary speak method with automatic provider fallback
     */
    async speak(text, options = {}) {
        const {
            voice = null,
            rate = 1.0,
            pitch = 1.0,
            volume = 1.0,
            emotion = 'neutral',
            provider = 'auto'
        } = options;
        
        console.log(`[VoiceService] Speaking: "${text}" with ${provider}`);
        
        // Try providers in order of preference
        const providers = provider === 'auto' 
            ? ['webspeech', 'elevenlabs', 'edge']
            : [provider];
        
        for (const providerName of providers) {
            if (!this.providers[providerName]?.enabled) continue;
            
            try {
                const result = await this.speakWithProvider(text, providerName, options);
                if (result) {
                    return result;
                }
            } catch (error) {
                console.warn(`[VoiceService] ${providerName} failed:`, error.message);
            }
        }
        
        throw new Error('All voice providers failed');
    }
    
    /**
     * Speak with specific provider
     */
    async speakWithProvider(text, provider, options) {
        switch (provider) {
            case 'webspeech':
                return this.speakWithWebSpeech(text, options);
            case 'elevenlabs':
                return this.speakWithElevenLabs(text, options);
            case 'edge':
                return this.speakWithEdge(text, options);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }
    
    /**
     * Speak using Web Speech API (free, built-in)
     */
    async speakWithWebSpeech(text, options) {
        return new Promise((resolve, reject) => {
            if (!this.synth) {
                reject(new Error('Web Speech API not available'));
                return;
            }
            
            // Cancel any ongoing speech
            this.synth.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set voice
            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            } else {
                // Try to find a good English voice
                const englishVoice = this.voices.find(voice => 
                    voice.lang.startsWith('en') && voice.name.includes('Female')
                );
                if (englishVoice) {
                    utterance.voice = englishVoice;
                }
            }
            
            // Set parameters
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;
            
            // Event handlers
            utterance.onstart = () => {
                this.isPlaying = true;
                console.log('[VoiceService] Web Speech started');
            };
            
            utterance.onend = () => {
                this.isPlaying = false;
                console.log('[VoiceService] Web Speech finished');
                resolve({
                    provider: 'webspeech',
                    duration: text.length * 100, // Estimate
                    success: true
                });
            };
            
            utterance.onerror = (event) => {
                this.isPlaying = false;
                console.error('[VoiceService] Web Speech error:', event.error);
                reject(new Error(`Web Speech error: ${event.error}`));
            };
            
            // Start speaking
            this.synth.speak(utterance);
        });
    }
    
    /**
     * Speak using ElevenLabs API
     */
    async speakWithElevenLabs(text, options) {
        if (!this.apiKey) {
            throw new Error('ElevenLabs API key not provided');
        }
        
        const voiceId = options.voiceId || 'rachel';
        
        try {
            const response = await fetch(`${this.apiUrl}/${voiceId}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: options.stability || 0.75,
                        similarity_boost: options.clarity || 0.75,
                        style: options.style || 0.0,
                        use_speaker_boost: true
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`ElevenLabs API Error: ${response.statusText}`);
            }
            
            const audioBuffer = await response.arrayBuffer();
            return this.playAudioBuffer(audioBuffer, 'elevenlabs');
            
        } catch (error) {
            throw new Error(`ElevenLabs synthesis failed: ${error.message}`);
        }
    }
    
    /**
     * Speak using Edge TTS (free alternative)
     */
    async speakWithEdge(text, options) {
        // This would use Edge TTS API - simplified implementation
        console.log('[VoiceService] Edge TTS not fully implemented yet');
        throw new Error('Edge TTS not implemented');
    }
    
    /**
     * Play audio buffer from API-based TTS
     */
    async playAudioBuffer(audioBuffer, provider) {
        return new Promise((resolve, reject) => {
            try {
                const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                
                audio.onplay = () => {
                    this.isPlaying = true;
                    console.log(`[VoiceService] ${provider} audio started`);
                };
                
                audio.onended = () => {
                    this.isPlaying = false;
                    URL.revokeObjectURL(url);
                    resolve({
                        provider,
                        duration: audio.duration * 1000,
                        success: true
                    });
                };
                
                audio.onerror = (error) => {
                    this.isPlaying = false;
                    URL.revokeObjectURL(url);
                    reject(new Error(`Audio playback error: ${error}`));
                };
                
                audio.play().catch(reject);
            } catch (error) {
                reject(new Error(`Audio buffer playback failed: ${error.message}`));
            }
        });
    }
    
    /**
     * Stop current speech
     */
    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
        this.isPlaying = false;
        console.log('[VoiceService] Speech stopped');
    }
    
    /**
     * Check if currently speaking
     */
    get isSpeaking() {
        return this.isPlaying || (this.synth?.speaking || false);
    }
    
    /**
     * Update voice service settings
     */
    updateSettings(settings) {
        try {
            // Update provider settings
            if (settings.provider) {
                this.currentProvider = settings.provider;
            }
            
            // Update Web Speech settings if available
            if (this.synth && typeof window !== 'undefined') {
                if (settings.speed !== undefined) {
                    this.defaultRate = settings.speed;
                }
                if (settings.pitch !== undefined) {
                    this.defaultPitch = settings.pitch;
                }
                if (settings.volume !== undefined) {
                    this.defaultVolume = settings.volume;
                }
            }
            
            // Update voice selection
            if (settings.voice && this.voices.length > 0) {
                this.setVoice(settings.voice);
            }
            
            console.log('[VoiceService] ✓ Settings updated');
        } catch (error) {
            console.error('[VoiceService] Failed to update settings:', error);
        }
    }
    
    /**
     * Get available providers
     */
    getAvailableProviders() {
        return Object.entries(this.providers)
            .filter(([_, config]) => config.enabled)
            .map(([name, config]) => ({ name, priority: config.priority }));
    }
}

export default VoiceService;
