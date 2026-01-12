/**
 * ContextManager.js
 * Manages conversation memory, user state, and environmental context
 */

export class ContextManager {
    constructor(store) {
        // We inject the optional persistent store (electron-store wrapper)
        this.store = store;

        this.memory = {
            recentInteractions: [], // Last 10 interactions
            moodTrends: [],         // History of detected emotions
            milestones: {},         // 'first_love', '100th_chat'
            insideJokes: []         // Recurring phrases
        };

        // Load from store if available
        if (this.store) {
            this._load();
        }
    }

    /**
     * Update context with new interaction
     * @param {string} input - User message
     * @param {string} emotion - User emotion
     * @param {string} response - AI response
     */
    update(input, emotion, response) {
        const timestamp = Date.now();

        // 1. Update interactions
        this.memory.recentInteractions.push({ input, emotion, response, timestamp });
        if (this.memory.recentInteractions.length > 10) {
            this.memory.recentInteractions.shift();
        }

        // 2. Update mood trends
        this.memory.moodTrends.push({ emotion, timestamp });
        if (this.memory.moodTrends.length > 20) {
            this.memory.moodTrends.shift();
        }

        // 3. Check for milestones (Example)
        if (!this.memory.milestones.first_interaction) {
            this.memory.milestones.first_interaction = timestamp;
        }

        this._save();
    }

    /**
     * Get current context snapshot
     */
    getContext() {
        return {
            history: [...this.memory.recentInteractions],
            currentMood: this._calculateDominantMood(),
            timeOfDay: this._getTimeOfDay(),
            milestones: { ...this.memory.milestones }
        };
    }

    _calculateDominantMood() {
        if (this.memory.moodTrends.length === 0) return 'neutral';

        // Simple frequency analysis of last 5 moods
        const recent = this.memory.moodTrends.slice(-5);
        const counts = {};
        recent.forEach(m => {
            counts[m.emotion] = (counts[m.emotion] || 0) + 1;
        });

        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    _getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    }

    _load() {
        if (!this.store) return;
        const saved = this.store.get('ai.context');
        if (saved) {
            this.memory = { ...this.memory, ...saved };
        }
    }

    _save() {
        if (!this.store) return;
        this.store.set('ai.context', this.memory);
    }
}

export default ContextManager;
