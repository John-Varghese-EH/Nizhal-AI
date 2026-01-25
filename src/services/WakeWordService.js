import { createModel, createKaldiRecognizer, createStereoAudioRecorder } from 'vosk-browser';

class WakeWordService {
    constructor() {
        this.model = null;
        this.recognizer = null;
        this.audioContext = null;
        this.source = null;
        this.processor = null;
        this.isListening = false;
        this.onWakeWord = null;
        this.modelUrl = '/models/vosk-model-small-en-us-0.15.zip'; // Needs to be in public folder
    }

    async initialize(onWakeWord) {
        this.onWakeWord = onWakeWord;

        try {
            console.log('[WakeWord] Loading Vosk model...');
            // In a real app, we need to ensure this model exists or load from CDN
            // For now, assuming it's served or falling back to a known CDN if possible, 
            // but vosk-browser usually needs a path.
            // Using a distinct "keyword" mode if supported, or just grammar.

            // Note: vosk-browser usage varies, simplified here for 'concept'
            // We might need to copy the model to public/

            this.model = await createModel(this.modelUrl);

            this.recognizer = new this.model.KaldiRecognizer(16000);
            // Set grammar for wake word only to optimize CPU
            this.recognizer.setGrammar('["hey nizhal", "nizhal", "computer"]');

            console.log('[WakeWord] Model loaded');
        } catch (e) {
            console.error('[WakeWord] Failed to load:', e);
            // Fallback: WebSpeech detection? (Not true wake word, needs button)
        }
    }

    async start() {
        if (!this.model || this.isListening) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.source = this.audioContext.createMediaStreamSource(stream);

            // Use specific processor for Vosk
            const recognizerProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
            recognizerProcessor.onaudioprocess = (event) => {
                const audioBuffer = event.inputBuffer;
                // Vosk expects float array or similar, depends on implementation
                // vosk-browser typically handles the processing via a worklet or interface
                // Simplified integration:
                if (this.recognizer.acceptWaveform(audioBuffer)) {
                    const result = this.recognizer.result();
                    if (result.text && (result.text.includes('nizhal') || result.text.includes('computer'))) {
                        console.log('[WakeWord] Detected:', result.text);
                        this.onWakeWord?.();
                    }
                }
            };

            this.source.connect(recognizerProcessor);
            recognizerProcessor.connect(this.audioContext.destination);

            this.processor = recognizerProcessor;
            this.isListening = true;
            console.log('[WakeWord] Listening...');
        } catch (e) {
            console.error('[WakeWord] Error starting:', e);
        }
    }

    stop() {
        this.isListening = false;
        this.source?.disconnect();
        this.processor?.disconnect();
        this.audioContext?.close();
    }
}

export const wakeWordService = new WakeWordService();
