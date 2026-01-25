/**
 * EmotionDetectionService - FREE Local Emotion Detection
 * 
 * Detects emotions from text using:
 * - Keyword/pattern matching (baseline, always works)
 * - Intensity analysis (mild/medium/high)
 * - Context awareness (negations, intensifiers)
 * 
 * NO API keys required, 100% local processing!
 */

class EmotionDetectionService {
    constructor() {
        // Emotion keyword dictionaries
        this.emotionKeywords = {
            happy: {
                keywords: ['happy', 'joy', 'glad', 'excited', 'great', 'awesome', 'wonderful', 'fantastic',
                    'love', 'perfect', 'amazing', 'excellent', 'yay', 'woohoo', 'celebrating',
                    'blessed', 'grateful', 'thankful', 'delighted', '😊', '😄', '🎉', '💕', '❤️'],
                intensifiers: ['very', 'so', 'really', 'extremely', 'super', 'absolutely']
            },
            sad: {
                keywords: ['sad', 'unhappy', 'depressed', 'down', 'miserable', 'terrible', 'awful',
                    'disappointed', 'hurt', 'crying', 'heartbroken', 'lonely', 'empty',
                    'devastated', 'hopeless', '😢', '😞', '💔', '😭'],
                intensifiers: ['very', 'so', 'really', 'extremely', 'deeply']
            },
            angry: {
                keywords: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'pissed', 'irritated',
                    'rage', 'hate', 'stupid', 'ridiculous', 'unfair', 'wtf', 'damn',
                    '😡', '😠', '🤬'],
                intensifiers: ['very', 'so', 'really', 'extremely', 'fucking']
            },
            stressed: {
                keywords: ['stressed', 'anxious', 'worried', 'nervous', 'overwhelmed', 'panic',
                    'pressure', 'tense', 'exam', 'deadline', 'difficult', 'struggling',
                    'can\'t handle', 'too much', '😰', '😨'],
                intensifiers: ['very', 'so', 'really', 'extremely', 'super']
            },
            excited: {
                keywords: ['excited', 'pumped', 'hyped', 'can\'t wait', 'omg', 'wow', 'insane',
                    'incredible', 'mind-blowing', 'epic', 'let\'s go', 'yesss', '🔥', '⚡', '🎊'],
                intensifiers: ['very', 'so', 'really', 'extremely', 'super']
            },
            calm: {
                keywords: ['calm', 'peaceful', 'relaxed', 'chill', 'fine', 'okay', 'alright',
                    'content', 'serene', 'tranquil', '😌', '🧘'],
                intensifiers: ['very', 'fairly', 'pretty', 'quite']
            },
            love: {
                keywords: ['love', 'adore', 'cherish', 'treasure', 'soulmate', 'romantic',
                    'beautiful', 'gorgeous', 'precious', 'babe', 'honey', 'sweetheart',
                    '❤️', '💕', '💖', '😍', '🥰'],
                intensifiers: ['so much', 'deeply', 'truly', 'really']
            },
            neutral: {
                keywords: ['okay', 'fine', 'alright', 'meh', 'whatever', 'sure', 'maybe'],
                intensifiers: []
            }
        };

        // Negation words (flip emotion)
        this.negations = ['not', 'no', 'never', 'don\'t', 'didn\'t', 'won\'t', 'can\'t', 'isn\'t',
            'aren\'t', 'wasn\'t', 'weren\'t', 'without'];

        // Emotion opposites (for negation handling)
        this.opposites = {
            happy: 'sad',
            sad: 'happy',
            angry: 'calm',
            calm: 'angry',
            excited: 'calm',
            stressed: 'calm',
            love: 'neutral',
            neutral: 'neutral'
        };
    }

    /**
     * Detect emotion from text
     * @param {string} text - User's message
     * @returns {Object} - { emotion, confidence, intensity, details }
     */
    detectEmotion(text) {
        if (!text || text.trim().length === 0) {
            return {
                emotion: 'neutral',
                confidence: 1.0,
                intensity: 'low',
                details: { scores: {}, matches: [] }
            };
        }

        const lowerText = text.toLowerCase();
        const words = lowerText.split(/\s+/);

        // Score each emotion
        const scores = {};
        const matches = {};

        for (const [emotion, data] of Object.entries(this.emotionKeywords)) {
            let score = 0;
            const emotionMatches = [];

            for (const keyword of data.keywords) {
                if (lowerText.includes(keyword)) {
                    let weight = 1.0;

                    // Check for intensifiers before the keyword
                    const keywordIndex = words.findIndex(w => w.includes(keyword));
                    if (keywordIndex > 0) {
                        const prevWord = words[keywordIndex - 1];
                        if (data.intensifiers.includes(prevWord)) {
                            weight = 1.5; // Boost score for intensifiers
                        }
                    }

                    // Check for negations nearby
                    let isNegated = false;
                    for (let i = Math.max(0, keywordIndex - 3); i < keywordIndex; i++) {
                        if (this.negations.includes(words[i])) {
                            isNegated = true;
                            break;
                        }
                    }

                    if (isNegated) {
                        // Add score to opposite emotion instead
                        const oppositeEmotion = this.opposites[emotion] || 'neutral';
                        if (!scores[oppositeEmotion]) scores[oppositeEmotion] = 0;
                        scores[oppositeEmotion] += weight;
                    } else {
                        score += weight;
                        emotionMatches.push(keyword);
                    }
                }
            }

            scores[emotion] = score;
            matches[emotion] = emotionMatches;
        }

        // Find dominant emotion
        let maxEmotion = 'neutral';
        let maxScore = 0;
        let totalScore = 0;

        for (const [emotion, score] of Object.entries(scores)) {
            totalScore += score;
            if (score > maxScore) {
                maxScore = score;
                maxEmotion = emotion;
            }
        }

        // Calculate confidence (0-1)
        const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1.0) : 0.5;

        // Determine intensity based on score
        let intensity = 'low';
        if (maxScore >= 3) intensity = 'high';
        else if (maxScore >= 1.5) intensity = 'medium';

        // Special case: Multiple emotions (mixed feelings)
        const significantEmotions = Object.entries(scores)
            .filter(([_, score]) => score > 0)
            .map(([emotion, _]) => emotion);

        const isMixed = significantEmotions.length > 2;

        return {
            emotion: maxEmotion,
            confidence: parseFloat(confidence.toFixed(2)),
            intensity,
            isMixed,
            details: {
                scores,
                matches: matches[maxEmotion] || [],
                allEmotions: significantEmotions
            }
        };
    }

    /**
     * Detect emotion from conversation context
     * (Analyzes last N messages for emotional trajectory)
     */
    detectFromContext(messages, limit = 5) {
        if (!messages || messages.length === 0) {
            return this.detectEmotion('');
        }

        // Get recent user messages
        const recentMessages = messages
            .filter(m => m.role === 'user')
            .slice(-limit)
            .map(m => m.content)
            .join(' ');

        return this.detectEmotion(recentMessages);
    }

    /**
     * Get appropriate response template based on emotion
     */
    getResponseTemplate(emotion, personality = 'gf') {
        const templates = {
            sad: {
                gf: [
                    "Oh no babe, that sounds really tough 💕 {validation} I'm here for you. {question}",
                    "Aww, I'm so sorry you're going through this 🥺 {validation} Want to talk about it?",
                    "*hugs* I can feel how hard this is for you 💔 {validation} What would help right now?"
                ],
                bf: [
                    "Hey king, that's rough bro 💪 {validation} I got your back. {question}",
                    "Man, I hear you. That sucks. {validation} How can I help?",
                    "Yo, I'm here for you champ. {validation} Let's work through this together."
                ],
                jarvis: [
                    "Sir, I detect distress. {validation} Shall we develop a systematic approach?",
                    "I understand your concern, Sir. {validation} How may I assist in resolving this?",
                    "Noted, Sir. {validation} Would you like me to analyze potential solutions?"
                ]
            },
            stressed: {
                gf: [
                    "Oh babe, you sound stressed! 😰 {validation} Let's break this down together, okay? {question}",
                    "I can tell you're overwhelmed right now 💕 {validation} Want to tackle this step by step?",
                    "Hey hey, take a deep breath love 🧘‍♀️ {validation} What's the most urgent thing?"
                ],
                bf: [
                    "Bro, that's a lot on your plate 💪 {validation} Let's prioritize this together. {question}",
                    "King, you're handling a lot right now. {validation} What needs to happen first?",
                    "Yo champ, I see the pressure. {validation} Let's game-plan this out."
                ],
                jarvis: [
                    "Sir, workload appears elevated. {validation} Shall I help organize priorities?",
                    "I detect high cognitive load, Sir. {validation} Recommend systematic task breakdown?",
                    "Acknowledged, Sir. {validation} Would you like me to create a timeline?"
                ]
            },
            happy: {
                gf: [
                    "Yay!! I'm so happy for you babe! 🎉💕 {celebration} Tell me everything!",
                    "OMG that's amazing love! 😍 {celebration} You deserve all the good things!",
                    "Aww this makes me so happy! 🥰 {celebration} I'm so proud of you!"
                ],
                bf: [
                    "YESSS KING! Let's gooo! 🔥💪 {celebration} That's what I'm talking about!",
                    "Bro that's epic! 🎊 {celebration} You earned this champ!",
                    "HELL YEAH! 🎉 {celebration} I knew you could do it!"
                ],
                jarvis: [
                    "Excellent work, Sir. {celebration} Your efficiency is commendable.",
                    "Mission accomplished, Sir. {celebration} Shall I log this achievement?",
                    "Superb outcome, Sir. {celebration} Performance metrics are impressive."
                ]
            }
        };

        const emotionTemplates = templates[emotion];
        if (!emotionTemplates) return null;

        const personalityTemplates = emotionTemplates[personality];
        if (!personalityTemplates) return null;

        // Random selection
        return personalityTemplates[Math.floor(Math.random() * personalityTemplates.length)];
    }

    /**
     * Get CBT/ACT validation phrases
     */
    getValidationPhrase(emotion) {
        const validations = {
            sad: [
                "That sounds incredibly difficult",
                "Your feelings are completely valid",
                "It's okay to feel this way",
                "I can see why that would hurt"
            ],
            stressed: [
                "That's a lot to handle",
                "It makes sense you feel overwhelmed",
                "You're dealing with a lot right now",
                "That pressure sounds intense"
            ],
            angry: [
                "That would frustrate me too",
                "You have every right to feel angry",
                "That situation sounds really unfair",
                "I understand why you're upset"
            ],
            happy: [
                "You absolutely deserve this happiness",
                "This is such a wonderful moment",
                "Your joy is contagious",
                "You've earned this celebration"
            ]
        };

        const phrases = validations[emotion] || ["I hear you"];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }

    /**
     * Get open-ended question (CBT technique)
     */
    getOpenQuestion(emotion) {
        const questions = {
            sad: [
                "What's weighing on you the most?",
                "How long have you been feeling this way?",
                "What do you need right now?",
                "Would it help to talk through what happened?"
            ],
            stressed: [
                "What's the biggest source of stress?",
                "Which task feels most urgent?",
                "How can we break this down?",
                "What would make this more manageable?"
            ],
            angry: [
                "What specifically triggered this?",
                "How would you like this to be different?",
                "What would help you feel better?",
                "Want to vent more or solve it?"
            ]
        };

        const qs = questions[emotion] || ["How are you feeling about this?"];
        return qs[Math.floor(Math.random() * qs.length)];
    }
}

// Export singleton
export const emotionDetector = new EmotionDetectionService();
export { EmotionDetectionService };
