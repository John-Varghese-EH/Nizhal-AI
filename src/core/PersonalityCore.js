export const Mood = {
    HAPPY: 'happy',
    NEUTRAL: 'neutral',
    CONCERNED: 'concerned',
    PROTECTIVE: 'protective',
    PLAYFUL: 'playful',
    THOUGHTFUL: 'thoughtful'
};

export class PersonalityCore {
    constructor(initialState = {}) {
        this.state = {
            affection: initialState.affection ?? 50,
            professionalism: initialState.professionalism ?? 70,
            trust: initialState.trust ?? 30,
            mood: initialState.mood ?? Mood.NEUTRAL,
            lastInteraction: Date.now(),
            interactionCount: 0,
            positiveInteractions: 0,
            conversationDepth: 0,
            energy: initialState.energy ?? 100 // New Energy State
        };

        this.moodTransitions = {
            [Mood.NEUTRAL]: [Mood.HAPPY, Mood.THOUGHTFUL, Mood.CONCERNED],
            // ... (rest of mood transitions)
        };

        this.decayInterval = setInterval(() => this.applyDecay(), 60000);
    }

    getState() {
        return { ...this.state };
    }

    setMood(mood) {
        if (Object.values(Mood).includes(mood)) {
            this.updateAttribute('mood', mood);
            return true;
        }
        return false;
    }

    processInteraction(message, response) {
        this.state.lastInteraction = Date.now();
        this.state.interactionCount++;

        // Simple sentiment analysis simulation
        const isPositive = /thank|good|great|love|awesome|help/i.test(message);
        if (isPositive) {
            this.state.positiveInteractions++;
            this.updateAttribute('affection', 1);
            this.updateAttribute('trust', 0.5);

            if (this.state.mood !== Mood.HAPPY && Math.random() > 0.6) {
                this.transitionMood(Mood.HAPPY);
            }
        }

        // Conversation depth tracking
        if (message.length > 50) {
            this.state.conversationDepth++;
            if (this.state.conversationDepth % 10 === 0) {
                this.updateAttribute('professionalism', -1); // Become more casual over time
            }
        }
    }

    updateAttribute(attr, value) {
        if (this.state[attr] !== undefined) {
            this.state[attr] = Math.max(0, Math.min(100, this.state[attr] + value));
        }
    }

    transitionMood(targetMood) {
        const canTransition = this.moodTransitions[this.state.mood]?.includes(targetMood);
        if (canTransition) {
            this.state.mood = targetMood;
            return true;
        }
        return false;
    }

    applyDecay() {
        const timeSinceLastInteraction = Date.now() - this.state.lastInteraction;
        const hoursInactive = timeSinceLastInteraction / (1000 * 60 * 60);

        // Energy Decay: Lowers by 5 every hour active, recovers when inactive > 1 hour
        if (hoursInactive < 1) {
            this.updateAttribute('energy', -1); // Slowly drain energy while active
        } else {
            this.updateAttribute('energy', 5); // Recharge when inactive
        }

        if (this.state.energy < 20) {
            // Low energy affects mood
            this.transitionMood(Mood.THOUGHTFUL);
        }

        if (hoursInactive > 24) {
            this.updateAttribute('affection', -1);
            if (this.state.affection < 30) {
                this.transitionMood(Mood.CONCERNED);
            }
        }

        // ... (rest of decay logic)
    }

    getRelationshipLevel() {
        const score = (this.state.affection * 0.4) + (this.state.trust * 0.4) + (this.state.professionalism * 0.2);

        if (score >= 80) return 'deep_bond';
        if (score >= 60) return 'trusted_friend';
        if (score >= 40) return 'friendly';
        if (score >= 20) return 'acquaintance';
        return 'stranger';
    }

    getMoodColor() {
        const moodColors = {
            [Mood.HAPPY]: '#10b981',
            [Mood.NEUTRAL]: '#6366f1',
            [Mood.CONCERNED]: '#f59e0b',
            [Mood.PROTECTIVE]: '#ef4444',
            [Mood.PLAYFUL]: '#ec4899',
            [Mood.THOUGHTFUL]: '#8b5cf6'
        };
        return moodColors[this.state.mood] || moodColors[Mood.NEUTRAL];
    }

    getMoodDescription() {
        const descriptions = {
            [Mood.HAPPY]: 'I\'m feeling great! Let\'s have fun.',
            [Mood.NEUTRAL]: 'I\'m here and ready to help.',
            [Mood.CONCERNED]: 'I sense something\'s on your mind.',
            [Mood.PROTECTIVE]: 'I\'m here for you, always.',
            [Mood.PLAYFUL]: 'Let\'s do something exciting!',
            [Mood.THOUGHTFUL]: 'I\'m reflecting on our conversation.'
        };
        return descriptions[this.state.mood] || descriptions[Mood.NEUTRAL];
    }

    serialize() {
        return JSON.stringify(this.state);
    }

    static deserialize(data) {
        try {
            const state = JSON.parse(data);
            return new PersonalityCore(state);
        } catch {
            return new PersonalityCore();
        }
    }

    destroy() {
        if (this.decayInterval) {
            clearInterval(this.decayInterval);
        }
    }
}
