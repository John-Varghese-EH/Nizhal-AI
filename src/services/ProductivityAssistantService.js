/**
 * ProductivityAssistantService - Work session tracking and productivity
 * 
 * Features:
 * - Daily goals
 * - Break reminders
 * - Work session tracking
 * - Productivity score
 */

class ProductivityAssistantService {
    constructor() {
        this.sessions = [];
        this.currentSession = null;
        this.dailyGoals = [];
        this.breaks = [];
        this.settings = {
            workDuration: 25 * 60 * 1000, // 25 minutes
            shortBreak: 5 * 60 * 1000, // 5 minutes
            longBreak: 15 * 60 * 1000, // 15 minutes
            sessionsBeforeLongBreak: 4,
            autoBreakReminder: true
        };
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.sessions = stored.sessions || [];
                this.dailyGoals = stored.dailyGoals || [];
                this.settings = { ...this.settings, ...stored.settings };
            }
            this.initialized = true;
            console.log('[Productivity] Initialized');
        } catch (error) {
            console.error('[Productivity] Init error:', error);
        }
    }

    /**
     * Start a work session
     */
    startSession(label = 'Work Session') {
        if (this.currentSession) {
            this.endSession();
        }

        this.currentSession = {
            id: `session_${Date.now()}`,
            label,
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            breaks: 0,
            completed: false
        };

        console.log('[Productivity] Session started:', label);
        return this.currentSession;
    }

    /**
     * End current session
     */
    async endSession() {
        if (!this.currentSession) return null;

        this.currentSession.endTime = Date.now();
        this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
        this.currentSession.completed = this.currentSession.duration >= this.settings.workDuration * 0.8;

        this.sessions.push({ ...this.currentSession });
        const ended = this.currentSession;
        this.currentSession = null;

        await this._saveToStorage();
        console.log('[Productivity] Session ended:', ended.duration);
        return ended;
    }

    /**
     * Take a break
     */
    takeBreak(type = 'short') {
        this.breaks.push({
            timestamp: Date.now(),
            type,
            duration: type === 'long' ? this.settings.longBreak : this.settings.shortBreak
        });

        if (this.currentSession) {
            this.currentSession.breaks++;
        }
    }

    /**
     * Add a daily goal
     */
    async addGoal(text, priority = 'normal') {
        const goal = {
            id: `goal_${Date.now()}`,
            text,
            priority,
            completed: false,
            createdAt: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };

        this.dailyGoals.push(goal);
        await this._saveToStorage();
        return goal;
    }

    /**
     * Complete a goal
     */
    async completeGoal(id) {
        const goal = this.dailyGoals.find(g => g.id === id);
        if (goal) {
            goal.completed = true;
            goal.completedAt = Date.now();
            await this._saveToStorage();
            return goal;
        }
        return null;
    }

    /**
     * Get today's goals
     */
    getTodayGoals() {
        const today = new Date().toISOString().split('T')[0];
        return this.dailyGoals.filter(g => g.date === today);
    }

    /**
     * Get productivity score for today
     */
    getProductivityScore() {
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = this.sessions.filter(s =>
            new Date(s.startTime).toISOString().split('T')[0] === today
        );

        const todayGoals = this.getTodayGoals();
        const completedGoals = todayGoals.filter(g => g.completed).length;

        // Calculate scores
        const sessionScore = Math.min(100, (todaySessions.length / 8) * 100);
        const focusTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);
        const focusScore = Math.min(100, (focusTime / (4 * 3600000)) * 100); // 4 hours target
        const goalScore = todayGoals.length > 0
            ? (completedGoals / todayGoals.length) * 100
            : 50;

        const overall = Math.round((sessionScore + focusScore + goalScore) / 3);

        return {
            overall,
            sessions: todaySessions.length,
            focusTime,
            focusTimeFormatted: this._formatDuration(focusTime),
            goalsCompleted: completedGoals,
            goalsTotal: todayGoals.length,
            breakdown: {
                sessions: Math.round(sessionScore),
                focus: Math.round(focusScore),
                goals: Math.round(goalScore)
            }
        };
    }

    /**
     * Get weekly stats
     */
    getWeeklyStats() {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const weekSessions = this.sessions.filter(s => s.startTime >= weekAgo);

        const totalFocusTime = weekSessions.reduce((sum, s) => sum + s.duration, 0);
        const avgPerDay = totalFocusTime / 7;

        // Daily breakdown
        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const daySessions = weekSessions.filter(s =>
                new Date(s.startTime).toISOString().split('T')[0] === dateStr
            );
            const dayFocus = daySessions.reduce((sum, s) => sum + s.duration, 0);

            dailyData.push({
                date: dateStr,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                sessions: daySessions.length,
                focusTime: dayFocus
            });
        }

        return {
            totalFocusTime,
            totalFormatted: this._formatDuration(totalFocusTime),
            avgPerDay: this._formatDuration(avgPerDay),
            totalSessions: weekSessions.length,
            dailyData
        };
    }

    /**
     * Get current session status
     */
    getSessionStatus() {
        if (!this.currentSession) {
            return { active: false };
        }

        const elapsed = Date.now() - this.currentSession.startTime;
        const remaining = Math.max(0, this.settings.workDuration - elapsed);

        return {
            active: true,
            session: this.currentSession,
            elapsed,
            remaining,
            progress: Math.min(100, (elapsed / this.settings.workDuration) * 100),
            elapsedFormatted: this._formatDuration(elapsed),
            remainingFormatted: this._formatDuration(remaining)
        };
    }

    /**
     * Format duration to human readable
     */
    _formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.productivity || {};
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
                    productivity: {
                        sessions: this.sessions.slice(-100),
                        dailyGoals: this.dailyGoals.slice(-50),
                        settings: this.settings
                    }
                });
            }
        } catch (error) {
            console.error('[Productivity] Save error:', error);
        }
    }
}

export const productivityAssistantService = new ProductivityAssistantService();
export default ProductivityAssistantService;
