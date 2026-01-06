/**
 * MusicDanceService - Detects music playing on system and triggers dance animations
 * Uses Web Audio API to analyze system audio or microphone input
 */
export class MusicDanceService {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isListening = false;
        this.isDancing = false;
        this.callbacks = new Set();

        // Beat detection
        this.lastBeatTime = 0;
        this.beatThreshold = 0.6;
        this.beatCooldown = 200; // ms between beats
        this.energyHistory = [];
        this.historyLength = 43; // ~1 second at 60fps

        // Dance state
        this.currentDanceMove = 0;
        this.danceIntensity = 0;
        this.bpm = 0;
    }

    /**
     * Initialize audio analysis
     */
    async initialize() {
        if (this.audioContext) return true;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.8;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            return true;
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            return false;
        }
    }

    /**
     * Start listening to microphone for music
     */
    async startMicrophoneListening() {
        if (!await this.initialize()) return false;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            this.isListening = true;
            this.analyze();
            return true;
        } catch (error) {
            console.error('Microphone access denied:', error);
            return false;
        }
    }

    /**
     * Start analyzing system audio (if available via electron)
     */
    async startSystemAudioListening() {
        if (!await this.initialize()) return false;

        try {
            // Try to get system audio via Electron desktopCapturer
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop'
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop'
                    }
                }
            });

            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            this.isListening = true;
            this.analyze();
            return true;
        } catch (error) {
            console.log('System audio not available, falling back to microphone');
            return this.startMicrophoneListening();
        }
    }

    /**
     * Main analysis loop - detects beats and rhythm
     */
    analyze() {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate bass energy (low frequencies)
        let bassEnergy = 0;
        const bassRange = Math.floor(this.dataArray.length * 0.15);
        for (let i = 0; i < bassRange; i++) {
            bassEnergy += this.dataArray[i];
        }
        bassEnergy = bassEnergy / (bassRange * 255);

        // Calculate overall energy
        let totalEnergy = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            totalEnergy += this.dataArray[i];
        }
        totalEnergy = totalEnergy / (this.dataArray.length * 255);

        // Track energy history for beat detection
        this.energyHistory.push(bassEnergy);
        if (this.energyHistory.length > this.historyLength) {
            this.energyHistory.shift();
        }

        // Detect beats
        const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
        const now = Date.now();
        const isBeat = bassEnergy > avgEnergy * 1.4 &&
            bassEnergy > this.beatThreshold &&
            now - this.lastBeatTime > this.beatCooldown;

        if (isBeat) {
            this.lastBeatTime = now;
            this.currentDanceMove = (this.currentDanceMove + 1) % 8;

            // Estimate BPM
            if (this.energyHistory.length > 0) {
                this.estimateBPM();
            }
        }

        // Update dance intensity smoothly
        const targetIntensity = totalEnergy > 0.1 ? Math.min(1, totalEnergy * 3) : 0;
        this.danceIntensity = this.danceIntensity * 0.9 + targetIntensity * 0.1;

        // Determine if we should be dancing
        this.isDancing = this.danceIntensity > 0.15;

        // Notify callbacks
        const danceData = {
            isDancing: this.isDancing,
            intensity: this.danceIntensity,
            move: this.currentDanceMove,
            beat: isBeat,
            bpm: this.bpm,
            bassEnergy,
            totalEnergy
        };

        this.callbacks.forEach(cb => cb(danceData));

        requestAnimationFrame(() => this.analyze());
    }

    /**
     * Estimate BPM from beat history
     */
    estimateBPM() {
        // Simple BPM estimation based on beat frequency
        const beatInterval = Date.now() - this.lastBeatTime;
        if (beatInterval > 0 && beatInterval < 2000) {
            const instantBPM = 60000 / beatInterval;
            // Smooth BPM estimation
            if (this.bpm === 0) {
                this.bpm = instantBPM;
            } else {
                this.bpm = this.bpm * 0.8 + instantBPM * 0.2;
            }
            this.bpm = Math.max(60, Math.min(180, this.bpm));
        }
    }

    /**
     * Get dance animation parameters
     */
    getDanceParams() {
        const moves = [
            { name: 'sway', armAngle: 0, bodyTilt: 0.1 },
            { name: 'bounce', armAngle: 30, bodyTilt: 0 },
            { name: 'leftWave', armAngle: -45, bodyTilt: -0.1 },
            { name: 'rightWave', armAngle: 45, bodyTilt: 0.1 },
            { name: 'nod', armAngle: 0, bodyTilt: 0 },
            { name: 'spin', armAngle: 0, bodyTilt: 0 },
            { name: 'jump', armAngle: 60, bodyTilt: 0 },
            { name: 'groove', armAngle: 20, bodyTilt: 0.05 }
        ];

        return {
            ...moves[this.currentDanceMove],
            intensity: this.danceIntensity,
            bpm: this.bpm
        };
    }

    /**
     * Subscribe to dance updates
     */
    onDanceUpdate(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Stop listening
     */
    stop() {
        this.isListening = false;
        this.isDancing = false;
        this.danceIntensity = 0;
    }

    /**
     * Cleanup
     */
    dispose() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.callbacks.clear();
    }
}

export default MusicDanceService;
