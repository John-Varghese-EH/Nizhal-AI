/**
 * SmartRemindersService - Context-aware Smart Reminders
 * 
 * Features:
 * - Time-based reminders
 * - Location-aware reminders (future)
 * - Recurring reminders
 * - Natural language parsing
 */

class SmartRemindersService {
    constructor() {
        this.reminders = [];
        this.activeTimers = new Map();
        this.callbacks = new Set();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.reminders = stored;
                // Reactivate pending reminders
                this._reactivateReminders();
            }
            this.initialized = true;
            console.log('[SmartReminders] Initialized with', this.reminders.length, 'reminders');
        } catch (error) {
            console.error('[SmartReminders] Init error:', error);
        }
    }

    /**
     * Create a new reminder
     */
    async createReminder(options) {
        const reminder = {
            id: `reminder_${Date.now()}`,
            title: options.title || 'Reminder',
            message: options.message || '',
            time: options.time || Date.now() + 3600000, // Default 1 hour
            recurring: options.recurring || null, // 'daily', 'weekly', 'hourly'
            priority: options.priority || 'normal', // 'low', 'normal', 'high', 'urgent'
            status: 'pending',
            createdAt: Date.now(),
            triggerCount: 0,
            tags: options.tags || [],
            emotion: options.emotion || null, // Emotion to trigger when reminder fires
            sound: options.sound !== false
        };

        this.reminders.push(reminder);
        this._scheduleReminder(reminder);
        await this._saveToStorage();

        return reminder;
    }

    /**
     * Parse natural language reminder
     */
    parseNaturalLanguage(text) {
        const now = new Date();
        let time = null;
        let message = text;

        // Pattern: "in X minutes/hours"
        const inMatch = text.match(/in (\d+) (minute|hour|min|hr)s?/i);
        if (inMatch) {
            const amount = parseInt(inMatch[1]);
            const unit = inMatch[2].toLowerCase();
            const ms = unit.startsWith('min') ? amount * 60000 : amount * 3600000;
            time = Date.now() + ms;
            message = text.replace(inMatch[0], '').trim();
        }

        // Pattern: "at HH:MM"
        const atMatch = text.match(/at (\d{1,2}):(\d{2})/i);
        if (atMatch) {
            const hours = parseInt(atMatch[1]);
            const minutes = parseInt(atMatch[2]);
            const targetTime = new Date(now);
            targetTime.setHours(hours, minutes, 0, 0);
            if (targetTime <= now) {
                targetTime.setDate(targetTime.getDate() + 1); // Next day
            }
            time = targetTime.getTime();
            message = text.replace(atMatch[0], '').trim();
        }

        // Pattern: "tomorrow"
        if (text.toLowerCase().includes('tomorrow')) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0); // Default 9 AM
            time = tomorrow.getTime();
            message = text.replace(/tomorrow/i, '').trim();
        }

        // Clean up message
        message = message.replace(/^(to |remind me |remember to )/i, '').trim();

        return {
            time: time || Date.now() + 3600000, // Default 1 hour if no time found
            message: message || 'Reminder'
        };
    }

    /**
     * Schedule a reminder
     */
    _scheduleReminder(reminder) {
        if (reminder.status !== 'pending') return;

        const delay = Math.max(0, reminder.time - Date.now());

        if (delay > 2147483647) {
            // Timer too long, schedule check for later
            console.log('[SmartReminders] Reminder too far in future:', reminder.id);
            return;
        }

        const timer = setTimeout(() => {
            this._triggerReminder(reminder);
        }, delay);

        this.activeTimers.set(reminder.id, timer);
    }

    /**
     * Trigger a reminder
     */
    async _triggerReminder(reminder) {
        reminder.status = 'triggered';
        reminder.triggerCount++;
        reminder.lastTriggered = Date.now();

        // Notify all callbacks
        for (const callback of this.callbacks) {
            try {
                callback(reminder);
            } catch (error) {
                console.error('[SmartReminders] Callback error:', error);
            }
        }

        // Show notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(reminder.title, {
                    body: reminder.message,
                    icon: '/assets/icon.png',
                    tag: reminder.id
                });
            }
        }

        // Handle recurring
        if (reminder.recurring) {
            const intervals = {
                hourly: 3600000,
                daily: 86400000,
                weekly: 604800000
            };
            reminder.time = Date.now() + (intervals[reminder.recurring] || 86400000);
            reminder.status = 'pending';
            this._scheduleReminder(reminder);
        }

        await this._saveToStorage();
    }

    /**
     * Reactivate reminders after load
     */
    _reactivateReminders() {
        for (const reminder of this.reminders) {
            if (reminder.status === 'pending' && reminder.time > Date.now()) {
                this._scheduleReminder(reminder);
            }
        }
    }

    /**
     * Get all reminders
     */
    getReminders() {
        return [...this.reminders];
    }

    /**
     * Get pending reminders
     */
    getPending() {
        return this.reminders.filter(r => r.status === 'pending');
    }

    /**
     * Get upcoming reminders (next 24 hours)
     */
    getUpcoming() {
        const nextDay = Date.now() + 86400000;
        return this.reminders
            .filter(r => r.status === 'pending' && r.time <= nextDay)
            .sort((a, b) => a.time - b.time);
    }

    /**
     * Cancel a reminder
     */
    async cancelReminder(id) {
        const timer = this.activeTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.activeTimers.delete(id);
        }

        const index = this.reminders.findIndex(r => r.id === id);
        if (index > -1) {
            this.reminders.splice(index, 1);
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Snooze a reminder
     */
    async snoozeReminder(id, minutes = 10) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.time = Date.now() + (minutes * 60000);
            reminder.status = 'pending';
            this._scheduleReminder(reminder);
            await this._saveToStorage();
            return reminder;
        }
        return null;
    }

    /**
     * Subscribe to reminder triggers
     */
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.reminders || [];
            }
            return [];
        } catch {
            return [];
        }
    }

    async _saveToStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                await window.nizhal.memory.setUserPreferences({
                    ...prefs,
                    reminders: this.reminders
                });
            }
        } catch (error) {
            console.error('[SmartReminders] Save error:', error);
        }
    }
}

export const smartRemindersService = new SmartRemindersService();
export default SmartRemindersService;
