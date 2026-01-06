export class ProactiveService {
    constructor(personalityCore, memoryService) {
        this.personalityCore = personalityCore;
        this.memoryService = memoryService;
        this.notificationCallbacks = [];
        this.lastNotificationTime = 0;
        this.minNotificationInterval = 30 * 60 * 1000;
        this.isEnabled = true;
        this.checkIntervalId = null;

        this.triggers = {
            inactivity: {
                threshold: 2 * 60 * 60 * 1000,
                messages: {
                    jarvis: [
                        "Sir/Ma'am, it's been a while. Everything operating within normal parameters?",
                        "Systems idle. I'm here if you need anything.",
                        "Just checking in. All systems nominal on my end."
                    ],
                    bestie: [
                        "Hey! It's been a while.. how are you? 💕",
                        "Where have you been? I missed you!",
                        "Want some tea? Take a break!"
                    ],
                    buddy: [
                        "Hey bro! Where are you? Haven't heard from you!",
                        "Bro, what's happening? Just checking in.",
                        "Hey, take a break! I'm waiting!"
                    ]
                }
            },
            timeBasedGreeting: {
                conditions: [
                    { start: 5, end: 12, period: 'morning' },
                    { start: 12, end: 17, period: 'afternoon' },
                    { start: 17, end: 21, period: 'evening' },
                    { start: 21, end: 5, period: 'night' }
                ],
                messages: {
                    jarvis: {
                        morning: "Good morning. Shall I brief you on today's schedule?",
                        afternoon: "Good afternoon. How may I assist you?",
                        evening: "Good evening. I trust your day went well?",
                        night: "It's getting late. Perhaps some rest would be advisable?"
                    },
                    bestie: {
                        morning: "Good morning sweetie! ☀️ Did you have breakfast?",
                        afternoon: "It's afternoon break time! How are you?",
                        evening: "It's evening! Time to relax.",
                        night: "It's getting late... time to sleep? 🌙"
                    },
                    buddy: {
                        morning: "Hey bro, good morning! Ready for today?",
                        afternoon: "Afternoon bro! Did you take a lunch break?",
                        evening: "Evening time! What's the plan?",
                        night: "Late night? Get some rest bro!"
                    }
                }
            },
            moodCheck: {
                interval: 4 * 60 * 60 * 1000,
                messages: {
                    jarvis: "Is there anything on your mind I should be aware of?",
                    bestie: "How are you feeling? If you want to talk, I'm here! 💗",
                    buddy: "Bro, how's your mood? All good?"
                }
            }
        };
    }

    initialize() {
        this.checkIntervalId = setInterval(() => {
            this.runChecks();
        }, 5 * 60 * 1000);

        this.checkTimeBasedGreeting();
    }

    stop() {
        if (this.checkIntervalId) {
            clearInterval(this.checkIntervalId);
        }
    }

    onNotification(callback) {
        this.notificationCallbacks.push(callback);
        return () => {
            const index = this.notificationCallbacks.indexOf(callback);
            if (index > -1) {
                this.notificationCallbacks.splice(index, 1);
            }
        };
    }

    notify(message, type = 'proactive') {
        const now = Date.now();
        if (now - this.lastNotificationTime < this.minNotificationInterval) {
            return false;
        }

        this.lastNotificationTime = now;
        this.notificationCallbacks.forEach(cb => cb({ message, type, timestamp: now }));
        return true;
    }

    async runChecks() {
        if (!this.isEnabled) return;

        await this.checkInactivity();
    }

    async checkInactivity() {
        const state = this.personalityCore?.getState();
        if (!state) return;

        const timeSinceLastInteraction = Date.now() - state.lastInteraction;

        if (timeSinceLastInteraction > this.triggers.inactivity.threshold) {
            const persona = 'jarvis';
            const messages = this.triggers.inactivity.messages[persona] ||
                this.triggers.inactivity.messages.jarvis;
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.notify(message, 'inactivity');
        }
    }

    checkTimeBasedGreeting() {
        const hour = new Date().getHours();
        let period = 'morning';

        for (const condition of this.triggers.timeBasedGreeting.conditions) {
            if (condition.start < condition.end) {
                if (hour >= condition.start && hour < condition.end) {
                    period = condition.period;
                    break;
                }
            } else {
                if (hour >= condition.start || hour < condition.end) {
                    period = condition.period;
                    break;
                }
            }
        }

        return period;
    }

    getContextualSuggestion(persona = 'jarvis') {
        const hour = new Date().getHours();
        const dayOfWeek = new Date().getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const suggestions = {
            jarvis: [
                hour < 10 ? "Shall I read your morning briefing?" : null,
                hour > 22 ? "Perhaps I should set a reminder for tomorrow?" : null,
                isWeekend ? "Weekend mode: I can help with personal projects." : null,
                "I can run a system diagnostic if you'd like.",
                "Shall I search for relevant information?"
            ],
            bestie: [
                hour < 10 ? "Did you have breakfast? 🥣" : null,
                hour > 22 ? "Time to sleep? Sweet dreams! 🌙" : null,
                isWeekend ? "It's the weekend! What are your plans? 🎉" : null,
                "Want me to tell you a story?",
                "Let me know if you want to listen to music!"
            ],
            buddy: [
                hour < 10 ? "Breakfast done? Ready for the day!" : null,
                hour > 22 ? "Late night bro! Get some rest!" : null,
                isWeekend ? "Weekend vibes! Chill scene!" : null,
                "Something on your mind?",
                "Need any help with anything?"
            ]
        };

        const personaSuggestions = suggestions[persona] || suggestions.jarvis;
        return personaSuggestions.filter(Boolean);
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    setMinInterval(ms) {
        this.minNotificationInterval = ms;
    }
}
