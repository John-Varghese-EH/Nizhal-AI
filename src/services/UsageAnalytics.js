import Store from 'electron-store';

/**
 * UsageAnalytics - Privacy-first local engagement tracking
 * 
 * Tracks:
 * - Session duration
 * - Feature usage counts (Zen Mode, Sharing)
 * - Engagement Level (calculated score)
 */
export class UsageAnalytics {
    constructor() {
        this.store = new Store({ name: 'nizhal-analytics' });
        this.sessionStart = Date.now();
        this.initialize();
    }

    initialize() {
        if (!this.store.has('stats')) {
            this.store.set('stats', {
                sessions: 0,
                totalTimeMs: 0,
                messagesSent: 0,
                features: {
                    zenMode: 0,
                    sharing: 0,
                    voice: 0
                },
                level: 1
            });
        }

        // Increment session count
        const stats = this.store.get('stats');
        stats.sessions += 1;
        this.store.set('stats', stats);
    }

    trackEvent(category, action) {
        const stats = this.store.get('stats');

        if (category === 'feature') {
            if (!stats.features[action]) stats.features[action] = 0;
            stats.features[action] += 1;
        } else if (category === 'message') {
            stats.messagesSent += 1;
        }

        this._calculateLevel(stats);
        this.store.set('stats', stats);
    }

    endSession() {
        const duration = Date.now() - this.sessionStart;
        const stats = this.store.get('stats');
        stats.totalTimeMs += duration;
        this.store.set('stats', stats);
    }

    getStats() {
        return this.store.get('stats');
    }

    _calculateLevel(stats) {
        // Simple RPG-style leveling based on interaction
        const score = (stats.messagesSent * 10) + (stats.sessions * 50) + (stats.totalTimeMs / 60000);
        const level = Math.floor(1 + Math.sqrt(score / 100));
        stats.level = level;
    }
}

export const usageAnalytics = new UsageAnalytics();
