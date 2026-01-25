/**
 * Surprise Service
 * Triggers random "surprises" for the user to make the AI feel alive.
 * Events: emotes, small messages, animations.
 */
import { EventEmitter } from 'events';

class SurpriseService extends EventEmitter {
    constructor() {
        super();
        this.timer = null;
        this.isRunning = false;
        this.isFrequent = false;
    }

    /**
     * Start the surprise generator
     * @param {boolean} frequent - If true, triggers more often (e.g. for screensaver)
     */
    start(frequent = false) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isFrequent = frequent;
        this.scheduleNext();
    }

    stop() {
        this.isRunning = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    scheduleNext() {
        if (!this.isRunning) return;

        // Frequent: 10-30s, Normal: 5-15 mins
        const minDelay = this.isFrequent ? 10000 : 300000;
        const maxDelay = this.isFrequent ? 30000 : 900000;
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;

        this.timer = setTimeout(() => {
            this.triggerSurprise();
            this.scheduleNext();
        }, delay);
    }

    triggerSurprise() {
        const types = ['emote', 'message', 'spin'];
        const type = types[Math.floor(Math.random() * types.length)];

        let data;
        switch (type) {
            case 'emote':
                const emotes = ['happy', 'love', 'surprised', 'wink'];
                data = emotes[Math.floor(Math.random() * emotes.length)];
                break;
            case 'message':
                const messages = [
                    "Just checking in! 👋",
                    "You're doing great! 🌟",
                    "Did you drink water? 💧",
                    "I'm here if you need me.",
                    "Nice wallpaper! 😉"
                ];
                data = messages[Math.floor(Math.random() * messages.length)];
                break;
            case 'spin':
                data = true;
                break;
        }

        // Emit 'surprise' event with type and data
        // API designed to match usage: onSurprise((type, data) => ...)
        this.emit('surprise', type, data);
    }

    /**
     * Subscribe to surprises
     * @param {Function} callback - (type, data) => void
     * @returns {Function} unsubscribe function
     */
    onSurprise(callback) {
        this.on('surprise', callback);
        return () => this.off('surprise', callback);
    }
}

export const surpriseService = new SurpriseService();
