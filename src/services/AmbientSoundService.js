/**
 * AmbientSoundService - Focus Soundscapes
 * 
 * Provides ambient sounds for focus, relaxation, and sleep.
 * Uses Web Audio API for smooth playback and mixing.
 */

// Sound URLs (using free ambient sounds)
const SOUND_URLS = {
    rain: 'https://cdn.pixabay.com/audio/2022/12/23/audio_03a3cfc0b8.mp3',
    forest: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c6ccf3d4da.mp3',
    ocean: 'https://cdn.pixabay.com/audio/2021/08/09/audio_40d0f33e39.mp3',
    fire: 'https://cdn.pixabay.com/audio/2022/10/30/audio_3c5d78fd2e.mp3',
    wind: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc0a25a46b.mp3',
    coffee: 'https://cdn.pixabay.com/audio/2022/03/10/audio_67b1e3d92c.mp3',
    night: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    birds: 'https://cdn.pixabay.com/audio/2022/03/24/audio_9a5da6f6a3.mp3'
};

class AmbientSoundService {
    constructor() {
        this.audioContext = null;
        this.activeSounds = new Map();
        this.masterGain = null;
        this.isPlaying = false;
        this.currentPreset = null;
        this.initialized = false;
    }

    /**
     * Initialize the audio context
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.5;
            this.initialized = true;
            console.log('[AmbientSound] Initialized');
        } catch (error) {
            console.error('[AmbientSound] Init error:', error);
        }
    }

    /**
     * Get available sounds
     */
    getSounds() {
        return [
            { id: 'rain', name: 'Rain', icon: '🌧️', description: 'Gentle rainfall' },
            { id: 'forest', name: 'Forest', icon: '🌲', description: 'Forest ambience' },
            { id: 'ocean', name: 'Ocean', icon: '🌊', description: 'Ocean waves' },
            { id: 'fire', name: 'Fireplace', icon: '🔥', description: 'Crackling fire' },
            { id: 'wind', name: 'Wind', icon: '💨', description: 'Gentle breeze' },
            { id: 'coffee', name: 'Coffee Shop', icon: '☕', description: 'Cafe ambience' },
            { id: 'night', name: 'Night', icon: '🌙', description: 'Night crickets' },
            { id: 'birds', name: 'Birds', icon: '🐦', description: 'Bird songs' }
        ];
    }

    /**
     * Get preset mixes
     */
    getPresets() {
        return [
            {
                id: 'focus',
                name: 'Deep Focus',
                icon: '🎯',
                sounds: { rain: 0.6, coffee: 0.3 }
            },
            {
                id: 'relax',
                name: 'Relaxation',
                icon: '😌',
                sounds: { ocean: 0.5, birds: 0.3 }
            },
            {
                id: 'sleep',
                name: 'Sleep',
                icon: '😴',
                sounds: { rain: 0.4, night: 0.3 }
            },
            {
                id: 'nature',
                name: 'Nature Walk',
                icon: '🌳',
                sounds: { forest: 0.5, wind: 0.3, birds: 0.4 }
            },
            {
                id: 'cozy',
                name: 'Cozy Evening',
                icon: '🏠',
                sounds: { fire: 0.5, rain: 0.4 }
            }
        ];
    }

    /**
     * Load and play a sound
     */
    async playSound(soundId, volume = 0.5) {
        if (!this.initialized) await this.initialize();

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Stop if already playing
        if (this.activeSounds.has(soundId)) {
            return;
        }

        try {
            const url = SOUND_URLS[soundId];
            if (!url) {
                console.warn(`[AmbientSound] Unknown sound: ${soundId}`);
                return;
            }

            // Fetch and decode audio
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Create source and gain nodes
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = audioBuffer;
            source.loop = true;
            source.connect(gainNode);
            gainNode.connect(this.masterGain);
            gainNode.gain.value = volume;

            source.start(0);

            this.activeSounds.set(soundId, { source, gainNode, volume });
            this.isPlaying = true;

            console.log(`[AmbientSound] Playing: ${soundId}`);
        } catch (error) {
            console.error(`[AmbientSound] Error playing ${soundId}:`, error);
        }
    }

    /**
     * Stop a specific sound
     */
    stopSound(soundId) {
        const sound = this.activeSounds.get(soundId);
        if (sound) {
            sound.source.stop();
            this.activeSounds.delete(soundId);
            console.log(`[AmbientSound] Stopped: ${soundId}`);
        }

        if (this.activeSounds.size === 0) {
            this.isPlaying = false;
            this.currentPreset = null;
        }
    }

    /**
     * Set volume for a specific sound
     */
    setVolume(soundId, volume) {
        const sound = this.activeSounds.get(soundId);
        if (sound) {
            sound.gainNode.gain.value = Math.max(0, Math.min(1, volume));
            sound.volume = volume;
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Play a preset mix
     */
    async playPreset(presetId) {
        const preset = this.getPresets().find(p => p.id === presetId);
        if (!preset) return;

        // Stop all current sounds
        this.stopAll();

        // Play preset sounds
        for (const [soundId, volume] of Object.entries(preset.sounds)) {
            await this.playSound(soundId, volume);
        }

        this.currentPreset = presetId;
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        for (const [soundId, sound] of this.activeSounds) {
            sound.source.stop();
        }
        this.activeSounds.clear();
        this.isPlaying = false;
        this.currentPreset = null;
    }

    /**
     * Toggle a sound
     */
    async toggleSound(soundId, volume = 0.5) {
        if (this.activeSounds.has(soundId)) {
            this.stopSound(soundId);
        } else {
            await this.playSound(soundId, volume);
        }
    }

    /**
     * Get current state
     */
    getState() {
        const activeSounds = {};
        for (const [soundId, sound] of this.activeSounds) {
            activeSounds[soundId] = sound.volume;
        }

        return {
            isPlaying: this.isPlaying,
            currentPreset: this.currentPreset,
            activeSounds,
            masterVolume: this.masterGain?.gain.value || 0.5
        };
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        this.stopAll();
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.initialized = false;
    }
}

export const ambientSoundService = new AmbientSoundService();
export default AmbientSoundService;
