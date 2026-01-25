/**
 * MoodTrackerService - Daily Emotion Logging
 * 
 * Tracks user mood over time for visualization and AI context
 */

class MoodTrackerService {
    constructor() {
        this.moods = [];
        this.initialized = false;
    }

    /**
     * Initialize and load saved moods
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.moods = stored;
            }
            this.initialized = true;
            console.log('[MoodTracker] Loaded', this.moods.length, 'mood entries');
        } catch (error) {
            console.error('[MoodTracker] Init error:', error);
        }
    }

    /**
     * Log a mood entry
     */
    async logMood(mood, note = '') {
        const entry = {
            id: Date.now(),
            mood,
            note,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };

        this.moods.unshift(entry);
        await this._saveToStorage();
        return entry;
    }

    /**
     * Get all moods
     */
    getMoods() {
        return [...this.moods];
    }

    /**
     * Get moods for a specific date range
     */
    getMoodsByRange(startDate, endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return this.moods.filter(m =>
            m.timestamp >= start && m.timestamp <= end
        );
    }

    /**
     * Get today's moods
     */
    getTodayMoods() {
        const today = new Date().toISOString().split('T')[0];
        return this.moods.filter(m => m.date === today);
    }

    /**
     * Get mood statistics for the last N days
     */
    getStats(days = 7) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentMoods = this.moods.filter(m => m.timestamp >= cutoff);

        const moodCounts = {
            happy: 0, sad: 0, neutral: 0,
            excited: 0, anxious: 0, calm: 0
        };

        recentMoods.forEach(m => {
            if (moodCounts.hasOwnProperty(m.mood)) {
                moodCounts[m.mood]++;
            }
        });

        // Find dominant mood
        let dominant = 'neutral';
        let maxCount = 0;
        for (const [mood, count] of Object.entries(moodCounts)) {
            if (count > maxCount) {
                dominant = mood;
                maxCount = count;
            }
        }

        return {
            total: recentMoods.length,
            dominant,
            distribution: moodCounts,
            days
        };
    }

    /**
     * Get mood data for chart visualization
     */
    getChartData(days = 7) {
        const data = [];
        const moodValues = {
            happy: 5, excited: 5,
            calm: 4,
            neutral: 3,
            anxious: 2,
            sad: 1
        };

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayMoods = this.moods.filter(m => m.date === dateStr);
            const avgValue = dayMoods.length > 0
                ? dayMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / dayMoods.length
                : null;

            data.push({
                date: dateStr,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                value: avgValue,
                count: dayMoods.length
            });
        }

        return data;
    }

    /**
     * Delete a mood entry
     */
    async deleteMood(id) {
        const index = this.moods.findIndex(m => m.id === id);
        if (index > -1) {
            this.moods.splice(index, 1);
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.moods || [];
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    async _saveToStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                await window.nizhal.memory.setUserPreferences({
                    ...prefs,
                    moods: this.moods.slice(0, 100) // Keep last 100 entries
                });
            }
        } catch (error) {
            console.error('[MoodTracker] Save error:', error);
        }
    }
}

export const moodTrackerService = new MoodTrackerService();
export default MoodTrackerService;
