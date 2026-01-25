/**
 * UnifiedEmotionService - Central emotion management
 * 
 * Connects:
 * - QuickMenu emotion triggers
 * - MoodTracker logging
 * - VRM avatar state
 * - AppStateService persistence
 * 
 * Provides a single source of truth for emotions across the app.
 */

import { moodTrackerService } from './MoodTrackerService';

class UnifiedEmotionService {
    constructor() {
        this.currentEmotion = 'neutral';
        this.callbacks = new Set();
        this.emotionHistory = [];

        // Map between different emotion naming conventions
        this.emotionMap = {
            // QuickMenu emotions -> Standard
            'happy': 'happy',
            'sad': 'sad',
            'thinking': 'neutral',
            'excited': 'excited',
            'playful': 'happy',
            // MoodTracker emotions -> Standard
            'calm': 'neutral',
            'anxious': 'sad',
            // Standard emotions
            'neutral': 'neutral'
        };

        // Emoji for each emotion
        this.emotionEmojis = {
            happy: '😊',
            sad: '😢',
            neutral: '😐',
            excited: '🤩',
            thinking: '🤔',
            playful: '😜',
            calm: '😌',
            anxious: '😰'
        };
    }

    /**
     * Set current emotion - unified entry point
     * @param {string} emotion - Emotion to set
     * @param {string} source - Source of the change ('quickmenu'|'moodtracker'|'camera'|'api')
     */
    async setEmotion(emotion, source = 'unknown') {
        const normalizedEmotion = this.emotionMap[emotion] || emotion;
        this.currentEmotion = normalizedEmotion;

        // Track the change
        this.emotionHistory.push({
            emotion: normalizedEmotion,
            source,
            timestamp: Date.now()
        });

        // Keep history manageable
        if (this.emotionHistory.length > 100) {
            this.emotionHistory = this.emotionHistory.slice(-50);
        }

        // Sync to AppStateService (VRM avatar)
        await this._syncToVRM(normalizedEmotion);

        // Log to MoodTracker (if from QuickMenu or user action)
        if (source === 'quickmenu' || source === 'user') {
            await this._logToMoodTracker(emotion);
        }

        // Notify all subscribers
        this._notifyCallbacks(normalizedEmotion, source);

        console.log(`[UnifiedEmotion] ${source} -> ${emotion} (normalized: ${normalizedEmotion})`);
        return normalizedEmotion;
    }

    /**
     * Get current emotion
     */
    getEmotion() {
        return this.currentEmotion;
    }

    /**
     * Get emotion emoji
     */
    getEmoji(emotion = this.currentEmotion) {
        return this.emotionEmojis[emotion] || '😐';
    }

    /**
     * Subscribe to emotion changes
     */
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Notify all callbacks
     */
    _notifyCallbacks(emotion, source) {
        for (const callback of this.callbacks) {
            try {
                callback(emotion, source);
            } catch (error) {
                console.error('[UnifiedEmotion] Callback error:', error);
            }
        }
    }

    /**
     * Sync emotion to VRM avatar via AppStateService
     */
    async _syncToVRM(emotion) {
        try {
            if (window.nizhal?.state?.set) {
                await window.nizhal.state.set('ai.emotion', emotion);
                await window.nizhal.state.set('vrm.currentEmotion', emotion);
            }
        } catch (error) {
            console.error('[UnifiedEmotion] VRM sync failed:', error);
        }
    }

    /**
     * Log emotion to MoodTracker for history
     */
    async _logToMoodTracker(emotion) {
        try {
            await moodTrackerService.initialize();
            await moodTrackerService.logMood(emotion, 'Quick action');
        } catch (error) {
            console.error('[UnifiedEmotion] MoodTracker log failed:', error);
        }
    }

    /**
     * Get emotion history
     */
    getHistory(count = 10) {
        return this.emotionHistory.slice(-count);
    }

    /**
     * Get emotion statistics
     */
    getStats() {
        const counts = {};
        for (const entry of this.emotionHistory) {
            counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
        }

        let dominant = 'neutral';
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(counts)) {
            if (count > maxCount) {
                dominant = emotion;
                maxCount = count;
            }
        }

        return {
            current: this.currentEmotion,
            dominant,
            counts,
            total: this.emotionHistory.length
        };
    }

    /**
     * Get all available emotions
     */
    getAvailableEmotions() {
        return [
            { id: 'happy', emoji: '😊', label: 'Happy' },
            { id: 'sad', emoji: '😢', label: 'Sad' },
            { id: 'neutral', emoji: '😐', label: 'Neutral' },
            { id: 'excited', emoji: '🤩', label: 'Excited' },
            { id: 'calm', emoji: '😌', label: 'Calm' },
            { id: 'anxious', emoji: '😰', label: 'Anxious' },
            { id: 'thinking', emoji: '🤔', label: 'Thinking' },
            { id: 'playful', emoji: '😜', label: 'Playful' }
        ];
    }

    /**
     * Reset to neutral
     */
    async reset() {
        await this.setEmotion('neutral', 'reset');
    }
}

export const unifiedEmotionService = new UnifiedEmotionService();
export default UnifiedEmotionService;
