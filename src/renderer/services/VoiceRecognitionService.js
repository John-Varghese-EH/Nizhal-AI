export class VoiceRecognitionService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onResult = null;
        this.onStart = null;
        this.onEnd = null;
        this.onError = null;
        this.onSoundLevel = null;
        this.continuous = false;
        this.interimResults = true;
        this.language = 'en-US';
        this.wakeWords = ['hey nizhal', 'hello nizhal', 'ok nizhal', 'nizhal'];
        this.personalityWakeWords = {
            gf: ['hey babe', 'hey love', 'sweetheart', 'baby'],
            bf: ['yo king', 'hey bro', 'dude', 'hey man'],
            jarvis: ['hey jarvis', 'jarvis', 'computer', 'assistant']
        };
        this.activePersonality = 'gf';
        this.wakeWordEnabled = false;
        this.wakeWordCallback = null;
        this.autoRestart = false;
        this.maxAlternatives = 3;

        // Audio analysis for sound level detection
        this.audioContext = null;
        this.analyser = null;
        this.mediaStream = null;
        this.animationFrame = null;
    }

    initialize() {
        if (typeof window === 'undefined') {
            console.error('Voice recognition requires browser environment');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('Speech Recognition API not supported');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = this.continuous;
        this.recognition.interimResults = this.interimResults;
        this.recognition.lang = this.language;
        this.recognition.maxAlternatives = this.maxAlternatives;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.onStart?.();
            this.startAudioAnalysis();
        };

        this.recognition.onresult = (event) => {
            const results = Array.from(event.results);
            const lastResult = results[results.length - 1];

            // Get all alternatives for better accuracy
            const alternatives = Array.from(lastResult).map(alt => ({
                transcript: alt.transcript,
                confidence: alt.confidence
            }));

            const transcript = alternatives[0]?.transcript || '';
            const isFinal = lastResult?.isFinal;
            const confidence = alternatives[0]?.confidence || 0;

            // Check for wake words in interim results
            if (this.wakeWordEnabled && !isFinal) {
                const lowerTranscript = transcript.toLowerCase();
                // Check base wake words + personality wake words
                const allWakeWords = [
                    ...this.wakeWords,
                    ...(this.personalityWakeWords[this.activePersonality] || [])
                ];
                for (const wakeWord of allWakeWords) {
                    if (lowerTranscript.includes(wakeWord.toLowerCase())) {
                        console.log(`[VoiceRecognition] Wake word detected: ${wakeWord}`);
                        this.wakeWordCallback?.();
                        return;
                    }
                }
            }

            this.onResult?.({
                transcript,
                isFinal,
                confidence,
                alternatives,
                language: this.language
            });
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.stopAudioAnalysis();

            // Handle specific errors
            const errorInfo = this.getErrorInfo(event.error);
            this.onError?.(errorInfo);

            // Auto-restart on recoverable errors
            if (this.autoRestart && this.isRecoverableError(event.error)) {
                setTimeout(() => this.startListening(), 1000);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.stopAudioAnalysis();
            this.onEnd?.();

            // Restart for wake word listening
            if (this.wakeWordEnabled) {
                setTimeout(() => this.startListening(), 500);
            } else if (this.autoRestart && this.continuous) {
                setTimeout(() => this.startListening(), 500);
            }
        };

        this.recognition.onsoundstart = () => {
            // Sound detected
        };

        this.recognition.onsoundend = () => {
            // Sound ended
        };

        return true;
    }

    getErrorInfo(error) {
        const errorMap = {
            'no-speech': {
                code: 'no-speech',
                message: 'No speech detected. Please try again.',
                recoverable: true
            },
            'audio-capture': {
                code: 'audio-capture',
                message: 'Microphone not available. Check your audio settings.',
                recoverable: false
            },
            'not-allowed': {
                code: 'not-allowed',
                message: 'Microphone access denied. Please allow microphone access.',
                recoverable: false
            },
            'network': {
                code: 'network',
                message: 'Network error. Check your internet connection.',
                recoverable: true
            },
            'aborted': {
                code: 'aborted',
                message: 'Recognition aborted.',
                recoverable: true
            },
            'language-not-supported': {
                code: 'language-not-supported',
                message: `Language ${this.language} is not supported.`,
                recoverable: false
            },
            'service-not-allowed': {
                code: 'service-not-allowed',
                message: 'Speech recognition service not allowed.',
                recoverable: false
            }
        };

        return errorMap[error] || {
            code: error,
            message: `Recognition error: ${error}`,
            recoverable: false
        };
    }

    isRecoverableError(error) {
        return ['no-speech', 'network', 'aborted'].includes(error);
    }

    async startAudioAnalysis() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);
            this.analyser.fftSize = 256;

            const updateLevel = () => {
                if (!this.analyser || !this.isListening) return;

                const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(dataArray);

                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                const normalizedLevel = average / 255;

                this.onSoundLevel?.(normalizedLevel);
                this.animationFrame = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (error) {
            console.error('Failed to start audio analysis:', error);
        }
    }

    stopAudioAnalysis() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        this.analyser = null;
        this.onSoundLevel?.(0);
    }

    startListening() {
        if (!this.recognition) {
            if (!this.initialize()) return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            if (error.message.includes('already started')) {
                // Already listening, ignore
                return true;
            }
            console.error('Failed to start recognition:', error);
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.stopAudioAnalysis();
            return true;
        }
        return false;
    }

    abort() {
        if (this.recognition) {
            this.recognition.abort();
            this.stopAudioAnalysis();
        }
    }

    enableWakeWord(callback) {
        this.wakeWordEnabled = true;
        this.wakeWordCallback = callback;
        this.continuous = true;

        if (this.recognition) {
            this.recognition.continuous = true;
        }

        this.startListening();
    }

    disableWakeWord() {
        this.wakeWordEnabled = false;
        this.wakeWordCallback = null;
        this.continuous = false;

        if (this.recognition) {
            this.recognition.continuous = false;
        }

        this.stopListening();
    }

    setLanguage(lang) {
        this.language = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    setWakeWords(words) {
        this.wakeWords = words.map(w => w.toLowerCase());
    }

    /**
     * Set active personality - updates wake words accordingly
     * @param {string} personality - 'gf', 'bf', or 'jarvis'
     */
    setPersonality(personality) {
        this.activePersonality = personality;
        const personalityWords = this.personalityWakeWords[personality] || [];
        // Combine base wake words with personality-specific ones
        this.wakeWords = [
            'hey nizhal', 'hello nizhal', 'ok nizhal', 'nizhal',
            ...personalityWords.map(w => w.toLowerCase())
        ];
        console.log(`[VoiceRecognition] Wake words updated for ${personality}:`, this.wakeWords);
    }

    setContinuous(continuous) {
        this.continuous = continuous;
        if (this.recognition) {
            this.recognition.continuous = continuous;
        }
    }

    setAutoRestart(autoRestart) {
        this.autoRestart = autoRestart;
    }

    getSupportedLanguages() {
        return [
            { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
            { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
            { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
            { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
            { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
            { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
            { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
            { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
            { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳' },
            { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
            { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
            { code: 'pa-IN', name: 'Punjabi', flag: '🇮🇳' },
            { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
            { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
            { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
            { code: 'de-DE', name: 'German', flag: '🇩🇪' },
            { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
            { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
            { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
            { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
            { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
            { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
            { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
            { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
            { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
            { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
            { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
            { code: 'th-TH', name: 'Thai', flag: '🇹🇭' },
            { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' },
            { code: 'id-ID', name: 'Indonesian', flag: '🇮🇩' }
        ];
    }

    getIndianLanguages() {
        return this.getSupportedLanguages().filter(lang =>
            lang.code.endsWith('-IN') || lang.code === 'en-IN'
        );
    }

    isSupported() {
        return typeof window !== 'undefined' &&
            (window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    async checkMicrophonePermission() {
        try {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            return permission.state; // 'granted', 'denied', 'prompt'
        } catch (error) {
            // Fallback for browsers that don't support permissions API
            return 'prompt';
        }
    }

    async requestMicrophoneAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Microphone access denied:', error);
            return false;
        }
    }

    // Get audio input devices
    async getAudioInputDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(device => device.kind === 'audioinput')
                .map(device => ({
                    id: device.deviceId,
                    label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
                    isDefault: device.deviceId === 'default'
                }));
        } catch (error) {
            console.error('Failed to get audio devices:', error);
            return [];
        }
    }
}

export const voiceRecognition = new VoiceRecognitionService();
