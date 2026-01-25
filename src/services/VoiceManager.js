/**
 * VoiceManager.js
 * Unified voice management system - prioritizes LiveKit, falls back to VoiceService
 */

export class VoiceManager {
    constructor() {
        this.livekitAvailable = false;
        this.livekitConnected = false;
        this.fallbackVoiceService = null;
        this.currentMode = 'none'; // none, livekit, fallback

        console.log('[VoiceManager] Initialized');
    }

    /**
     * Initialize voice systems
     */
    async initialize(fallbackVoiceService) {
        this.fallbackVoiceService = fallbackVoiceService;

        // Check if LiveKit is configured
        if (window.nizhal?.livekit) {
            try {
                const status = await window.nizhal.livekit.getStatus();
                this.livekitAvailable = status.configured;
                console.log('[VoiceManager] LiveKit availability:', this.livekitAvailable);
            } catch (error) {
                console.warn('[VoiceManager] LiveKit status check failed:', error);
                this.livekitAvailable = false;
            }
        }

        console.log('[VoiceManager] Voice system initialized:', {
            livekitAvailable: this.livekitAvailable,
            hasFallback: !!this.fallbackVoiceService
        });
    }

    /**
     * Set LiveKit connection status
     */
    setLivekitStatus(connected) {
        this.livekitConnected = connected;
        this.currentMode = connected ? 'livekit' : (this.livekitAvailable ? 'none' : 'fallback');
        console.log('[VoiceManager] Voice mode changed to:', this.currentMode);
    }

    /**
     * Speak using available voice system
     * Priority: LiveKit (if connected) > Fallback VoiceService
     */
    async speak(text, options = {}) {
        // If LiveKit is active, voice goes through the agent automatically
        if (this.currentMode === 'livekit') {
            console.log('[VoiceManager] Using LiveKit voice (via agent)');
            // LiveKit agent handles TTS, we just log
            return { success: true, mode: 'livekit' };
        }

        // Fallback to VoiceService
        if (this.fallbackVoiceService) {
            console.log('[VoiceManager] Using fallback VoiceService');
            try {
                await this.fallbackVoiceService.speak(text, options.profile, options.emotionData);
                return { success: true, mode: 'fallback' };
            } catch (error) {
                console.error('[VoiceManager] Fallback voice failed:', error);
                return { success: false, error: error.message };
            }
        }

        console.warn('[VoiceManager] No voice system available');
        return { success: false, error: 'No voice system available' };
    }

    /**
     * Stop speaking
     */
    async stop() {
        if (this.currentMode === 'fallback' && this.fallbackVoiceService) {
            // Stop fallback voice
            // Note: VoiceService might not have a stop method, add if needed
            return { success: true };
        }
        return { success: true };
    }

    /**
     * Get current voice system status
     */
    getStatus() {
        return {
            mode: this.currentMode,
            livekitAvailable: this.livekitAvailable,
            livekitConnected: this.livekitConnected,
            hasFallback: !!this.fallbackVoiceService
        };
    }

    /**
     * Check if voice is available
     */
    isAvailable() {
        return this.livekitConnected || !!this.fallbackVoiceService;
    }
}

export default VoiceManager;
