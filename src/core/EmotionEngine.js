/**
 * EmotionEngine.js
 * Advanced multi-modal emotion analysis system for Nizhal AI
 */

export const Emotion = {
    HAPPY: 'happy',
    SAD: 'sad',
    EXCITED: 'excited',
    CALM: 'calm',
    ANGRY: 'angry',
    THOUGHTFUL: 'thoughtful',
    NEUTRAL: 'neutral',
    CONCERNED: 'concerned',
    PLAYFUL: 'playful'
};

export class EmotionEngine {
    constructor() {
        this.emotions = {
            [Emotion.HAPPY]: { valence: 0.9, arousal: 0.7, intensity: 'high', triggers: ['smile', 'heart', 'love', 'great', 'good'] },
            [Emotion.SAD]: { valence: -0.8, arousal: 0.3, intensity: 'medium', triggers: ['sad', 'tears', 'cry', 'bad', 'hurt'] },
            [Emotion.EXCITED]: { valence: 0.85, arousal: 0.95, intensity: 'high', triggers: ['wow', 'amazing', 'omg', 'yes'] },
            [Emotion.CALM]: { valence: 0.6, arousal: 0.2, intensity: 'low', triggers: ['relax', 'peace', 'chill', 'quiet'] },
            [Emotion.ANGRY]: { valence: -0.9, arousal: 0.8, intensity: 'high', triggers: ['hate', 'angry', 'mad', 'furious'] },
            [Emotion.THOUGHTFUL]: { valence: 0.1, arousal: 0.4, intensity: 'medium', triggers: ['think', 'wonder', 'why', 'maybe'] },
            [Emotion.NEUTRAL]: { valence: 0.0, arousal: 0.0, intensity: 'low', triggers: [] },
            [Emotion.CONCERNED]: { valence: -0.3, arousal: 0.5, intensity: 'medium', triggers: ['worry', 'anxious', 'scared', 'help'] },
            [Emotion.PLAYFUL]: { valence: 0.7, arousal: 0.6, intensity: 'medium', triggers: ['haha', 'lol', 'joke', 'fun'] }
        };
    }

    /**
     * Analyze user input and context to determine emotion
     * @param {string} userInput - The text input from the user
     * @param {Object} context - Contextual data (history, time, settings)
     * @returns {Object} Detected emotion data
     */
    analyzeEmotion(userInput, context = {}) {
        if (!userInput) {
            return {
                primary: Emotion.NEUTRAL,
                intensity: 0.0,
                triggers: [],
                duration: 0
            };
        }

        const lowerInput = userInput.toLowerCase();
        let detectedEmotion = Emotion.NEUTRAL;
        let maxScore = 0;
        let foundTriggers = [];

        // 1. Text Keyword Analysis
        for (const [emotionKey, data] of Object.entries(this.emotions)) {
            let score = 0;
            const triggers = data.triggers || [];
            const matches = triggers.filter(trigger => lowerInput.includes(trigger));

            if (matches.length > 0) {
                score = matches.length * 1.0; // Base score

                // Boost for intensity words if present in same input
                if (lowerInput.includes('very') || lowerInput.includes('so') || lowerInput.includes('really')) {
                    score *= 1.5;
                }

                if (score > maxScore) {
                    maxScore = score;
                    detectedEmotion = emotionKey;
                    foundTriggers = matches;
                }
            }
        }

        // 2. Contextual Modifiers (Time of Day)
        // Late night might bias towards doubtful/calm/sad if ambiguous
        const hour = new Date().getHours();
        const isNight = hour >= 22 || hour <= 5;

        if (detectedEmotion === Emotion.NEUTRAL && isNight) {
            // Slight bias towards calm/thoughtful at night if no strong keywords
            // But we won't force it unless input feels quiet (short length?)
            if (userInput.length < 10) {
                // Maybe calm? Keeping neutral for safety unless explicit.
            }
        }

        // 3. User History (Mood Trends)
        // If user has been sad for last 3 messages, maybe bias detection?
        // (This logic can be expanded effectively with real ML, but heuristic for now)
        if (context.moodTrend === Emotion.SAD && detectedEmotion === Emotion.NEUTRAL) {
            // Lingering sadness?
            // detectedEmotion = Emotion.SAD; // Optional: don't override unless sure
        }

        // Get the full emotion object
        const emotionData = this.emotions[detectedEmotion] || this.emotions[Emotion.NEUTRAL];

        return {
            primary: detectedEmotion,
            intensity: Math.min(maxScore / 2, 1.0) || 0.5, // Normalize intensity roughly
            triggers: foundTriggers,
            duration: 5000, // ms duration for expression
            valence: emotionData.valence,
            arousal: emotionData.arousal
        };
    }
}

export default EmotionEngine;
