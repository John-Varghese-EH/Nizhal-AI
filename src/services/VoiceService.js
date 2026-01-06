export class VoiceService {
    constructor() {
        this.provider = 'webspeech';
        this.elevenLabsApiKey = '';
        this.currentVoiceId = 'default';
        this.voices = [];
        this.isSpeaking = false;
        this.audioQueue = [];
        this.settings = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
    }

    setProvider(provider, config = {}) {
        this.provider = provider;
        if (config.apiKey) {
            this.elevenLabsApiKey = config.apiKey;
        }
        return this.provider;
    }

    async speak(text, options = {}) {
        if (this.provider === 'elevenlabs' && this.elevenLabsApiKey) {
            return this.speakWithElevenLabs(text, options);
        }
        return this.speakWithWebSpeech(text, options);
    }

    speakWithWebSpeech(text, options = {}) {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.speechSynthesis) {
                reject(new Error('Web Speech API not available'));
                return;
            }

            this.stop();

            const utterance = new SpeechSynthesisUtterance(text);

            utterance.rate = options.rate ?? this.settings.rate;
            utterance.pitch = options.pitch ?? this.settings.pitch;
            utterance.volume = options.volume ?? this.settings.volume;

            if (options.voiceId || this.currentVoiceId !== 'default') {
                const voices = window.speechSynthesis.getVoices();
                const targetVoice = voices.find(v =>
                    v.voiceURI === (options.voiceId || this.currentVoiceId)
                );
                if (targetVoice) {
                    utterance.voice = targetVoice;
                }
            }

            utterance.onstart = () => {
                this.isSpeaking = true;
                // Notify lip-sync to start
                options.onSpeakStart?.();
            };

            utterance.onend = () => {
                this.isSpeaking = false;
                // Notify lip-sync to stop
                options.onSpeakEnd?.();
                resolve({ success: true });
            };

            utterance.onerror = (event) => {
                this.isSpeaking = false;
                options.onSpeakEnd?.();
                reject(new Error(event.error));
            };

            // Boundary events for word-level lip sync
            utterance.onboundary = (event) => {
                options.onBoundary?.(event);
            };

            window.speechSynthesis.speak(utterance);
        });
    }

    async speakWithElevenLabs(text, options = {}) {
        const voiceId = options.voiceId || this.currentVoiceId || '21m00Tcm4TlvDq8ikWAM';

        try {
            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.elevenLabsApiKey
                    },
                    body: JSON.stringify({
                        text,
                        model_id: 'eleven_monolingual_v1',
                        voice_settings: {
                            stability: options.stability ?? 0.5,
                            similarity_boost: options.similarityBoost ?? 0.75
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            return this.playAudio(audioUrl);
        } catch (error) {
            console.error('ElevenLabs TTS error:', error);
            console.log('Falling back to Web Speech API');
            return this.speakWithWebSpeech(text, options);
        }
    }

    playAudio(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(url);

            audio.onplay = () => {
                this.isSpeaking = true;
            };

            audio.onended = () => {
                this.isSpeaking = false;
                URL.revokeObjectURL(url);
                resolve({ success: true });
            };

            audio.onerror = (error) => {
                this.isSpeaking = false;
                URL.revokeObjectURL(url);
                reject(error);
            };

            audio.play();
        });
    }

    stop() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.isSpeaking = false;
        this.audioQueue = [];
    }

    pause() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.pause();
        }
    }

    resume() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.resume();
        }
    }

    getVoices() {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            return [];
        }

        const webVoices = window.speechSynthesis.getVoices().map(voice => ({
            id: voice.voiceURI,
            name: voice.name,
            lang: voice.lang,
            provider: 'webspeech',
            default: voice.default
        }));

        const elevenLabsVoices = [
            { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', provider: 'elevenlabs' },
            { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', provider: 'elevenlabs' },
            { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', provider: 'elevenlabs' },
            { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', provider: 'elevenlabs' },
            { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', provider: 'elevenlabs' },
            { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', provider: 'elevenlabs' },
            { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', provider: 'elevenlabs' },
            { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', provider: 'elevenlabs' },
            { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', provider: 'elevenlabs' }
        ];

        return [...webVoices, ...elevenLabsVoices];
    }

    setVoice(voiceId) {
        this.currentVoiceId = voiceId;
        return this.currentVoiceId;
    }

    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        return this.settings;
    }

    getSettings() {
        return { ...this.settings };
    }

    isBusy() {
        return this.isSpeaking;
    }

    async queueSpeak(text, options = {}) {
        this.audioQueue.push({ text, options });

        if (!this.isSpeaking) {
            await this.processQueue();
        }
    }

    async processQueue() {
        while (this.audioQueue.length > 0) {
            const { text, options } = this.audioQueue.shift();
            try {
                await this.speak(text, options);
            } catch (error) {
                console.error('Queue speak error:', error);
            }
        }
    }
}

export function initWebSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        return new Promise((resolve) => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                window.speechSynthesis.onvoiceschanged = () => {
                    resolve(window.speechSynthesis.getVoices());
                };
            }
        });
    }
    return Promise.resolve([]);
}
