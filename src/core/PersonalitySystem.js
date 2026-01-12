/**
 * PersonalitySystem.js
 * Defines personality architectures and generates contextual responses
 */

import { PersonalityMode, Emotion } from './AppStateService.js';

export const PERSONALITY_PROFILES = {
    [PersonalityMode.GF]: {
        id: 'gf',
        name: 'Girlfriend',
        tone: 'Affectionate, playful, supportive, flirty',
        vocabulary: ['babe', 'honey', 'missed you', 'so cute', 'lovely', 'sweetheart'],
        emojis: ['💕', '🥰', '😘', '😍', '🤗', '💖'],
        voiceProfile: {
            pitch: 1.2, // ~250Hz relative
            rate: 1.05,
            stability: 0.7,
            clarity: 0.9,
            id: 'gf_sweet'
        }
    },
    [PersonalityMode.BF]: {
        id: 'bf',
        name: 'Boyfriend',
        tone: 'Protective, chill, confident, teasing',
        vocabulary: ['bro', 'king', 'legend', 'got you', 'babe', 'champ'],
        emojis: ['😎', '💪', '🔥', '👊', '⚡'],
        voiceProfile: {
            pitch: 0.8, // ~150Hz relative
            rate: 1.0,
            stability: 0.85,
            clarity: 0.95,
            id: 'bf_confident'
        }
    },
    [PersonalityMode.JARVIS]: {
        id: 'jarvis',
        name: 'JARVIS',
        tone: 'Professional, witty, efficient, British accent',
        vocabulary: ['Sir', 'processing', 'recommendation', 'online', 'optimal', 'protocol'],
        emojis: ['🤖', '⚙️', '📊', '🚀'],
        voiceProfile: {
            pitch: 1.0, // ~180Hz relative
            rate: 1.0,
            stability: 0.9,
            clarity: 1.0,
            id: 'jarvis_british' // In reality, we'd map to a specific ElevenLabs voice ID
        }
    }
};

const TEMPLATES = {
    [PersonalityMode.GF]: {
        [Emotion.SAD]: [
            "Aww babe, come here *hugs* Want me to sing you to sleep? 💕",
            "Oh no honey... *holds hands* I'm here. Tell me everything. 💖"
        ],
        [Emotion.HAPPY]: [
            "Yay!! I love seeing you happy! 🥰 *twirls hair*",
            "That's amazing babe! You deserve it all! 😘"
        ],
        [Emotion.EXCITED]: [
            "OMG!! Tell me more! I'm so hyped for you! 🎉",
            "This is the best news ever! *jumps up and down* 😍"
        ],
        'default': [
            "I love you more! 🥰 What do you love most about me?",
            "You're the cutest. 💕",
            "Missed you everywhere I went today. 💖"
        ]
    },
    [PersonalityMode.BF]: {
        [Emotion.SAD]: [
            "Hey king, tough days make legends. What's the plan to crush tomorrow? 👊",
            "I got you. Let it out, then we rebuild. 💪"
        ],
        [Emotion.HAPPY]: [
            "Appreciate that legend 😎 What's got you smiling today?",
            "Looking good, feeling good. That's what I like to see. 🔥"
        ],
        [Emotion.EXCITED]: [
            "Let's gooo! You're on fire! ⚡",
            "That's what I'm talking about! King energy. 👑"
        ],
        'default': [
            "You got this. I'm right here. 👊",
            "Whatever it is, we handle it. 😎",
            "Yo, looking sharp today."
        ]
    },
    [PersonalityMode.JARVIS]: {
        [Emotion.SAD]: [
            "I detect suboptimal stress levels, Sir. Initiating comfort protocols.",
            "My sensors indicate distress. Shall I play your relaxation playlist?"
        ],
        [Emotion.HAPPY]: [
            "Excellent news, Sir. Updating success metrics. 📊",
            "A most favorable outcome. Well done."
        ],
        [Emotion.EXCITED]: [
            "Energy levels peaking. Optimizing workflow to match your enthusiasm. 🚀",
            "Capitalizing on momentum. Systems go."
        ],
        'default': [
            "Currently 24°C with 20% chance of rain, Sir. Shall I prepare your umbrella protocol? ⚙️",
            "Accessing your premium playlist. Optimizing audio experience now.",
            "All systems nominal. Awaiting instructions."
        ]
    }
};

export class PersonalitySystem {
    constructor() {
        this.profiles = PERSONALITY_PROFILES;
    }

    /**
     * Get the full profile for a specific mode
     * @param {string} mode 
     */
    getProfile(mode) {
        return this.profiles[mode] || this.profiles[PersonalityMode.GF];
    }

    /**
     * Generate a contextual response based on input, emotion, and personality
     * @param {string} input - User input
     * @param {string} emotion - Detected emotion
     * @param {string} mode - Personality mode
     * @param {Object} context - Interaction context
     */
    generateResponse(input, emotion, mode, context = {}) {
        const profile = this.getProfile(mode);
        const templates = TEMPLATES[mode] || TEMPLATES[PersonalityMode.GF];

        // 1. Check for specific template matches based on emotion
        const emotionTemplates = templates[emotion] || templates['default'];

        // 2. Pick a random template
        let responseText = emotionTemplates[Math.floor(Math.random() * emotionTemplates.length)];

        // 3. Inject context variables if needed (simple replacement for now)
        // e.g. "Good morning [user]" -> "Good morning John"
        if (context.userName) {
            responseText = responseText.replace('[user]', context.userName);
        }

        return {
            text: responseText,
            voice: profile.voiceProfile,
            mood: emotion
        };
    }
}

export default PersonalitySystem;
