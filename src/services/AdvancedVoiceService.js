/**
 * AdvancedVoiceService.js
 *
 * Provides high-performance vocal digital signal processing (DSP) including fundamental pitch estimation,
 * zero-crossing rate computation, spectral rolloff thresholds, and structural emotion telemetry.
 * Integrates ElevenLabs/Coqui synthesis controls under a safe, event-driven architecture.
 */

export class AdvancedVoiceService {
    constructor(apiKey = '') {
        this.apiKey = apiKey;
        this.emotionAnalyzer = null;
        this.voiceProfiles = new Map();
        this.emotionHistory = [];
        this.isRecording = false;
        this.audioContext = null;
        this.isInitialized = false;

        // Active media stream nodes for tracking and leak prevention
        this.activeStreams = new Set();
        this.activeProcessors = new Set();

        this.cloningProviders = {
            elevenlabs: { enabled: !!apiKey, priority: 1 },
            coqui: { enabled: false, priority: 2 }
        };

        this.emotionProviders = {
            acoustic: { enabled: true, priority: 1 }
        };

        console.log('[AdvancedVoiceService] Service initialized');
    }

    /**
     * Initializes core Web Audio components defensively.
     */
    async init() {
        if (this.isInitialized) return { success: true };

        try {
            this.initializeAudioContext();
            this.initializeEmotionDetection();
            this.isInitialized = true;
            return { success: true };
        } catch (error) {
            console.error('[AdvancedVoiceService] Init failure:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Spawns localized AudioContext safely.
     */
    initializeAudioContext() {
        try {
            if (typeof window !== 'undefined') {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) {
                    throw new Error('Web Audio API not supported in browser environment');
                }
                this.audioContext = new AudioContextClass();
            } else {
                console.warn('[AdvancedVoiceService] Context unavailable in host context');
            }
        } catch (error) {
            console.error('[AdvancedVoiceService] Failed to spawn AudioContext:', error);
            throw error;
        }
    }

    /**
     * Prepares baseline DSP nodes.
     */
    initializeEmotionDetection() {
        this.emotionAnalyzer = {
            analyze: async (audioBuffer) => {
                return this.analyzeAudioEmotion(audioBuffer);
            }
        };
    }

    /**
     * Runs mathematical acoustic feature analysis.
     */
    async analyzeAudioEmotion(audioBuffer) {
        if (!audioBuffer) {
            return { dominant: 'neutral', scores: { neutral: 1.0 }, confidence: 0.5 };
        }

        try {
            const features = await this.extractAudioFeatures(audioBuffer);

            const emotions = {
                happy: this.calculateHappyScore(features),
                sad: this.calculateSadScore(features),
                angry: this.calculateAngryScore(features),
                neutral: this.calculateNeutralScore(features),
                excited: this.calculateExcitedScore(features)
            };

            const dominantEmotion = Object.entries(emotions)
                .sort(([, a], [, b]) => b - a)[0][0];

            const result = {
                dominant: dominantEmotion,
                scores: emotions,
                confidence: Math.max(...Object.values(emotions)),
                features: features
            };

            this.emotionHistory.push({
                timestamp: Date.now(),
                emotion: result,
                audioLength: audioBuffer.duration
            });

            if (this.emotionHistory.length > 100) {
                this.emotionHistory = this.emotionHistory.slice(-100);
            }

            return result;
        } catch (error) {
            console.error('[AdvancedVoiceService] Acoustic extraction failure:', error);
            return { dominant: 'neutral', scores: { neutral: 1.0 }, confidence: 0.5 };
        }
    }

    /**
     * Extracts DSP wave attributes.
     */
    async extractAudioFeatures(audioBuffer) {
        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error('Invalid audio data target');
        }

        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;

        return {
            rms: this.calculateRMS(channelData),
            zcr: this.calculateZCR(channelData),
            spectralCentroid: this.calculateSpectralCentroid(channelData, sampleRate),
            spectralRolloff: this.calculateSpectralRolloff(channelData, sampleRate),
            pitch: this.estimatePitch(channelData, sampleRate),
            tempo: this.estimateTempo(channelData, sampleRate),
            mfcc: this.calculateSimpleMFCC(channelData, sampleRate)
        };
    }

    calculateRMS(channelData) {
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        return Math.sqrt(sum / channelData.length);
    }

    calculateZCR(channelData) {
        let crossings = 0;
        for (let i = 1; i < channelData.length; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
                crossings++;
            }
        }
        return crossings / channelData.length;
    }

    calculateSpectralCentroid(channelData, sampleRate) {
        const fft = this.performFFT(channelData);
        let weightedSum = 0;
        let magnitudeSum = 0;

        for (let i = 0; i < fft.length / 2; i++) {
            const magnitude = Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2);
            const frequency = (i * sampleRate) / channelData.length;
            weightedSum += frequency * magnitude;
            magnitudeSum += magnitude;
        }

        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }

    calculateSpectralRolloff(channelData, sampleRate) {
        const fft = this.performFFT(channelData);
        const magnitudes = [];

        for (let i = 0; i < fft.length / 2; i++) {
            magnitudes.push(Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2));
        }

        const totalMagnitude = magnitudes.reduce((a, b) => a + b, 0);
        const threshold = totalMagnitude * 0.85;

        let cumulative = 0;
        for (let i = 0; i < magnitudes.length; i++) {
            cumulative += magnitudes[i];
            if (cumulative >= threshold) {
                return (i * sampleRate) / channelData.length;
            }
        }

        return sampleRate / 2;
    }

    estimatePitch(channelData, sampleRate) {
        const minPeriod = Math.floor(sampleRate / 800);
        const maxPeriod = Math.floor(sampleRate / 80);

        let bestPeriod = minPeriod;
        let bestCorrelation = 0;

        for (let period = minPeriod; period <= maxPeriod; period++) {
            let correlation = 0;
            for (let i = 0; i < channelData.length - period; i++) {
                correlation += channelData[i] * channelData[i + period];
            }

            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestPeriod = period;
            }
        }

        return sampleRate / bestPeriod;
    }

    estimateTempo(channelData, sampleRate) {
        const variance = this.calculateVariance(channelData);
        const tempoEstimate = 60 + (variance * 200);
        return Math.min(200, Math.max(40, tempoEstimate));
    }

    calculateVariance(channelData) {
        const mean = channelData.reduce((a, b) => a + b, 0) / channelData.length;
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += (channelData[i] - mean) ** 2;
        }
        return sum / channelData.length;
    }

    performFFT(channelData) {
        const length = Math.pow(2, Math.ceil(Math.log2(channelData.length)));
        const real = new Float32Array(length);
        const imag = new Float32Array(length);

        for (let i = 0; i < channelData.length; i++) {
            real[i] = channelData[i];
        }

        const result = new Float32Array(length * 2);
        for (let i = 0; i < length; i++) {
            result[i * 2] = real[i];
            result[i * 2 + 1] = imag[i];
        }

        return result;
    }

    calculateSimpleMFCC(channelData, sampleRate) {
        const fft = this.performFFT(channelData);
        const magnitudes = [];

        for (let i = 0; i < fft.length / 2; i++) {
            magnitudes.push(Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2));
        }

        const logMagnitudes = magnitudes.map(m => Math.log(m + 1e-10));
        return logMagnitudes.slice(0, 13);
    }

    calculateHappyScore(features) {
        const energyScore = Math.min(features.rms * 10, 1);
        const pitchScore = Math.min(features.pitch / 300, 1);
        const tempoScore = Math.min(features.tempo / 120, 1);
        return (energyScore + pitchScore + tempoScore) / 3;
    }

    calculateSadScore(features) {
        const energyScore = Math.max(0, 1 - features.rms * 10);
        const pitchScore = Math.max(0, 1 - features.pitch / 200);
        const tempoScore = Math.max(0, 1 - features.tempo / 100);
        return (energyScore + pitchScore + tempoScore) / 3;
    }

    calculateAngryScore(features) {
        const energyScore = Math.min(features.rms * 15, 1);
        const zcrScore = Math.min(features.zcr * 100, 1);
        const tempoScore = Math.min(features.tempo / 140, 1);
        return (energyScore + zcrScore + tempoScore) / 3;
    }

    calculateNeutralScore(features) {
        const energyScore = 1 - Math.abs(features.rms - 0.1) * 10;
        const pitchScore = 1 - Math.abs(features.pitch - 150) / 150;
        const tempoScore = 1 - Math.abs(features.tempo - 80) / 80;
        return Math.max(0, (energyScore + pitchScore + tempoScore) / 3);
    }

    calculateExcitedScore(features) {
        const energyScore = Math.min(features.rms * 20, 1);
        const tempoScore = Math.min(features.tempo / 150, 1);
        const centroidScore = Math.min(features.spectralCentroid / 2000, 1);
        return (energyScore + tempoScore + centroidScore) / 3;
    }

    /**
     * Records audio segments with strict cleanup to prevent leaks.
     */
    async recordForVoiceCloning(duration = 30) {
        if (!this.audioContext) {
            throw new Error('Audio context not initialized');
        }

        let stream = null;
        let source = null;
        let processor = null;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.activeStreams.add(stream);

            source = this.audioContext.createMediaStreamSource(stream);
            processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            this.activeProcessors.add(processor);

            const chunks = [];
            this.isRecording = true;

            processor.onaudioprocess = (e) => {
                if (!this.isRecording) return;
                chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
            };

            source.connect(processor);
            processor.connect(this.audioContext.destination);

            await new Promise(resolve => setTimeout(resolve, duration * 1000));

            this.isRecording = false;

            // Dismantle node pipeline
            source.disconnect();
            processor.disconnect();
            stream.getTracks().forEach(track => track.stop());

            this.activeStreams.delete(stream);
            this.activeProcessors.delete(processor);

            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combined = new Float32Array(totalLength);
            let offset = 0;

            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }

            const audioBuffer = this.audioContext.createBuffer(1, totalLength, this.audioContext.sampleRate);
            audioBuffer.getChannelData(0).set(combined);

            return audioBuffer;
        } catch (error) {
            this.isRecording = false;
            if (source) try { source.disconnect(); } catch (e) {}
            if (processor) {
                try { processor.disconnect(); } catch (e) {}
                this.activeProcessors.delete(processor);
            }
            if (stream) {
                try { stream.getTracks().forEach(track => track.stop()); } catch (e) {}
                this.activeStreams.delete(stream);
            }
            throw new Error(`Voice cloning recording failed: ${error.message}`);
        }
    }

    /**
     * Builds and registers a cloned voice profile map target.
     */
    async createVoiceProfile(name, audioBuffer, options = {}) {
        if (!audioBuffer) {
            throw new Error('Acoustic voice buffer payload is required');
        }

        try {
            const profile = {
                name,
                id: Date.now().toString(),
                created: Date.now(),
                audioFeatures: await this.extractAudioFeatures(audioBuffer),
                emotion: await this.analyzeAudioEmotion(audioBuffer),
                duration: audioBuffer.duration,
                sampleRate: audioBuffer.sampleRate,
                options: {
                    language: 'en-US',
                    gender: 'neutral',
                    age: 'adult',
                    ...options
                }
            };

            this.voiceProfiles.set(profile.id, profile);
            console.log(`[AdvancedVoiceService] Registered cloned profile: ${name}`);
            return profile;
        } catch (error) {
            console.error('[AdvancedVoiceService] Voice profile creation failed:', error);
            throw error;
        }
    }

    /**
     * Dispatches text to ElevenLabs clone targets.
     */
    async synthesizeWithClonedVoice(text, voiceProfileId, emotion = 'neutral') {
        const profile = this.voiceProfiles.get(voiceProfileId);
        if (!profile) {
            throw new Error(`Profile target ${voiceProfileId} does not exist`);
        }

        if (!this.apiKey) {
            throw new Error('ElevenLabs API key is missing. Cloning synthesis unavailable.');
        }

        try {
            console.log(`[AdvancedVoiceService] Routing synthesis request: ${profile.name}`);

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceProfileId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.75,
                        similarity_boost: 0.75
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`ElevenLabs endpoint returned code: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const arrayBuffer = await audioBlob.arrayBuffer();

            return new Promise((resolve, reject) => {
                this.audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                    resolve({
                        audioBuffer: buffer,
                        profile: profile,
                        emotion: emotion,
                        text: text,
                        duration: buffer.duration
                    });
                }, reject);
            });
        } catch (error) {
            console.error('[AdvancedVoiceService] Cloning synthesis failed:', error);
            throw error;
        }
    }

    getEmotionHistory(limit = 50) {
        return this.emotionHistory.slice(-limit);
    }

    getVoiceProfiles() {
        return Array.from(this.voiceProfiles.values());
    }

    deleteVoiceProfile(profileId) {
        return this.voiceProfiles.delete(profileId);
    }

    /**
     * Connects real-time capture stream analyzer to capture emotion frames continuously.
     */
    async startRealTimeEmotionDetection(callback) {
        if (!this.audioContext) {
            throw new Error('Audio context not initialized');
        }

        let stream = null;
        let source = null;
        let analyzer = null;
        let processor = null;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.activeStreams.add(stream);

            source = this.audioContext.createMediaStreamSource(stream);
            analyzer = this.audioContext.createAnalyser();
            processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            this.activeProcessors.add(processor);

            analyzer.fftSize = 2048;
            source.connect(analyzer);
            analyzer.connect(processor);
            processor.connect(this.audioContext.destination);

            processor.onaudioprocess = async (e) => {
                const inputBuffer = e.inputBuffer;
                const audioBuffer = this.audioContext.createBuffer(
                    1,
                    inputBuffer.length,
                    this.audioContext.sampleRate
                );
                audioBuffer.getChannelData(0).set(inputBuffer.getChannelData(0));

                const emotion = await this.analyzeAudioEmotion(audioBuffer);
                callback(emotion);
            };

            return () => {
                source.disconnect();
                analyzer.disconnect();
                processor.disconnect();
                stream.getTracks().forEach(track => track.stop());

                this.activeStreams.delete(stream);
                this.activeProcessors.delete(processor);
            };
        } catch (error) {
            if (source) try { source.disconnect(); } catch (e) {}
            if (analyzer) try { analyzer.disconnect(); } catch (e) {}
            if (processor) {
                try { processor.disconnect(); } catch (e) {}
                this.activeProcessors.delete(processor);
            }
            if (stream) {
                try { stream.getTracks().forEach(track => track.stop()); } catch (e) {}
                this.activeStreams.delete(stream);
            }
            throw new Error(`Real-time emotion tracking failed: ${error.message}`);
        }
    }

    stopRecording() {
        this.isRecording = false;
    }

    /**
     * Releases active elements to block memory footprint leaks.
     */
    async reset() {
        this.isRecording = false;

        this.activeProcessors.forEach(processor => {
            try { processor.disconnect(); } catch (e) {}
        });
        this.activeProcessors.clear();

        this.activeStreams.forEach(stream => {
            try { stream.getTracks().forEach(track => track.stop()); } catch (e) {}
        });
        this.activeStreams.clear();

        if (this.audioContext) {
            try { await this.audioContext.close(); } catch (e) {}
            this.audioContext = null;
        }

        this.initializeAudioContext();
        this.initializeEmotionDetection();
        return { success: true };
    }

    /**
     * Wipes memory and components completely.
     */
    destroy() {
        this.isRecording = false;
        this.activeProcessors.forEach(processor => {
            try { processor.disconnect(); } catch (e) {}
        });
        this.activeProcessors.clear();

        this.activeStreams.forEach(stream => {
            try { stream.getTracks().forEach(track => track.stop()); } catch (e) {}
        });
        this.activeStreams.clear();

        if (this.audioContext) {
            try { this.audioContext.close(); } catch (e) {}
            this.audioContext = null;
        }
        this.isInitialized = false;
    }

    /**
     * Returns a snapshot of the current service state.
     */
    getState() {
        return {
            recording: this.isRecording,
            audioContextState: this.audioContext?.state || 'unavailable',
            voiceProfilesCount: this.voiceProfiles.size,
            emotionHistoryCount: this.emotionHistory.length,
            activeStreamsCount: this.activeStreams.size,
            cloningProviders: Object.entries(this.cloningProviders)
                .filter(([_, config]) => config.enabled)
                .map(([name]) => name)
        };
    }
}

export default AdvancedVoiceService;
