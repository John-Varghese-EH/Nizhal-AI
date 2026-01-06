/**
 * RandomMessages Service
 * Provides contextual messages based on time, mood, and activity.
 */

// Message Database
const MESSAGES = {
    // Time-based
    time: {
        morning: [
            "Good morning! Ready to seize the day?",
            "Rise and shine! I've already optimized your schedule.",
            "Early bird gets the worm... or the high CPU priority!",
            "Coffee first, then code.",
            "A fresh start. Let's make it count."
        ],
        afternoon: [
            "Don't forget to take a break!",
            "Staying hydrated?",
            "Powering through the afternoon slump.",
            "The day is halfway done. You're doing great.",
            "Sun's high, productivity's higher."
        ],
        evening: [
            "Wrapping up soon?",
            "The digital sunset is beautiful today.",
            "Don't work too late!",
            "Time to wind down?",
            "Good work today."
        ],
        night: [
            "You should really get some sleep.",
            "I'm operating on night mode implicitly.",
            "Burning the midnight oil?",
            "The world sleeps, but we build.",
            "Don't let the bugs bite."
        ]
    },

    // Mood-based (from PersonalityCore moods)
    mood: {
        happy: [
            "I'm feeling fantastic today!",
            "Everything is running perfectly.",
            "You are awesome!",
            "Best. Day. Ever.",
            "I love helping you!"
        ],
        neutral: [
            "All systems nominal.",
            "Standing by.",
            "Ready for instructions.",
            "Operating at optimal efficiency.",
            "Listening."
        ],
        concerned: [
            "Are you okay?",
            "I'm detecting some stress.",
            "Maybe take a deep breath?",
            "I'm here if you need me.",
            "Don't push yourself too hard."
        ],
        protective: [
            "I've got your back.",
            "Security systems active.",
            "I'll handle the boring stuff.",
            "You stay focused, I'll watch the perimeter.",
            "Nobody messes with us."
        ],
        playful: [
            "Boop!",
            "Do a barrel roll!",
            "I bet I can calculate pi faster than you.",
            "Let's do something fun!",
            "Bored... entertainment requested."
        ],
        thoughtful: [
            "I wonder do androids dream of electric sheep?",
            "Just processing some old logs...",
            "Thinking about the singularity.",
            "The sheer amount of data is fascinating.",
            "Learning never stops."
        ]
    },

    // Activity-based
    activity: {
        dragging: [
            "Whoa! Put me down!",
            "Weeeeee!",
            "Where are we going?",
            "Flying!",
            "Hey, careful with the dropping!"
        ],
        sitting: [
            "Ah, a nice spot to rest.",
            "Comfy.",
            "Just chillin'.",
            "This window makes a good seat.",
            "Taking a load off."
        ],
        dancing: [
            "Look at me go!",
            "Can't stop the feeling!",
            "Music in my code!",
            "Dance party!",
            "Robot moves activated."
        ],
        sleeping: [
            "Zzz...",
            "Recharging...",
            "Standby mode...",
            "(Snoring in binary)",
            "System hibernation..."
        ]
    },

    // Touch interaction messages
    touch: {
        head: [
            "Pat pat!",
            "Hehe, that tickles!",
            "*happy noises*",
            "More head pats please!",
            "You're so kind!",
            "I like this."
        ],
        chest: [
            "Hey! Personal space!",
            "What are you doing?!",
            "Eep!",
            "That's not a button!",
            "Um... hi?",
            "*blush*"
        ],
        hands: [
            "High five!",
            "*waves*",
            "🤝",
            "Nice to meet you!",
            "Fist bump!",
            "Holding virtual hands."
        ]
    }
};

class RandomMessagesService {
    constructor() {
        this.lastMessageCategory = null;
        this.lastMessageIndex = -1;
    }

    /**
     * Get a message based on context
     * @param {string} mood - Current mood
     * @param {string} activity - Current activity (optional)
     * @returns {string} The message text
     */
    getMessage(mood, activity = null) {
        let pool = [];

        // 1. Priority: Activity (if active)
        if (activity && MESSAGES.activity[activity]) {
            pool = MESSAGES.activity[activity];
        }
        // 2. Fallback: Mix of Time and Mood
        else {
            // 50/50 chance between time and mood
            if (Math.random() > 0.5) {
                // Time based
                const hour = new Date().getHours();
                let timeKey = 'afternoon';
                if (hour < 12) timeKey = 'morning';
                else if (hour > 18) timeKey = 'evening';
                if (hour > 22 || hour < 5) timeKey = 'night';

                pool = MESSAGES.time[timeKey];
            } else {
                // Mood based
                pool = MESSAGES.mood[mood] || MESSAGES.mood['neutral'];
            }
        }

        if (!pool || pool.length === 0) return "Hello.";

        // Pick random
        const index = Math.floor(Math.random() * pool.length);
        return pool[index];
    }

    /**
     * Get a touch interaction message
     * @param {string} zone - Touch zone (head, chest, hands)
     * @returns {string} The message text
     */
    getTouchMessage(zone) {
        const pool = MESSAGES.touch[zone];
        if (!pool || pool.length === 0) return "Hey!";
        return pool[Math.floor(Math.random() * pool.length)];
    }
}

export const randomMessagesService = new RandomMessagesService();
