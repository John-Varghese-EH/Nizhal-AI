/**
 * LipSyncService - Provides lip synchronization for avatar speech
 * Analyzes audio for volume and generates viseme (mouth shape) data
 */
export class LipSyncService {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isAnalyzing = false;
        this.callbacks = new Set();

        // Viseme weights for different phonemes
        this.visemeWeights = {
            aa: 0, // 'a' as in 'father'
            ee: 0, // 'e' as in 'bee'
            ih: 0, // 'i' as in 'bit'
            oh: 0, // 'o' as in 'go'
            ou: 0, // 'u' as in 'you'
            closed: 1 // mouth closed
        };

        // Animation frame ID for cancellation
        this.animationFrame = null;
    }

    /**
     * Initialize audio analysis
     */
    async initialize() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            console.log('LipSync audio context initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }

    /**
     * Start analyzing audio from an HTMLAudioElement
     * @param {HTMLAudioElement} audioElement - Audio element to analyze
     */
    startAnalysis(audioElement) {
        if (!this.audioContext || !audioElement) return;

        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Create media element source
            const source = this.audioContext.createMediaElementSource(audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.isAnalyzing = true;
            this.analyze();
        } catch (error) {
            // May already be connected, try direct analysis
            console.warn('Audio source connection warning:', error.message);
            this.isAnalyzing = true;
            this.analyze();
        }
    }

    /**
     * Start analyzing microphone input (for listening mode)
     */
    async startMicrophoneAnalysis() {
        if (!this.audioContext) await this.initialize();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            // Don't connect to destination (would cause feedback)

            this.isAnalyzing = true;
            this.analyze();

            return stream;
        } catch (error) {
            console.error('Microphone access denied:', error);
            return null;
        }
    }

    /**
     * Main analysis loop - calculates viseme weights from audio
     */
    analyze() {
        if (!this.isAnalyzing || !this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate overall volume (0-1)
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const volume = sum / (this.dataArray.length * 255);

        // Simple viseme estimation based on volume
        // For more accurate lip sync, you'd use phoneme recognition
        const mouthOpenness = Math.min(1, volume * 3);

        // Simulate different mouth shapes based on randomness and volume
        const time = Date.now() * 0.01;
        const variation = Math.sin(time) * 0.3 + 0.7;

        this.visemeWeights = {
            aa: mouthOpenness * variation,
            ee: mouthOpenness * (1 - variation) * 0.5,
            ih: mouthOpenness * Math.abs(Math.sin(time * 1.3)) * 0.3,
            oh: mouthOpenness * Math.abs(Math.cos(time)) * 0.4,
            ou: mouthOpenness * Math.abs(Math.sin(time * 0.7)) * 0.3,
            closed: 1 - mouthOpenness
        };

        // Notify callbacks
        this.callbacks.forEach(cb => cb(this.visemeWeights, volume));

        // Continue loop
        this.animationFrame = requestAnimationFrame(() => this.analyze());
    }

    /**
     * Stop audio analysis
     */
    stopAnalysis() {
        this.isAnalyzing = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Reset to closed mouth
        this.visemeWeights = {
            aa: 0, ee: 0, ih: 0, oh: 0, ou: 0, closed: 1
        };
        this.callbacks.forEach(cb => cb(this.visemeWeights, 0));
    }

    /**
     * Register callback for viseme updates
     * @param {Function} callback - Called with (visemeWeights, volume)
     */
    onVisemeUpdate(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Get current viseme weights
     * @returns {Object} Current viseme weights
     */
    getVisemes() {
        return { ...this.visemeWeights };
    }

    /**
     * Simulate lip sync for text (when actual audio isn't available)
     * @param {string} text - Text being spoken
     * @param {number} duration - Total speech duration in ms
     */
    simulateLipSync(text, duration) {
        const words = text.split(' ');
        const syllablesPerWord = 2; // Rough estimate
        const totalSyllables = words.length * syllablesPerWord;
        const syllableDuration = duration / totalSyllables;

        let elapsed = 0;
        this.isAnalyzing = true;

        const animate = () => {
            if (!this.isAnalyzing || elapsed >= duration) {
                this.stopAnalysis();
                return;
            }

            // Calculate current syllable position
            const syllablePhase = (elapsed % syllableDuration) / syllableDuration;
            const mouthOpenness = Math.sin(syllablePhase * Math.PI);

            // Random variation for natural feel
            const rand = Math.random() * 0.3;

            this.visemeWeights = {
                aa: mouthOpenness * (0.7 + rand),
                ee: mouthOpenness * rand,
                ih: mouthOpenness * rand * 0.5,
                oh: mouthOpenness * (0.3 + rand),
                ou: mouthOpenness * rand * 0.5,
                closed: 1 - mouthOpenness
            };

            this.callbacks.forEach(cb => cb(this.visemeWeights, mouthOpenness));

            elapsed += 16; // ~60fps
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.stopAnalysis();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.callbacks.clear();
    }
}

export default LipSyncService;
