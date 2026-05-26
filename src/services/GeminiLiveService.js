/**
 * GeminiLiveService.js
 *
 * Provides real-time, low-latency bidirectional voice communication
 * utilizing the Gemini Live API over WebSockets.
 */

import { voiceTools } from './VoiceTools.js';
import assistant from '../assistant/index.js';
import PermissionService from './PermissionService.js';

const MODEL_NAME = 'gemini-2.0-flash-exp';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

class GeminiLiveService {
    constructor() {
        this.session = null;
        this.isConnected = false;
        this.isPrivacyMode = false;
        this.isMicrophoneMuted = false;

        // Web Audio components
        this.inputContext = null;
        this.outputContext = null;
        this.inputProcessor = null;
        this.inputSource = null;
        this.outputNode = null;

        // Telemetry analysers
        this.analyserIn = null;
        this.analyserOut = null;

        // Stream handlers
        this.activeSources = new Set();
        this.nextStartTime = 0;
        this.stream = null;
        this.isSpeaking = false;

        // Watchdog parameters
        this.watchdogTimer = null;
        this.lastMessageTime = Date.now();

        // Standard callback bindings
        this.onStateChange = null;
        this.onTranscription = null;
        this.onAudioLevel = null;
        this.onError = null;
        this.onSpeakStart = null;
        this.onSpeakEnd = null;
        this.onSpeaking = null;

        console.log('[GeminiLiveService] Service initialized');
    }

    /**
     * Initializes components and resets active runtimes.
     */
    async init() {
        try {
            await this.reset();
            this.startWatchdog();
            return { success: true };
        } catch (error) {
            console.error('[GeminiLiveService] Initialization failure:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Toggles privacy mode. When active, all cloud endpoints are unreachable.
     */
    setPrivacyMode(enabled) {
        this.isPrivacyMode = enabled;
        if (enabled && this.isConnected) {
            this.disconnect();
        }
    }

    /**
     * Toggles local microphone input streams.
     */
    setMuted(muted) {
        this.isMicrophoneMuted = muted;
        console.log('[GeminiLiveService] Local microphone muted:', muted);
    }

    /**
     * Prepares core Web Audio pipeline components.
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
     * Exposes visualizer analyzer nodes.
     */
    getAnalysers() {
        return {
            analyserIn: this.analyserIn,
            analyserOut: this.analyserOut
        };
    }

    /**
     * Establishes dynamic WebSocket links directly into the Gemini Live endpoints.
     */
    async connect(apiKey, systemInstruction = '', tools = []) {
        if (this.isPrivacyMode) {
            const err = 'Privacy mode active - cloud streams are blocked';
            console.warn('[GeminiLiveService]', err);
            this.onError?.(err);
            return false;
        }

        if (!apiKey) {
            const err = 'Gemini API key is required';
            console.warn('[GeminiLiveService]', err);
            this.onError?.(err);
            return false;
        }

        // Pre-flight permission check
        const permStatus = await PermissionService.check();
        if (permStatus.mic === 'prompt') {
            const result = await PermissionService.request('microphone');
            if (result !== 'granted') {
                const err = 'Microphone permission prompt was not granted';
                console.warn('[GeminiLiveService]', err);
                this.onError?.(err);
                return false;
            }
        } else if (permStatus.mic === 'denied') {
            const err = 'Microphone permission is blocked in OS/Browser settings';
            console.warn('[GeminiLiveService]', err);
            window.dispatchEvent(new CustomEvent('nizhal-permission-denied', {
                detail: { type: 'microphone', message: 'Microphone access is blocked in System Settings.' }
            }));
            this.onError?.(err);
            return false;
        }

        try {
            this.ensureAudioContexts();

            // Request capture hardware access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: INPUT_SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
            this.inputProcessor = this.inputContext.createScriptProcessor(4096, 1, 1);

            this.inputSource.connect(this.analyserIn);
            this.inputSource.connect(this.inputProcessor);
            this.inputProcessor.connect(this.inputContext.destination);

            const { GoogleGenAI, Modality } = await import('@google/genai');
            const genAI = new GoogleGenAI(apiKey);

            this.session = await genAI.live.connect(MODEL_NAME, {
                config: {
                    responseModalities: [Modality.AUDIO, Modality.TEXT],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' }
                        }
                    },
                    systemInstruction: systemInstruction || 'You are Nizhal AI, a friendly local desktop assistant.',
                    tools: [
                        ...tools,
                        {
                            functionDeclarations: [
                                {
                                    name: "join_livekit_room",
                                    description: "Join a LiveKit voice/video room for communication.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            roomName: {
                                                type: "STRING",
                                                description: "Name of the room to join (e.g., 'team-work', 'john-personal')."
                                            }
                                        },
                                        required: ["roomName"]
                                    }
                                }
                            ]
                        }
                    ]
                }
            });

            // Pipeline process callback
            this.inputProcessor.onaudioprocess = (e) => {
                if (this.isMicrophoneMuted || !this.session || !this.isConnected) return;

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

            this.session.on('open', () => {
                console.log('[GeminiLiveService] WebSocket session established');
                this.isConnected = true;
                this.lastMessageTime = Date.now();
                this.onStateChange?.({ connected: true });
            });

            this.session.on('message', (message) => {
                this.lastMessageTime = Date.now();
                this.handleServerMessage(message);
            });

            this.session.on('close', () => {
                console.log('[GeminiLiveService] WebSocket session terminated');
                this.isConnected = false;
                this.onStateChange?.({ connected: false });
            });

            this.session.on('error', (err) => {
                console.error('[GeminiLiveService] Session error event:', err);
                this.onError?.(err.message || 'WebSocket session error');
            });

            return true;
        } catch (error) {
            console.error('[GeminiLiveService] Connection attempt failed:', error);
            this.onError?.(error.message || 'Connection pipeline setup error');
            return false;
        }
    }

    /**
     * Dispatcher routing received stream data packages.
     */
    handleServerMessage(message) {
        if (message.data) {
            const audioData = this.base64ToArrayBuffer(message.data);
            this.playAudio(audioData);
        }

        if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                    this.onTranscription?.({ role: 'ai', text: part.text });
                }
            }
        }

        if (message.serverContent?.inputTranscript) {
            this.onTranscription?.({
                role: 'user',
                text: message.serverContent.inputTranscript
            });
        }

        if (message.toolCall) {
            this.handleToolCall(message.toolCall);
        }
    }

    /**
     * Handles tool and function execution triggered by LLM responses.
     */
    async handleToolCall(toolCall) {
        console.log('[GeminiLiveService] Tool request received:', toolCall);
        let result = { success: false, message: 'Tool execution error' };

        try {
            const functionName = toolCall.functionCalls?.[0]?.name;
            const args = toolCall.functionCalls?.[0]?.args || {};

            switch (functionName) {
                case 'get_current_time':
                    result = { success: true, response: voiceTools.getTime() };
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
                    result = { success: true, response: voiceTools.calculate(args.expression) };
                    break;

                case 'set_reminder':
                    result = { success: true, response: voiceTools.setReminder(args.message, args.minutes) };
                    break;

                case 'open_application':
                    if (window.nizhal?.system?.launchApp) {
                        await window.nizhal.system.launchApp(args.appName);
                        result = { success: true, message: `Application ${args.appName} launched` };
                    }
                    break;

                case 'join_livekit_room':
                    const roomName = args.roomName || 'john-personal';
                    await assistant.roomManager.connect(roomName);
                    result = { success: true, message: `Joined livekit conference: ${roomName}` };
                    break;

                default:
                    result = { success: false, message: `Function ${functionName} not found` };
            }
        } catch (error) {
            result = { success: false, error: error.message };
        }

        if (this.session) {
            try {
                this.session.sendToolResponse({
                    functionResponses: [{
                        response: result,
                        id: toolCall.functionCalls?.[0]?.id
                    }]
                });
            } catch (err) {
                console.error('[GeminiLiveService] Failed to return tool execution results:', err);
            }
        }
    }

    /**
     * Decodes and streams AI voice frames safely.
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

        if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.onSpeakStart?.();
        }

        let energy = 0;
        for (let i = 0; i < float32.length; i++) {
            energy += Math.abs(float32[i]);
        }
        energy = energy / float32.length;
        this.onSpeaking?.({ energy, duration: audioBuffer.duration });

        source.onended = () => {
            this.activeSources.delete(source);
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
     * Dispatches runtime user texts.
     */
    sendText(text) {
        if (!this.session || !this.isConnected) {
            console.warn('[GeminiLiveService] Text dispatch skipped - session disconnected');
            return false;
        }
        try {
            this.session.sendRealtimeInput([{ text }]);
            return true;
        } catch (error) {
            console.error('[GeminiLiveService] Text dispatch error:', error);
            return false;
        }
    }

    /**
     * Dispatches runtime visual matrix.
     */
    sendImage(base64Data, mimeType = 'image/jpeg') {
        if (!this.session || !this.isConnected) {
            console.warn('[GeminiLiveService] Visual dispatch skipped - session disconnected');
            return false;
        }
        try {
            this.session.sendRealtimeInput([{
                media: { mimeType, data: base64Data }
            }]);
            return true;
        } catch (error) {
            console.error('[GeminiLiveService] Visual dispatch error:', error);
            return false;
        }
    }

    /**
     * Safely closes open sessions and hardware nodes.
     */
    disconnect() {
        this.activeSources.forEach(source => {
            try { source.stop(); } catch (e) {}
        });
        this.activeSources.clear();

        if (this.inputProcessor) {
            try { this.inputProcessor.disconnect(); } catch (e) {}
            this.inputProcessor = null;
        }
        if (this.inputSource) {
            try { this.inputSource.disconnect(); } catch (e) {}
            this.inputSource = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                try { track.stop(); } catch (e) {}
            });
            this.stream = null;
        }

        if (this.session) {
            try { this.session.close(); } catch (e) {}
            this.session = null;
        }

        this.isConnected = false;
        this.nextStartTime = 0;
        this.onStateChange?.({ connected: false });
    }

    /**
     * Stop alias.
     */
    stop() {
        this.disconnect();
    }

    /**
     * Performs clean teardowns and parameter clearing.
     */
    async reset() {
        this.disconnect();

        if (this.inputContext) {
            try { await this.inputContext.close(); } catch (e) {}
            this.inputContext = null;
        }
        if (this.outputContext) {
            try { await this.outputContext.close(); } catch (e) {}
            this.outputContext = null;
        }

        this.ensureAudioContexts();
        this.isSpeaking = false;
        this.isMicrophoneMuted = false;
        this.nextStartTime = 0;
    }

    /**
     * Terminate completely.
     */
    destroy() {
        this.stopWatchdog();
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

    /**
     * Returns a snapshot of the current service status.
     */
    getState() {
        return {
            connected: this.isConnected,
            privacyMode: this.isPrivacyMode,
            muted: this.isMicrophoneMuted,
            speaking: this.isSpeaking,
            activeSourcesCount: this.activeSources.size,
            healthStatus: this.isConnected && (Date.now() - this.lastMessageTime > 30000) ? 'unresponsive' : 'healthy',
        };
    }

    /**
     * Internal base64 encoder.
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
     * Internal base64 decoder.
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
     * Starts watchdog connectivity checker.
     */
    startWatchdog() {
        if (this.watchdogTimer) return;

        this.watchdogTimer = setInterval(() => {
            if (this.isConnected && (Date.now() - this.lastMessageTime > 45000)) {
                console.warn('[GeminiLiveService] Watchdog triggered - session inactive. Disconnecting.');
                this.lastMessageTime = Date.now();
                this.disconnect();
            }
        }, 15000);
    }

    stopWatchdog() {
        if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);
            this.watchdogTimer = null;
        }
    }
}

const geminiLiveService = new GeminiLiveService();
export default geminiLiveService;
export { GeminiLiveService };
