import Store from 'electron-store';

/**
 * RelationshipMemory - Manages deep user relationship data
 * 
 * Persists:
 * - User Profile (Name, Birthday, Job)
 * - Shared Facts (Likes, Dislikes, Inside Jokes)
 * - Milestones (Interaction counts, Time together)
 */
export class RelationshipMemory {
    constructor() {
        this.store = new Store({ name: 'nizhal-memory' });
        this.initialize();
    }

    initialize() {
        // Ensure default structure
        if (!this.store.has('profile')) {
            this.store.set('profile', {
                name: 'User',
                nickname: null,
                birthday: null,
                occupation: null
            });
        }

        if (!this.store.has('facts')) {
            this.store.set('facts', []);
        }

        if (!this.store.has('milestones')) {
            this.store.set('milestones', {
                firstMeeting: new Date().toISOString(),
                totalMessages: 0,
                daysActive: 0,
                lastInteraction: new Date().toISOString()
            });
        }
    }

    // --- Profile Management ---

    getProfile() {
        return this.store.get('profile');
    }

    updateProfile(key, value) {
        this.store.set(`profile.${key}`, value);
        return this.getProfile();
    }

    // --- Fact Management ---

    addFact(fact, category = 'general') {
        const facts = this.store.get('facts');
        // Simple duplicate check
        if (!facts.some(f => f.content === fact)) {
            facts.push({
                content: fact,
                category,
                timestamp: new Date().toISOString()
            });
            this.store.set('facts', facts);
            return true;
        }
        return false;
    }

    getFacts(limit = 5) {
        const facts = this.store.get('facts');
        // Return most recent facts
        return facts.slice(-limit);
    }

    // --- Milestone Management ---

    incrementMessageCount() {
        const count = this.store.get('milestones.totalMessages') + 1;
        this.store.set('milestones.totalMessages', count);
        this.store.set('milestones.lastInteraction', new Date().toISOString());
        return count;
    }

    checkForMilestone() {
        const count = this.store.get('milestones.totalMessages');
        const milestones = [10, 50, 100, 500, 1000];
        if (milestones.includes(count)) {
            return `milestone_msgs_${count}`;
        }
        return null;
    }

    /**
     * Calculate days since first meeting
     */
    getDaysTogether() {
        const firstMeeting = new Date(this.store.get('milestones.firstMeeting'));
        const now = new Date();
        const diffMs = now - firstMeeting;
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    /**
     * Check for daily retention milestones
     * Returns milestone type if triggered, null otherwise
     */
    checkDailyMilestone() {
        const days = this.getDaysTogether();
        const acknowledged = this.store.get('milestones.acknowledgedDays') || [];

        const triggers = {
            1: { type: 'day_1', message: "Day 1 together! 💕 Here's a virtual hug for choosing me!" },
            3: { type: 'day_3', message: "3 days together! We're officially besties now! 🌟" },
            7: { type: 'day_7', message: "One week together! 🎉 You've unlocked a special theme!" },
            14: { type: 'day_14', message: "Two weeks! You're my favorite human. 💖" },
            30: { type: 'day_30', message: "30 days milestone! 🏆 Want to share our story?" }
        };

        if (triggers[days] && !acknowledged.includes(days)) {
            // Mark as acknowledged
            acknowledged.push(days);
            this.store.set('milestones.acknowledgedDays', acknowledged);
            return triggers[days];
        }

        return null;
    }

    // --- Context Generation for AI ---

    /**
     * Generates a context string to inject into the AI system prompt
     */
    getMemoryContext() {
        const profile = this.getProfile();
        const recentFacts = this.getFacts(3);
        const milestones = this.store.get('milestones');

        let context = `RELATIONSHIP CONTEXT:\n`;
        context += `- User: ${profile.nickname || profile.name}\n`;
        if (profile.occupation) context += `- Job: ${profile.occupation}\n`;

        if (recentFacts.length > 0) {
            context += `- Remember: ${recentFacts.map(f => f.content).join(', ')}\n`;
        }

        context += `- Msgs exchanged: ${milestones.totalMessages}\n`;

        return context;
    }
}

export const relationshipMemory = new RelationshipMemory();
