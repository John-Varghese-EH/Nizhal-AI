/**
 * GeminiLiveService - Real-time voice streaming with Gemini Live API
 * Ported from Kreo 2.0
 * 
 * Features:
 * - WebSocket connection to Gemini Live
 * - Bidirectional audio streaming
 * - Real-time transcription
 * - Function calling support
 * - Privacy mode (disables cloud when enabled)
 */

import { voiceTools } from './VoiceTools.js';

const MODEL_NAME = 'gemini-2.0-flash-exp';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

class GeminiLiveService {
    constructor() {
        this.session = null;
        this.isConnected = false;
        this.isPrivacyMode = false;

        // Audio contexts
        this.inputContext = null;
        this.outputContext = null;
        this.inputProcessor = null;
        this.inputSource = null;
        this.outputNode = null;

        // Analysers for visualizer
        this.analyserIn = null;
        this.analyserOut = null;

        // Audio playback
        this.activeSources = new Set();
        this.nextStartTime = 0;

        // Stream reference
        this.stream = null;

        // Callbacks
        this.onStateChange = null;
        this.onTranscription = null;
        this.onAudioLevel = null;
        this.onError = null;
        this.onSpeakStart = null;  // Called when AI starts speaking
        this.onSpeakEnd = null;    // Called when AI stops speaking
        this.onSpeaking = null;    // Called with audio data for lip-sync
        this.isSpeaking = false;
    }

    /**
     * Set privacy mode - when enabled, blocks all cloud connections
     */
    setPrivacyMode(enabled) {
        this.isPrivacyMode = enabled;
        if (enabled && this.isConnected) {
            this.disconnect();
        }
    }

    /**
     * Initialize audio contexts and analysers
     */
    ensureAudioContexts() {
        if (!this.inputContext) {
            this.inputContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: INPUT_SAMPLE_RATE
            });
            this.analyserIn = this.inputContext.createAnalyser();
            this.analyserIn.fftSize = 256;
        }

        if (!this.outputContext) {
            this.outputContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: OUTPUT_SAMPLE_RATE
            });
            this.analyserOut = this.outputContext.createAnalyser();
            this.analyserOut.fftSize = 256;

            this.outputNode = this.outputContext.createGain();
            this.outputNode.connect(this.analyserOut);
            this.analyserOut.connect(this.outputContext.destination);
        }
    }

    /**
     * Get analyser nodes for visualizer
     */
    getAnalysers() {
        return {
            analyserIn: this.analyserIn,
            analyserOut: this.analyserOut
        };
    }

    /**
     * Connect to Gemini Live API
     */
    async connect(apiKey, systemInstruction = '', tools = []) {
        if (this.isPrivacyMode) {
            console.warn('[GeminiLive] Privacy mode enabled, blocking cloud connection');
            this.onError?.('Privacy mode is enabled. Disable it to use cloud AI.');
            return false;
        }

        if (!apiKey) {
            this.onError?.('Gemini API key is required');
            return false;
        }

        try {
            this.ensureAudioContexts();

            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: INPUT_SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Setup input processing
            this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
            this.inputProcessor = this.inputContext.createScriptProcessor(4096, 1, 1);

            this.inputSource.connect(this.analyserIn);
            this.inputSource.connect(this.inputProcessor);
            this.inputProcessor.connect(this.inputContext.destination);

            // Import Google GenAI SDK dynamically
            const { GoogleGenAI, Modality } = await import('@google/genai');

            const genAI = new GoogleGenAI(apiKey);

            // Connect to Gemini Live
            this.session = await genAI.live.connect(MODEL_NAME, {
                config: {
                    responseModalities: [Modality.AUDIO, Modality.TEXT],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' }
                        }
                    },
                    systemInstruction: systemInstruction || 'You are Nizhal AI, a helpful and friendly desktop companion assistant.',
                    tools: tools.length > 0 ? tools : undefined
                }
            });

            // Handle audio input
            let isMuted = false;
            this.inputProcessor.onaudioprocess = (e) => {
                if (isMuted || !this.session) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);

                for (let i = 0; i < inputData.length; i++) {
                    pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }

                const base64 = this.arrayBufferToBase64(pcm16.buffer);

                this.session.sendRealtimeInput([{
                    media: {
                        mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                        data: base64
                    }
                }]);
            };

            // Handle session events
            this.session.on('open', () => {
                console.log('[GeminiLive] Connected');
                this.isConnected = true;
                this.onStateChange?.({ connected: true });
            });

            this.session.on('message', (message) => {
                this.handleServerMessage(message);
            });

            this.session.on('close', () => {
                console.log('[GeminiLive] Disconnected');
                this.isConnected = false;
                this.onStateChange?.({ connected: false });
            });

            this.session.on('error', (err) => {
                console.error('[GeminiLive] Error:', err);
                this.onError?.(err.message || 'Connection error');
            });

            // Store mute toggle function
            this.setMuted = (muted) => { isMuted = muted; };

            return true;
        } catch (error) {
            console.error('[GeminiLive] Connection failed:', error);
            this.onError?.(error.message || 'Failed to connect');
            return false;
        }
    }

    /**
     * Handle incoming server messages
     */
    handleServerMessage(message) {
        // Handle audio response
        if (message.data) {
            const audioData = this.base64ToArrayBuffer(message.data);
            this.playAudio(audioData);
        }

        // Handle text transcription
        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                    this.onTranscription?.({ role: 'ai', text: part.text });
                }
            }
        }

        // Handle user transcription
        if (message.serverContent?.inputTranscript) {
            this.onTranscription?.({
                role: 'user',
                text: message.serverContent.inputTranscript
            });
        }

        // Handle tool calls
        if (message.toolCall) {
            this.handleToolCall(message.toolCall);
        }
    }

    /**
     * Handle function/tool calls from Gemini
     */
    async handleToolCall(toolCall) {
        console.log('[GeminiLive] Tool call:', toolCall);

        let result = { success: false, message: 'Tool not implemented' };

        try {
            const functionName = toolCall.functionCalls?.[0]?.name;
            const args = toolCall.functionCalls?.[0]?.args || {};

            // Built-in tool handling
            switch (functionName) {
                case 'get_current_time':
                    result = {
                        success: true,
                        response: voiceTools.getTime()
                    };
                    break;

                case 'get_weather':
                    const weatherResult = await voiceTools.getWeather(args.city || args.location);
                    result = { success: true, response: weatherResult };
                    break;

                case 'search_web':
                    const searchResult = await voiceTools.searchWeb(args.query);
                    result = { success: true, response: searchResult };
                    break;

                case 'calculate':
                    result = {
                        success: true,
                        response: voiceTools.calculate(args.expression)
                    };
                    break;

                case 'set_reminder':
                    result = {
                        success: true,
                        response: voiceTools.setReminder(args.message, args.minutes)
                    };
                    break;

                case 'open_application':
                    if (window.nizhal?.system?.launchApp) {
                        await window.nizhal.system.launchApp(args.appName);
                        result = { success: true, message: `Opened ${args.appName}` };
                    }
                    break;

                default:
                    result = { success: false, message: `Unknown tool: ${functionName}` };
            }
        } catch (error) {
            result = { success: false, error: error.message };
        }

        // Send tool response back
        if (this.session) {
            this.session.sendToolResponse({
                functionResponses: [{
                    response: result,
                    id: toolCall.functionCalls?.[0]?.id
                }]
            });
        }
    }

    /**
     * Play audio response
     */
    playAudio(audioData) {
        if (!this.outputContext || !this.outputNode) return;

        const float32 = new Float32Array(audioData.byteLength / 2);
        const int16View = new Int16Array(audioData);

        for (let i = 0; i < int16View.length; i++) {
            float32[i] = int16View[i] / 32768;
        }

        const audioBuffer = this.outputContext.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
        audioBuffer.copyToChannel(float32, 0);

        const source = this.outputContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);

        this.activeSources.add(source);

        // Trigger lip-sync callbacks
        if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.onSpeakStart?.();
        }

        // Calculate audio energy for lip-sync
        let energy = 0;
        for (let i = 0; i < float32.length; i++) {
            energy += Math.abs(float32[i]);
        }
        energy = energy / float32.length;
        this.onSpeaking?.({ energy, duration: audioBuffer.duration });

        source.onended = () => {
            this.activeSources.delete(source);
            // Check if all sources finished
            if (this.activeSources.size === 0) {
                this.isSpeaking = false;
                this.onSpeakEnd?.();
            }
        };

        const startTime = Math.max(this.outputContext.currentTime, this.nextStartTime);
        source.start(startTime);
        this.nextStartTime = startTime + audioBuffer.duration;
    }

    /**
     * Send text message to session
     */
    sendText(text) {
        if (!this.session || !this.isConnected) {
            console.warn('[GeminiLive] Not connected');
            return false;
        }

        this.session.sendRealtimeInput([{ text }]);
        return true;
    }

    /**
     * Send image to session
     */
    sendImage(base64Data, mimeType = 'image/jpeg') {
        if (!this.session || !this.isConnected) {
            console.warn('[GeminiLive] Not connected');
            return false;
        }

        this.session.sendRealtimeInput([{
            media: {
                mimeType,
                data: base64Data
            }
        }]);
        return true;
    }

    /**
     * Disconnect from Gemini Live
     */
    disconnect() {
        // Stop audio sources
        this.activeSources.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        this.activeSources.clear();

        // Disconnect input
        if (this.inputProcessor) {
            this.inputProcessor.disconnect();
            this.inputProcessor = null;
        }
        if (this.inputSource) {
            this.inputSource.disconnect();
            this.inputSource = null;
        }

        // Stop media stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Close session
        if (this.session) {
            try { this.session.close(); } catch (e) { }
            this.session = null;
        }

        this.isConnected = false;
        this.nextStartTime = 0;
        this.onStateChange?.({ connected: false });
    }

    /**
     * Set mute state
     */
    setMuted(muted) {
        // This function is set during connect()
    }

    /**
     * Helper: ArrayBuffer to Base64
     */
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Helper: Base64 to ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.disconnect();

        if (this.inputContext) {
            this.inputContext.close();
            this.inputContext = null;
        }
        if (this.outputContext) {
            this.outputContext.close();
            this.outputContext = null;
        }
    }
}

// Export singleton instance
const geminiLiveService = new GeminiLiveService();
export default geminiLiveService;
export { GeminiLiveService };
