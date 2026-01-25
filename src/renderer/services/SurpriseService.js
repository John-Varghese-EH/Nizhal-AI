/**
 * SurpriseService - Managing random delightful events
 */
class SurpriseService {
    constructor() {
        this.timer = null;
        this.callback = null;
        this.minInterval = 2 * 60 * 1000; // 2 minutes
        this.maxInterval = 10 * 60 * 1000; // 10 minutes
        this.isActive = false;

        this.eventTypes = [
            'emote',
            'message',
            'spin',
            'hover',
            'peek'
        ];

        this.messages = [
            "Don't forget to drink water!",
            "You're doing great!",
            "Take a deep breath...",
            "Stretch your legs!",
            "I'm bored... wanna play?",
            "Did you know? I live in your computer!",
            "Checking for bugs... found none!",
            "*Humming a tune*"
        ];

        this.emotes = ['happy', 'playful', 'surprised', 'love'];
    }

    /**
     * Subscribe to surprise events
     * @param {Function} callback - (type, data) => void
     */
    onSurprise(callback) {
        this.callback = callback;
        return () => { this.callback = null; };
    }

    /**
     * Start the surprise timer
     * @param {boolean} frequent - If true, events happen more often (e.g. for screensaver)
     */
    start(frequent = false) {
        if (this.isActive) this.stop();
        this.isActive = true;

        // Adjust intervals if frequent mode (screensaver)
        const min = frequent ? 10 * 1000 : this.minInterval; // 10 sec for screensaver
        const max = frequent ? 60 * 1000 : this.maxInterval; // 1 min for screensaver

        this._scheduleNext(min, max);
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.isActive = false;
    }

    _scheduleNext(min, max) {
        if (!this.isActive) return;

        const delay = Math.floor(Math.random() * (max - min + 1) + min);

        this.timer = setTimeout(() => {
            this._triggerEvent();
            this._scheduleNext(min, max); // Schedule next one
        }, delay);
    }

    _triggerEvent() {
        if (!this.callback) return;

        // Pick random event type
        const type = this.eventTypes[Math.floor(Math.random() * this.eventTypes.length)];
        let data = null;

        switch (type) {
            case 'emote':
                data = this.emotes[Math.floor(Math.random() * this.emotes.length)];
                break;
            case 'message':
                data = this.messages[Math.floor(Math.random() * this.messages.length)];
                break;
            // distinct types like 'spin' or 'hover' handle themselves
        }

        this.callback(type, data);
    }
}

export const surpriseService = new SurpriseService();
