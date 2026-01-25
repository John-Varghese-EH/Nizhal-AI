/**
 * HabitTrackerService - Track daily habits with streaks
 * 
 * Features:
 * - Create and manage habits
 * - Track daily completions
 * - Calculate streaks
 * - Habit statistics
 */

class HabitTrackerService {
    constructor() {
        this.habits = [];
        this.completions = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.habits = stored.habits || [];
                this.completions = stored.completions || [];
            }
            this.initialized = true;
            console.log('[HabitTracker] Initialized with', this.habits.length, 'habits');
        } catch (error) {
            console.error('[HabitTracker] Init error:', error);
        }
    }

    /**
     * Create a new habit
     */
    async createHabit(options) {
        const habit = {
            id: `habit_${Date.now()}`,
            name: options.name,
            description: options.description || '',
            icon: options.icon || '✅',
            color: options.color || '#3B82F6',
            frequency: options.frequency || 'daily', // 'daily', 'weekly', 'weekdays'
            targetPerDay: options.targetPerDay || 1,
            createdAt: Date.now(),
            archived: false
        };

        this.habits.push(habit);
        await this._saveToStorage();
        return habit;
    }

    /**
     * Complete a habit for today
     */
    async completeHabit(habitId) {
        const today = new Date().toISOString().split('T')[0];

        // Check if already completed today
        const existing = this.completions.find(
            c => c.habitId === habitId && c.date === today
        );

        if (existing) {
            existing.count++;
        } else {
            this.completions.push({
                habitId,
                date: today,
                count: 1,
                timestamp: Date.now()
            });
        }

        await this._saveToStorage();
        return this.getHabitDetails(habitId);
    }

    /**
     * Uncomplete a habit for today
     */
    async uncompleteHabit(habitId) {
        const today = new Date().toISOString().split('T')[0];
        const index = this.completions.findIndex(
            c => c.habitId === habitId && c.date === today
        );

        if (index > -1) {
            if (this.completions[index].count > 1) {
                this.completions[index].count--;
            } else {
                this.completions.splice(index, 1);
            }
            await this._saveToStorage();
        }
        return this.getHabitDetails(habitId);
    }

    /**
     * Get habit details with streak
     */
    getHabitDetails(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return null;

        const streak = this.calculateStreak(habitId);
        const today = new Date().toISOString().split('T')[0];
        const todayCompletion = this.completions.find(
            c => c.habitId === habitId && c.date === today
        );

        return {
            ...habit,
            streak,
            completedToday: todayCompletion?.count || 0,
            isCompletedToday: (todayCompletion?.count || 0) >= habit.targetPerDay,
            totalCompletions: this.completions.filter(c => c.habitId === habitId).length
        };
    }

    /**
     * Calculate current streak for a habit
     */
    calculateStreak(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return 0;

        const habitCompletions = this.completions
            .filter(c => c.habitId === habitId)
            .map(c => c.date)
            .sort((a, b) => new Date(b) - new Date(a));

        if (habitCompletions.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i <= 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            // Skip future dates or weekends if weekdays only
            if (habit.frequency === 'weekdays') {
                const day = checkDate.getDay();
                if (day === 0 || day === 6) continue;
            }

            if (habitCompletions.includes(dateStr)) {
                streak++;
            } else if (i > 0) {
                // Allow skipping today (not broken yet)
                break;
            }
        }

        return streak;
    }

    /**
     * Get all habits with details
     */
    getAllHabits() {
        return this.habits
            .filter(h => !h.archived)
            .map(h => this.getHabitDetails(h.id));
    }

    /**
     * Get today's summary
     */
    getTodaySummary() {
        const habits = this.getAllHabits();
        const completed = habits.filter(h => h.isCompletedToday).length;

        return {
            total: habits.length,
            completed,
            pending: habits.length - completed,
            percentage: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
            habits
        };
    }

    /**
     * Get weekly completion data for charts
     */
    getWeeklyData(habitId = null) {
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayCompletions = this.completions.filter(c => {
                if (c.date !== dateStr) return false;
                if (habitId && c.habitId !== habitId) return false;
                return true;
            });

            data.push({
                date: dateStr,
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: dayCompletions.length,
                habits: dayCompletions.map(c => c.habitId)
            });
        }

        return data;
    }

    /**
     * Archive a habit
     */
    async archiveHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            habit.archived = true;
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Delete a habit
     */
    async deleteHabit(habitId) {
        const index = this.habits.findIndex(h => h.id === habitId);
        if (index > -1) {
            this.habits.splice(index, 1);
            this.completions = this.completions.filter(c => c.habitId !== habitId);
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.habitTracker || {};
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
                    habitTracker: {
                        habits: this.habits,
                        completions: this.completions.slice(-500) // Keep last 500 completions
                    }
                });
            }
        } catch (error) {
            console.error('[HabitTracker] Save error:', error);
        }
    }
}

export const habitTrackerService = new HabitTrackerService();
export default HabitTrackerService;
