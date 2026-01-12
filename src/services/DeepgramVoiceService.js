/**
 * DeepgramVoiceService - Real-time Speech-to-Text and Text-to-Speech
 * 
 * Uses Deepgram's WebSocket API for:
 * - Real-time transcription (STT)
 * - Text-to-speech (TTS) with Aura voices
 */

const DEEPGRAM_STT_URL = 'wss://api.deepgram.com/v1/listen';
const DEEPGRAM_TTS_URL = 'https://api.deepgram.com/v1/speak';

class DeepgramVoiceService {
    constructor() {
        this.apiKey = null;
        this.sttSocket = null;
        this.isListening = false;
        this.mediaRecorder = null;
        this.audioContext = null;

        // Callbacks
        this.onTranscript = null;
        this.onSpeechStart = null;
        this.onSpeechEnd = null;
        this.onError = null;

        // TTS settings
        this.ttsVoice = 'aura-asteria-en'; // Female, warm
        this.ttsModel = 'aura';
    }

    /**
     * Initialize with API key
     */
    async initialize(apiKey) {
        this.apiKey = apiKey || process.env.DEEPGRAM_API_KEY;

        if (!this.apiKey) {
            console.error('[Deepgram] No API key provided');
            return false;
        }

        console.log('[Deepgram] Initialized');
        return true;
    }

    /**
     * Start real-time speech-to-text
     */
    async startListening() {
        if (this.isListening) return;

        try {
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Connect to Deepgram STT WebSocket
            const params = new URLSearchParams({
                model: 'nova-2',
                language: 'en-US',
                smart_format: 'true',
                punctuate: 'true',
                interim_results: 'true',
                endpointing: '300'
            });

            this.sttSocket = new WebSocket(`${DEEPGRAM_STT_URL}?${params}`, [
                'token',
                this.apiKey
            ]);

            this.sttSocket.onopen = () => {
                console.log('[Deepgram STT] Connected');
                this.isListening = true;
                this.onSpeechStart?.();
                this._startStreaming(stream);
            };

            this.sttSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'Results' && data.channel?.alternatives?.[0]) {
                    const transcript = data.channel.alternatives[0].transcript;
                    const isFinal = data.is_final;
                    const confidence = data.channel.alternatives[0].confidence;

                    if (transcript) {
                        this.onTranscript?.({
                            transcript,
                            isFinal,
                            confidence
                        });
                    }
                }
            };

            this.sttSocket.onerror = (error) => {
                console.error('[Deepgram STT] Error:', error);
                this.onError?.(error);
            };

            this.sttSocket.onclose = () => {
                console.log('[Deepgram STT] Disconnected');
                this.isListening = false;
                this.onSpeechEnd?.();
            };

            return true;
        } catch (error) {
            console.error('[Deepgram] Failed to start:', error);
            this.onError?.(error);
            return false;
        }
    }

    /**
     * Stream audio to Deepgram
     */
    _startStreaming(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 16000
        });

        const source = this.audioContext.createMediaStreamSource(stream);
        const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(this.audioContext.destination);

        processor.onaudioprocess = (e) => {
            if (!this.isListening || this.sttSocket?.readyState !== WebSocket.OPEN) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);

            for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
            }

            this.sttSocket.send(pcm16.buffer);
        };

        this.processor = processor;
        this.source = source;
        this.stream = stream;
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.sttSocket) {
            this.sttSocket.close();
            this.sttSocket = null;
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
     * Text-to-Speech using Deepgram Aura
     * @param {string} text - Text to speak
     * @returns {Promise<ArrayBuffer>} Audio data
     */
    async speak(text) {
        if (!this.apiKey) {
            console.error('[Deepgram TTS] No API key');
            return null;
        }

        try {
            const response = await fetch(`${DEEPGRAM_TTS_URL}?model=${this.ttsVoice}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`TTS failed: ${response.statusText}`);
            }

            const audioData = await response.arrayBuffer();
            await this._playAudio(audioData);

            return audioData;
        } catch (error) {
            console.error('[Deepgram TTS] Error:', error);
            this.onError?.(error);
            return null;
        }
    }

    /**
     * Play audio buffer
     */
    async _playAudio(audioData) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await context.decodeAudioData(audioData);

        const source = context.createBufferSource();
        source.buffer = audioBuffer;
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
     * Set TTS voice
     * Available voices:
     * - aura-asteria-en (female, warm)
     * - aura-luna-en (female, soft)
     * - aura-stella-en (female, confident)
     * - aura-orion-en (male, deep)
     * - aura-arcas-en (male, warm)
     */
    setVoice(voice) {
        this.ttsVoice = voice;
    }

    /**
     * Get available voices
     */
    getVoices() {
        return [
            { id: 'aura-asteria-en', name: 'Asteria', gender: 'female', style: 'warm' },
            { id: 'aura-luna-en', name: 'Luna', gender: 'female', style: 'soft' },
            { id: 'aura-stella-en', name: 'Stella', gender: 'female', style: 'confident' },
            { id: 'aura-orion-en', name: 'Orion', gender: 'male', style: 'deep' },
            { id: 'aura-arcas-en', name: 'Arcas', gender: 'male', style: 'warm' }
        ];
    }
}

// Export singleton
export const deepgramVoice = new DeepgramVoiceService();
export { DeepgramVoiceService };
