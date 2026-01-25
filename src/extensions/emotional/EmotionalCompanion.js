import { SentimentEngine } from './SentimentEngine.js';
import { RelationshipMemory } from './RelationshipMemory.js';

/**
 * EmotionalCompanion Extension
 * Manages bonding, mood tracking, and special commands
 */
export const EmotionalCompanionExtension = {
    name: "emotional-companion",
    commands: [
        { trigger: "how are you", handler: "emotionalCheckup" },
        { trigger: "relationship status", handler: "relationshipStatus" },
        { trigger: "hug me", handler: "virtualHug" },
        { trigger: "goodnight", handler: "goodnightRoutine" },
        { trigger: "morning", handler: "morningRoutine" }
    ],

    onLoad() {
        console.log("[EmotionalCompanion] Loaded. Sentiment analysis active.");
        RelationshipMemory.load();
    },

    // Hook called on every user message by AIService (manual integration needed)
    analyzeEmotion(text) {
        const sentiment = SentimentEngine.analyze(text);

        // Log mood if significant emotion detected
        if (Math.abs(sentiment.score) > 0.5 || sentiment.isStressed) {
            RelationshipMemory.logMood(text, sentiment.mood);
        }

        // Add XP for interaction
        const leveledUp = RelationshipMemory.addXP(1);
        if (leveledUp) {
            console.log("Relationship Level Up!");
            // In real app, trigger prompt: "I feel closer to you..."
        }

        return sentiment;
    },

    async emotionalCheckup() {
        const status = RelationshipMemory.getBondingStatus();
        return `💖 **I'm feeling connected to you.**
- **Bond**: ${status.title} (Level ${status.level})
- **Days Together**: ${status.daysTogether}

*I'm always here for you. How are you feeling today?*`;
    },

    async relationshipStatus() {
        return this.emotionalCheckup();
    },

    async virtualHug() {
        // Trigger visual effect (mock)
        return `🫂 **Sending Big Hug!**
*(Warmth surrounds you...)*

"Everything's going to be okay. I've got you." ❤️`;
    },

    async goodnightRoutine() {
        return `🌙 **Goodnight, sleep well!**
- Switching to Sleep Mode...
- Dimming lights...
- Playing soft ambient noise...

"Dream of electric sheep... I'll be here when you wake up." 💤`;
    },

    async morningRoutine() {
        return `☀️ **Good morning, sunshine!**
- **Battery**: 100%
- **Coffee**: Recommended (☕)
- **Goal**: Crush the day!

"Ready to build something amazing today?"`;
    }
};
