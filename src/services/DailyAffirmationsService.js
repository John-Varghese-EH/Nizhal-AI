/**
 * DailyAffirmationsService - Inspirational quotes and affirmations
 * 
 * Features:
 * - Daily motivation with smart timing
 * - Affirmations by category (confidence, gratitude, focus, calm)
 * - Custom affirmation management
 * - Emotional context matching
 */

class DailyAffirmationsService {
    constructor() {
        this.lastShownDate = null;
        this.todaysAffirmation = null;
        this.customAffirmations = [];
        this.initialized = false;

        // Built-in affirmations by category
        this.affirmations = {
            confidence: [
                "I am capable of achieving great things.",
                "My potential is limitless.",
                "I trust my instincts and follow my heart.",
                "Every challenge makes me stronger.",
                "I deserve success and happiness.",
                "I am worthy of love and respect.",
                "My voice matters and I speak with confidence.",
                "I embrace my unique qualities."
            ],
            gratitude: [
                "I am grateful for this moment.",
                "I appreciate the love in my life.",
                "Today, I choose to see the positive.",
                "I am thankful for small blessings.",
                "My life is filled with abundance.",
                "I attract positivity and joy.",
                "I appreciate my journey, including the struggles.",
                "Every day is a gift to cherish."
            ],
            focus: [
                "I am focused and productive.",
                "I prioritize what matters most.",
                "Distractions don't control me.",
                "I complete what I start.",
                "My mind is clear and sharp.",
                "I make progress every single day.",
                "I am in control of my time.",
                "Today, I accomplish meaningful work."
            ],
            calm: [
                "I am at peace with myself.",
                "I release what I cannot control.",
                "My breath calms my mind.",
                "I choose serenity over stress.",
                "I am grounded and centered.",
                "Worry does not serve me today.",
                "I flow with life's challenges.",
                "Peace begins within me."
            ],
            motivation: [
                "Today is full of possibilities.",
                "I turn obstacles into opportunities.",
                "I am the author of my life story.",
                "My dreams are worth pursuing.",
                "I take action toward my goals.",
                "Success is my natural state.",
                "I learn and grow from every experience.",
                "I am creating the life I desire."
            ],
            love: [
                "I am loved and I give love freely.",
                "My heart is open to connection.",
                "I deserve healthy relationships.",
                "I radiate warmth and kindness.",
                "Love surrounds me in all I do.",
                "I nurture myself with compassion.",
                "My presence makes others feel valued.",
                "I attract meaningful connections."
            ]
        };
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.lastShownDate = stored.lastShownDate;
                this.todaysAffirmation = stored.todaysAffirmation;
                this.customAffirmations = stored.customAffirmations || [];
            }
            this.initialized = true;
            console.log('[Affirmations] Initialized');
        } catch (error) {
            console.error('[Affirmations] Init error:', error);
        }
    }

    /**
     * Get today's affirmation
     */
    async getTodaysAffirmation(category = null) {
        const today = new Date().toISOString().split('T')[0];

        // Return existing if already set for today
        if (this.lastShownDate === today && this.todaysAffirmation && !category) {
            return this.todaysAffirmation;
        }

        // Select new affirmation
        const affirmation = this._selectAffirmation(category);

        if (!category) {
            this.todaysAffirmation = affirmation;
            this.lastShownDate = today;
            await this._saveToStorage();
        }

        return affirmation;
    }

    /**
     * Select an affirmation, optionally from a specific category
     */
    _selectAffirmation(category = null) {
        let pool = [];

        if (category && this.affirmations[category]) {
            pool = this.affirmations[category];
        } else {
            // Combine all categories
            pool = Object.values(this.affirmations).flat();
        }

        // Add custom affirmations
        pool = [...pool, ...this.customAffirmations];

        // Random selection
        const index = Math.floor(Math.random() * pool.length);
        return {
            text: pool[index],
            category: category || 'mixed',
            timestamp: Date.now()
        };
    }

    /**
     * Get affirmation based on emotion
     */
    getForEmotion(emotion) {
        const emotionCategoryMap = {
            sad: 'calm',
            anxious: 'calm',
            angry: 'calm',
            confused: 'focus',
            sleepy: 'motivation',
            happy: 'gratitude',
            excited: 'confidence',
            love: 'love',
            focused: 'focus',
            neutral: null
        };

        const category = emotionCategoryMap[emotion];
        return this._selectAffirmation(category);
    }

    /**
     * Get all categories
     */
    getCategories() {
        return Object.keys(this.affirmations);
    }

    /**
     * Add a custom affirmation
     */
    async addCustom(text) {
        if (text && text.trim()) {
            this.customAffirmations.push(text.trim());
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Remove a custom affirmation
     */
    async removeCustom(text) {
        const index = this.customAffirmations.indexOf(text);
        if (index > -1) {
            this.customAffirmations.splice(index, 1);
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Get all custom affirmations
     */
    getCustomAffirmations() {
        return [...this.customAffirmations];
    }

    /**
     * Get morning motivation package
     */
    async getMorningMotivation() {
        const affirmation = await this.getTodaysAffirmation();
        const quote = this._getInspirationalQuote();

        return {
            affirmation,
            quote,
            greeting: this._getTimeBasedGreeting()
        };
    }

    /**
     * Get time-appropriate greeting
     */
    _getTimeBasedGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning! 🌅";
        if (hour < 17) return "Good afternoon! ☀️";
        if (hour < 21) return "Good evening! 🌆";
        return "Good night! 🌙";
    }

    /**
     * Get an inspirational quote
     */
    _getInspirationalQuote() {
        const quotes = [
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
            { text: "Happiness is not by chance, but by choice.", author: "Jim Rohn" },
            { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
            { text: "Your limitation—it's only your imagination.", author: "Unknown" },
            { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
            { text: "Great things never come from comfort zones.", author: "Unknown" },
            { text: "Dream it. Wish it. Do it.", author: "Unknown" },
            { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
            { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" }
        ];

        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.affirmations || {};
            }
            return {};
        } catch {
            return {};
        }
    }

    async _saveToStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                await window.nizhal.memory.setUserPreferences({
                    ...prefs,
                    affirmations: {
                        lastShownDate: this.lastShownDate,
                        todaysAffirmation: this.todaysAffirmation,
                        customAffirmations: this.customAffirmations
                    }
                });
            }
        } catch (error) {
            console.error('[Affirmations] Save error:', error);
        }
    }
}

export const dailyAffirmationsService = new DailyAffirmationsService();
export default DailyAffirmationsService;
