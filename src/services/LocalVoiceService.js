import { wakeWordService } from './WakeWordService.js';

/**
 * LocalVoiceService - 100% FREE Speech-to-Text and Text-to-Speech
 * Uses Web Speech API + Vosk (WASM) for Wake Word
 */

class LocalVoiceService {
    constructor() {
        // STT Options
        this.isListening = false; // Active listening for command
        this.isWakeWordActive = false; // Passive listening for "Hey Nizhal"

        // Fallback: Web Speech API
        this.webSpeechRecognition = null;
        this.webSpeechSynthesis = window.speechSynthesis;

        // Callbacks
        this.onTranscript = null;
        this.onSpeechStart = null;
        this.onSpeechEnd = null;
        this.onError = null;

        // Current voice settings
        this.currentVoice = {
            provider: 'web',
            voiceName: 'Microsoft David', // Default fallback
            pitch: 1.0,
            rate: 1.0,
            language: 'en-US'
        };

        // Emotion-based voice adjustments
        this.emotionVoiceMap = {
            happy: { pitch: 1.1, rate: 1.1 },
            sad: { pitch: 0.9, rate: 0.9 },
            excited: { pitch: 1.2, rate: 1.2 },
            calm: { pitch: 1.0, rate: 0.9 },
            angry: { pitch: 0.9, rate: 1.2 },
            neutral: { pitch: 1.0, rate: 1.0 }
        };

        this.initialize();
    }

    async initialize() {
        // Init Wake Word
        await wakeWordService.initialize(() => {
            console.log('[LocalVoice] Wake Word Detected!');
            this.startListening(); // Auto-start active listening
        });

        // Start passive listening
        wakeWordService.start();
        this.isWakeWordActive = true;
    }

    /**
     * Set voice based on personality
     */
    setVoiceForPersonality(personality, emotion = 'neutral') {
        // Web Speech API usually has "Google US English", "Microsoft David/Zira" (Win)
        const voiceProfiles = {
            gf: {
                voiceName: 'Female', // Generic match
                pitch: 1.1,
                rate: 1.0
            },
            bf: {
                voiceName: 'Male',
                pitch: 0.9,
                rate: 1.0
            },
            jarvis: {
                voiceName: 'Male',
                pitch: 0.8,
                rate: 0.95
            }
        };

        const profile = voiceProfiles[personality] || voiceProfiles.jarvis;

        // Apply emotion adjustments
        const emotionAdjust = this.emotionVoiceMap[emotion] || this.emotionVoiceMap.neutral;

        this.currentVoice = {
            ...this.currentVoice,
            ...profile,
            pitch: profile.pitch * emotionAdjust.pitch,
            rate: profile.rate * emotionAdjust.rate
        };

        console.log(`[LocalVoice] Voice set for ${personality} (${emotion}):`, this.currentVoice);
    }

    /**
     * Start listening (Speech-to-Text)
     */
    async startListening() {
        if (this.isListening) {
            console.log('[LocalVoice] Already listening');
            return;
        }

        if (this.currentVoice.provider === 'vosk') {
            return await this.startVoskSTT();
        } else {
            return await this.startWebSpeechSTT();
        }
    }

    /**
     * Vosk STT (Offline, High Quality)
     */
    async startVoskSTT() {
        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Connect to Vosk WebSocket server
            this.voskSocket = new WebSocket(this.voskServerUrl);

            this.voskSocket.onopen = () => {
                console.log('[Vosk STT] Connected');
                this.isListening = true;
                this.onSpeechStart?.();
                this._startVoskStreaming(stream);
            };

            this.voskSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.partial) {
                    // Interim result
                    this.onTranscript?.({
                        transcript: data.partial,
                        isFinal: false,
                        confidence: 0.5
                    });
                } else if (data.text) {
                    // Final result
                    this.onTranscript?.({
                        transcript: data.text,
                        isFinal: true,
                        confidence: data.confidence || 0.9
                    });
                }
            };

            this.voskSocket.onerror = (error) => {
                console.error('[Vosk STT] Error:', error);
                console.log('[Vosk STT] Falling back to Web Speech API');
                this.currentVoice.provider = 'web';
                this.startWebSpeechSTT();
            };

            this.voskSocket.onclose = () => {
                console.log('[Vosk STT] Disconnected');
                this.isListening = false;
                this.onSpeechEnd?.();
            };

            return true;
        } catch (error) {
            console.error('[Vosk STT] Failed to start:', error);
            console.log('[Vosk STT] Falling back to Web Speech API');
            return await this.startWebSpeechSTT();
        }
    }

    /**
     * Stream audio to Vosk server
     */
    _startVoskStreaming(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 16000
        });

        const source = this.audioContext.createMediaStreamSource(stream);
        const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(this.audioContext.destination);

        processor.onaudioprocess = (e) => {
            if (!this.isListening || this.voskSocket?.readyState !== WebSocket.OPEN) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);

            // Convert Float32 to Int16 PCM
            for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            this.voskSocket.send(pcm16.buffer);
        };

        this.processor = processor;
        this.source = source;
        this.stream = stream;
    }

    /**
     * Web Speech API STT (Browser-native, Always Available)
     */
    async startWebSpeechSTT() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (!SpeechRecognition) {
                throw new Error('Speech Recognition not supported in this browser');
            }

            this.webSpeechRecognition = new SpeechRecognition();
            this.webSpeechRecognition.continuous = true;
            this.webSpeechRecognition.interimResults = true;
            this.webSpeechRecognition.lang = this.currentVoice.language;

            this.webSpeechRecognition.onstart = () => {
                console.log('[Web Speech STT] Started');
                this.isListening = true;
                this.onSpeechStart?.();
            };

            this.webSpeechRecognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const transcript = result[0].transcript;
                    const isFinal = result.isFinal;
                    const confidence = result[0].confidence;

                    this.onTranscript?.({
                        transcript,
                        isFinal,
                        confidence: confidence || 0.8
                    });
                }
            };

            this.webSpeechRecognition.onerror = (event) => {
                console.error('[Web Speech STT] Error:', event.error);
                this.onError?.(event.error);
            };

            this.webSpeechRecognition.onend = () => {
                console.log('[Web Speech STT] Ended');
                this.isListening = false;
                this.onSpeechEnd?.();
            };

            this.webSpeechRecognition.start();
            return true;
        } catch (error) {
            console.error('[Web Speech STT] Failed to start:', error);
            this.onError?.(error);
            return false;
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.voskSocket) {
            this.voskSocket.close();
            this.voskSocket = null;
        }

        if (this.webSpeechRecognition) {
            this.webSpeechRecognition.stop();
            this.webSpeechRecognition = null;
        }

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isListening = false;
    }

    /**
     * Speak text (Text-to-Speech)
     */
    async speak(text, emotion = 'neutral') {
        // Apply emotion adjustments
        const emotionAdjust = this.emotionVoiceMap[emotion] || this.emotionVoiceMap.neutral;
        const adjustedPitch = this.currentVoice.pitch * emotionAdjust.pitch;
        const adjustedRate = this.currentVoice.rate * emotionAdjust.rate;

        if (this.currentVoice.ttsProvider === 'coqui') {
            return await this.speakWithCoqui(text, adjustedPitch, adjustedRate);
        } else {
            return await this.speakWithWebSpeech(text, adjustedPitch, adjustedRate);
        }
    }

    /**
     * Coqui TTS XTTS-v2 (Offline, Voice Cloning)
     */
    async speakWithCoqui(text, pitch, rate) {
        try {
            const response = await fetch(`${this.coquiServerUrl}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    speaker_id: this.currentVoice.coquiSpeaker,
                    language: 'en',
                    speed: rate
                })
            });

            if (!response.ok) {
                throw new Error(`Coqui TTS failed: ${response.statusText}`);
            }

            const audioData = await response.arrayBuffer();
            await this._playAudio(audioData, pitch);

            return true;
        } catch (error) {
            console.error('[Coqui TTS] Error:', error);
            console.log('[Coqui TTS] Falling back to Web Speech API');
            return await this.speakWithWebSpeech(text, pitch, rate);
        }
    }

    /**
     * Web Speech API TTS (Browser-native, Always Available)
     */
    async speakWithWebSpeech(text, pitch, rate) {
        return new Promise((resolve, reject) => {
            if (!this.webSpeechSynthesis) {
                reject(new Error('Speech Synthesis not available'));
                return;
            }

            // Cancel any ongoing speech
            this.webSpeechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = Math.max(0.1, Math.min(2.0, pitch));
            utterance.rate = Math.max(0.1, Math.min(2.0, rate));
            utterance.lang = this.currentVoice.language;

            // Select voice
            const voices = this.webSpeechSynthesis.getVoices();
            const selectedVoice = voices.find(v =>
                v.name.includes(this.currentVoice.webSpeechVoice) ||
                (this.currentVoice.voiceName.includes('female') && v.name.includes('Female')) ||
                (this.currentVoice.voiceName.includes('male') && v.name.includes('Male'))
            );

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.onend = () => {
                console.log('[Web Speech TTS] Finished speaking');
                resolve(true);
            };

            utterance.onerror = (error) => {
                console.error('[Web Speech TTS] Error:', error);
                reject(error);
            };

            this.webSpeechSynthesis.speak(utterance);
        });
    }

    /**
     * Play audio buffer (for Coqui TTS)
     */
    async _playAudio(audioData, pitchAdjust = 1.0) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await context.decodeAudioData(audioData);

        const source = context.createBufferSource();
        source.buffer = audioBuffer;

        // Apply pitch adjustment
        source.playbackRate.value = pitchAdjust;

        source.connect(context.destination);
        source.start(0);

        return new Promise(resolve => {
            source.onended = () => {
                context.close();
                resolve();
            };
        });
    }

    /**
     * Stop speaking
     */
    stopSpeaking() {
        if (this.webSpeechSynthesis) {
            this.webSpeechSynthesis.cancel();
        }
        // Note: Coqui TTS through HTTP can't be cancelled mid-speech easily
    }

    /**
     * Get available voices
     */
    getVoices() {
        const voices = [];

        // Web Speech voices
        if (this.webSpeechSynthesis) {
            const webVoices = this.webSpeechSynthesis.getVoices();
            webVoices.forEach(v => {
                voices.push({
                    id: v.name,
                    name: v.name,
                    language: v.lang,
                    provider: 'web',
                    gender: v.name.includes('Female') ? 'female' : 'male'
                });
            });
        }

        // Coqui voices (predefined)
        voices.push(
            { id: 'coqui_female_1', name: 'Coqui Female Soft', provider: 'coqui', gender: 'female' },
            { id: 'coqui_male_1', name: 'Coqui Male Warm', provider: 'coqui', gender: 'male' },
            { id: 'coqui_male_2', name: 'Coqui Male Deep', provider: 'coqui', gender: 'male' }
        );

        return voices;
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            stt: {
                provider: this.currentVoice.provider,
                available: {
                    vosk: this.voskSocket !== null || this.currentVoice.provider === 'vosk',
                    webSpeech: true // Always available in modern browsers
                },
                isListening: this.isListening
            },
            tts: {
                provider: this.currentVoice.ttsProvider,
                available: {
                    coqui: this.currentVoice.ttsProvider === 'coqui',
                    webSpeech: true // Always available
                },
                currentVoice: this.currentVoice
            }
        };
    }
}

// Export singleton
export const localVoice = new LocalVoiceService();
export { LocalVoiceService };
