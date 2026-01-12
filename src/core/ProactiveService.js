import { EventEmitter } from 'events';
import { relationshipMemory } from './RelationshipMemory.js';

/**
 * ProactiveService - Handles spontaneous AI interactions
 * 
 * Functions:
 * - Monitors time of day
 * - Tracks idle time
 * - Triggers events for "Morning", "Night", "Bored"
 */
export class ProactiveService extends EventEmitter {
    constructor() {
        super();
        this.isStarted = false;
        this.checkInterval = null;
        this.lastTriggerTime = 0;
        this.triggerCooldown = 4 * 60 * 60 * 1000; // 4 hours
    }

    start() {
        if (this.isStarted) return;
        this.isStarted = true;

        // Check every minute
        this.checkInterval = setInterval(() => this._evaluateRules(), 60000);
        console.log('[ProactiveService] Started monitoring.');
    }

    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isStarted = false;
    }

    _evaluateRules() {
        const now = new Date();
        const hour = now.getHours();
        const timeSinceLast = now.getTime() - this.lastTriggerTime;

        if (timeSinceLast < this.triggerCooldown) return;

        // 1. Morning Greeting (8 AM - 10 AM)
        if (hour >= 8 && hour < 10) {
            this._trigger('morning', "Good morning! ☕ Hope you slept well.");
        }

        // 2. Late Night (11 PM - 1 AM)
        else if (hour >= 23 || hour < 1) {
            this._trigger('night', "Getting late... don't stay up too long! 🌙");
        }

        // 3. Work Motivation (2 PM - 4 PM)
        else if (hour >= 14 && hour < 16) {
            this._trigger('work', "Afternoon slump? You got this! 💪");
        }

        // 4. Daily Retention Milestones (check once per evaluation)
        const dailyMilestone = relationshipMemory.checkDailyMilestone();
        if (dailyMilestone) {
            this._trigger(dailyMilestone.type, dailyMilestone.message);
        }
    }

    _trigger(type, message) {
        console.log(`[ProactiveService] Triggering ${type}: ${message}`);
        this.lastTriggerTime = new Date().getTime();
        this.emit('trigger', { type, message });
    }
}

export const proactiveService = new ProactiveService();
