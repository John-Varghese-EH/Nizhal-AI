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
            'thinking': 'thinking',
            'excited': 'excited',
            'playful': 'playful',
            // MoodTracker emotions -> Standard
            'calm': 'calm',
            'anxious': 'anxious',
            // New expanded emotions
            'love': 'love',
            'angry': 'angry',
            'surprised': 'surprised',
            'confused': 'confused',
            'sleepy': 'sleepy',
            'focused': 'focused',
            // Standard emotions
            'neutral': 'neutral'
        };

        // Emoji for each emotion (expanded set)
        this.emotionEmojis = {
            happy: '😊',
            sad: '😢',
            neutral: '😐',
            excited: '🤩',
            thinking: '🤔',
            playful: '😜',
            calm: '😌',
            anxious: '😰',
            // New emotions
            love: '🥰',
            angry: '😠',
            surprised: '😲',
            confused: '😕',
            sleepy: '😴',
            focused: '🎯'
        };

        // Context keywords for auto-detection
        this.emotionKeywords = {
            happy: ['happy', 'great', 'awesome', 'wonderful', 'good', 'nice', 'yay', 'haha', 'lol', '😊', '😄'],
            sad: ['sad', 'sorry', 'miss', 'lonely', 'cry', 'tears', 'hurt', 'pain', '😢', '😭'],
            love: ['love', 'heart', 'adore', 'kiss', 'hug', 'darling', 'sweetheart', 'babe', '❤️', '💕', '🥰'],
            angry: ['angry', 'mad', 'hate', 'annoyed', 'frustrated', 'upset', '😠', '😡'],
            surprised: ['wow', 'omg', 'what', 'really', 'amazing', 'incredible', 'shocked', '😲', '😮'],
            confused: ['confused', 'what', 'huh', 'dont understand', "don't get", 'help', '😕', '🤷'],
            excited: ['excited', 'cant wait', "can't wait", 'awesome', 'amazing', 'woohoo', '🎉', '🤩'],
            sleepy: ['tired', 'sleepy', 'exhausted', 'yawn', 'bed', 'night', 'sleep', '😴', '💤'],
            focused: ['focus', 'concentrate', 'work', 'study', 'productive', 'busy', '🎯', '💪'],
            anxious: ['worried', 'anxious', 'nervous', 'stress', 'scared', 'afraid', '😰', '😟'],
            calm: ['calm', 'peaceful', 'relax', 'chill', 'zen', 'breathe', '😌', '🧘'],
            thinking: ['think', 'hmm', 'maybe', 'wonder', 'consider', '🤔']
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
     * Get all available emotions (expanded set)
     */
    getAvailableEmotions() {
        return [
            { id: 'happy', emoji: '😊', label: 'Happy', category: 'positive' },
            { id: 'love', emoji: '🥰', label: 'Love', category: 'positive' },
            { id: 'excited', emoji: '🤩', label: 'Excited', category: 'positive' },
            { id: 'playful', emoji: '😜', label: 'Playful', category: 'positive' },
            { id: 'calm', emoji: '😌', label: 'Calm', category: 'neutral' },
            { id: 'neutral', emoji: '😐', label: 'Neutral', category: 'neutral' },
            { id: 'thinking', emoji: '🤔', label: 'Thinking', category: 'neutral' },
            { id: 'focused', emoji: '🎯', label: 'Focused', category: 'neutral' },
            { id: 'confused', emoji: '😕', label: 'Confused', category: 'neutral' },
            { id: 'sleepy', emoji: '😴', label: 'Sleepy', category: 'neutral' },
            { id: 'sad', emoji: '😢', label: 'Sad', category: 'negative' },
            { id: 'anxious', emoji: '😰', label: 'Anxious', category: 'negative' },
            { id: 'angry', emoji: '😠', label: 'Angry', category: 'negative' },
            { id: 'surprised', emoji: '😲', label: 'Surprised', category: 'mixed' }
        ];
    }

    /**
     * Detect emotion from text content
     */
    detectFromText(text) {
        if (!text) return 'neutral';

        const lowerText = text.toLowerCase();
        const scores = {};

        for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
            scores[emotion] = 0;
            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    scores[emotion]++;
                }
            }
        }

        // Find highest scoring emotion
        let detected = 'neutral';
        let maxScore = 0;
        for (const [emotion, score] of Object.entries(scores)) {
            if (score > maxScore) {
                detected = emotion;
                maxScore = score;
            }
        }

        return maxScore > 0 ? detected : 'neutral';
    }

    /**
     * Auto-set emotion from text (for chat context)
     */
    async autoDetectAndSet(text, source = 'auto') {
        const detected = this.detectFromText(text);
        if (detected !== 'neutral' && detected !== this.currentEmotion) {
            await this.setEmotion(detected, source);
        }
        return detected;
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
