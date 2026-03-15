/**
 * AdvancedVoiceService.js
 * Enhanced voice service with emotion detection, voice cloning, and advanced features
 */

export class AdvancedVoiceService {
    constructor(apiKey = '') {
        this.apiKey = apiKey;
        this.emotionAnalyzer = null;
        this.voiceCloner = null;
        this.voiceProfiles = new Map();
        this.emotionHistory = [];
        this.isRecording = false;
        this.audioContext = null;
        
        // Initialize audio context
        this.initializeAudioContext();
        
        // Initialize emotion detection
        this.initializeEmotionDetection();
        
        // Voice cloning providers
        this.cloningProviders = {
            elevenlabs: { enabled: !!apiKey, priority: 1 },
            coqui: { enabled: false, priority: 2 },
            custom: { enabled: false, priority: 3 }
        };
        
        // Emotion detection providers
        this.emotionProviders = {
            deepface: { enabled: true, priority: 1 },
            custom: { enabled: false, priority: 2 }
        };
    }
    
    /**
     * Initialize audio context for voice processing
     */
    initializeAudioContext() {
        try {
            // Check if we're in a browser environment
            if (typeof window !== 'undefined') {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                console.log('[AdvancedVoiceService] ✓ Audio context initialized');
            } else {
                console.warn('[AdvancedVoiceService] Audio context not available in main process - will be initialized in renderer');
                this.audioContextAvailable = false;
            }
        } catch (error) {
            console.error('[AdvancedVoiceService] Failed to initialize audio context:', error);
        }
    }
    
    /**
     * Initialize emotion detection capabilities
     */
    initializeEmotionDetection() {
        // Initialize with basic emotion detection from audio features
        this.emotionAnalyzer = {
            analyze: async (audioBuffer) => {
                return this.analyzeAudioEmotion(audioBuffer);
            }
        };
        
        console.log('[AdvancedVoiceService] ✓ Emotion detection initialized');
    }
    
    /**
     * Analyze emotion from audio buffer
     */
    async analyzeAudioEmotion(audioBuffer) {
        try {
            // Extract audio features
            const features = await this.extractAudioFeatures(audioBuffer);
            
            // Simple emotion detection based on audio features
            const emotions = {
                happy: this.calculateHappyScore(features),
                sad: this.calculateSadScore(features),
                angry: this.calculateAngryScore(features),
                neutral: this.calculateNeutralScore(features),
                excited: this.calculateExcitedScore(features)
            };
            
            // Find dominant emotion
            const dominantEmotion = Object.entries(emotions)
                .sort(([,a], [,b]) => b - a)[0][0];
            
            const result = {
                dominant: dominantEmotion,
                scores: emotions,
                confidence: Math.max(...Object.values(emotions)),
                features: features
            };
            
            // Store in history
            this.emotionHistory.push({
                timestamp: Date.now(),
                emotion: result,
                audioLength: audioBuffer.duration
            });
            
            // Keep only last 100 emotions
            if (this.emotionHistory.length > 100) {
                this.emotionHistory = this.emotionHistory.slice(-100);
            }
            
            return result;
        } catch (error) {
            console.error('[AdvancedVoiceService] Emotion analysis failed:', error);
            return { dominant: 'neutral', scores: { neutral: 1.0 }, confidence: 0.5 };
        }
    }
    
    /**
     * Extract audio features for emotion analysis
     */
    async extractAudioFeatures(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Calculate basic audio features
        const features = {
            // Energy/RMS
            rms: this.calculateRMS(channelData),
            
            // Zero crossing rate
            zcr: this.calculateZCR(channelData),
            
            // Spectral features
            spectralCentroid: this.calculateSpectralCentroid(channelData, sampleRate),
            spectralRolloff: this.calculateSpectralRolloff(channelData, sampleRate),
            
            // Pitch features
            pitch: this.estimatePitch(channelData, sampleRate),
            
            // Tempo features
            tempo: this.estimateTempo(channelData, sampleRate),
            
            // MFCC-like features (simplified)
            mfcc: this.calculateSimpleMFCC(channelData, sampleRate)
        };
        
        return features;
    }
    
    /**
     * Calculate RMS (Root Mean Square) energy
     */
    calculateRMS(channelData) {
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        return Math.sqrt(sum / channelData.length);
    }
    
    /**
     * Calculate Zero Crossing Rate
     */
    calculateZCR(channelData) {
        let crossings = 0;
        for (let i = 1; i < channelData.length; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
                crossings++;
            }
        }
        return crossings / channelData.length;
    }
    
    /**
     * Calculate Spectral Centroid
     */
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
    
    /**
     * Calculate Spectral Rolloff
     */
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
    
    /**
     * Estimate fundamental pitch
     */
    estimatePitch(channelData, sampleRate) {
        // Simplified pitch detection using autocorrelation
        const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
        const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
        
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
    
    /**
     * Estimate tempo (simplified)
     */
    estimateTempo(channelData, sampleRate) {
        // This is a very simplified tempo estimation
        // In production, you'd use more sophisticated algorithms
        const energy = this.calculateRMS(channelData);
        const variance = this.calculateVariance(channelData);
        
        // Heuristic: higher variance often correlates with faster tempo
        const tempoEstimate = 60 + (variance * 200); // Rough estimate
        return Math.min(200, Math.max(40, tempoEstimate));
    }
    
    /**
     * Calculate variance
     */
    calculateVariance(channelData) {
        const mean = channelData.reduce((a, b) => a + b, 0) / channelData.length;
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += (channelData[i] - mean) ** 2;
        }
        return sum / channelData.length;
    }
    
    /**
     * Simple FFT implementation
     */
    performFFT(channelData) {
        // This is a placeholder - in production, you'd use a proper FFT library
        const length = Math.pow(2, Math.ceil(Math.log2(channelData.length)));
        const real = new Float32Array(length);
        const imag = new Float32Array(length);
        
        // Copy channel data to real part
        for (let i = 0; i < channelData.length; i++) {
            real[i] = channelData[i];
        }
        
        // Return interleaved real/imaginary array
        const result = new Float32Array(length * 2);
        for (let i = 0; i < length; i++) {
            result[i * 2] = real[i];
            result[i * 2 + 1] = imag[i];
        }
        
        return result;
    }
    
    /**
     * Calculate simplified MFCC-like features
     */
    calculateSimpleMFCC(channelData, sampleRate) {
        // Simplified MFCC calculation
        const fft = this.performFFT(channelData);
        const magnitudes = [];
        
        for (let i = 0; i < fft.length / 2; i++) {
            magnitudes.push(Math.sqrt(fft[i * 2] ** 2 + fft[i * 2 + 1] ** 2));
        }
        
        // Convert to log scale
        const logMagnitudes = magnitudes.map(m => Math.log(m + 1e-10));
        
        // Return first 13 coefficients (simplified)
        return logMagnitudes.slice(0, 13);
    }
    
    /**
     * Emotion scoring functions
     */
    calculateHappyScore(features) {
        // Happy: higher energy, higher pitch, faster tempo
        const energyScore = Math.min(features.rms * 10, 1);
        const pitchScore = Math.min(features.pitch / 300, 1);
        const tempoScore = Math.min(features.tempo / 120, 1);
        
        return (energyScore + pitchScore + tempoScore) / 3;
    }
    
    calculateSadScore(features) {
        // Sad: lower energy, lower pitch, slower tempo
        const energyScore = Math.max(0, 1 - features.rms * 10);
        const pitchScore = Math.max(0, 1 - features.pitch / 200);
        const tempoScore = Math.max(0, 1 - features.tempo / 100);
        
        return (energyScore + pitchScore + tempoScore) / 3;
    }
    
    calculateAngryScore(features) {
        // Angry: high energy, high pitch variation, fast tempo
        const energyScore = Math.min(features.rms * 15, 1);
        const zcrScore = Math.min(features.zcr * 100, 1);
        const tempoScore = Math.min(features.tempo / 140, 1);
        
        return (energyScore + zcrScore + tempoScore) / 3;
    }
    
    calculateNeutralScore(features) {
        // Neutral: moderate energy, moderate features
        const energyScore = 1 - Math.abs(features.rms - 0.1) * 10;
        const pitchScore = 1 - Math.abs(features.pitch - 150) / 150;
        const tempoScore = 1 - Math.abs(features.tempo - 80) / 80;
        
        return Math.max(0, (energyScore + pitchScore + tempoScore) / 3);
    }
    
    calculateExcitedScore(features) {
        // Excited: very high energy, high tempo, high spectral centroid
        const energyScore = Math.min(features.rms * 20, 1);
        const tempoScore = Math.min(features.tempo / 150, 1);
        const centroidScore = Math.min(features.spectralCentroid / 2000, 1);
        
        return (energyScore + tempoScore + centroidScore) / 3;
    }
    
    /**
     * Record audio for voice cloning
     */
    async recordForVoiceCloning(duration = 30) {
        if (!this.audioContext) {
            throw new Error('Audio context not initialized');
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            const chunks = [];
            this.isRecording = true;
            
            processor.onaudioprocess = (e) => {
                if (!this.isRecording) return;
                chunks.push(e.inputBuffer.getChannelData(0));
            };
            
            source.connect(processor);
            processor.connect(this.audioContext.destination);
            
            // Record for specified duration
            await new Promise(resolve => setTimeout(resolve, duration * 1000));
            
            this.isRecording = false;
            source.disconnect();
            processor.disconnect();
            stream.getTracks().forEach(track => track.stop());
            
            // Combine chunks into single buffer
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
            throw new Error(`Recording failed: ${error.message}`);
        }
    }
    
    /**
     * Create voice profile from recording
     */
    async createVoiceProfile(name, audioBuffer, options = {}) {
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
            
            console.log(`[AdvancedVoiceService] ✓ Created voice profile: ${name}`);
            return profile;
        } catch (error) {
            console.error('[AdvancedVoiceService] Failed to create voice profile:', error);
            throw error;
        }
    }
    
    /**
     * Synthesize speech with voice cloning
     */
    async synthesizeWithClonedVoice(text, voiceProfileId, emotion = 'neutral') {
        const profile = this.voiceProfiles.get(voiceProfileId);
        if (!profile) {
            throw new Error('Voice profile not found');
        }
        
        try {
            // This would integrate with voice cloning APIs
            // For now, return a mock implementation
            console.log(`[AdvancedVoiceService] Synthesizing with cloned voice: ${profile.name}`);
            
            // In production, you'd send the profile and text to cloning service
            return {
                audioBuffer: null, // Would contain actual audio
                profile: profile,
                emotion: emotion,
                text: text,
                duration: text.length * 100 // Estimate
            };
        } catch (error) {
            console.error('[AdvancedVoiceService] Voice cloning synthesis failed:', error);
            throw error;
        }
    }
    
    /**
     * Get emotion history
     */
    getEmotionHistory(limit = 50) {
        return this.emotionHistory.slice(-limit);
    }
    
    /**
     * Get voice profiles
     */
    getVoiceProfiles() {
        return Array.from(this.voiceProfiles.values());
    }
    
    /**
     * Delete voice profile
     */
    deleteVoiceProfile(profileId) {
        return this.voiceProfiles.delete(profileId);
    }
    
    /**
     * Analyze emotion in real-time from microphone
     */
    async startRealTimeEmotionDetection(callback) {
        if (!this.audioContext) {
            throw new Error('Audio context not initialized');
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            const analyzer = this.audioContext.createAnalyser();
            const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
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
            };
        } catch (error) {
            throw new Error(`Real-time emotion detection failed: ${error.message}`);
        }
    }
    
    /**
     * Stop recording
     */
    stopRecording() {
        this.isRecording = false;
    }
    
    /**
     * Get service status
     */
    getStatus() {
        return {
            isRecording: this.isRecording,
            audioContextState: this.audioContext?.state || 'unavailable',
            voiceProfilesCount: this.voiceProfiles.size,
            emotionHistoryCount: this.emotionHistory.length,
            cloningProviders: Object.entries(this.cloningProviders)
                .filter(([_, config]) => config.enabled)
                .map(([name]) => name),
            emotionProviders: Object.entries(this.emotionProviders)
                .filter(([_, config]) => config.enabled)
                .map(([name]) => name)
        };
    }
}

export default AdvancedVoiceService;
