/**
 * TaskBoardService - Kanban Task Management with Calendar Sync
 * 
 * Manages tasks in columns: Todo, In Progress, Done
 * Syncs with Calendar for deadline tracking
 */

import { calendarManager } from '../life-manager/Calendar.js';

class TaskBoardService {
    constructor() {
        this.tasks = [];
        this.columns = ['backlog', 'todo', 'inProgress', 'done'];
        this.initialized = false;
    }

    /**
     * Initialize task board
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Load tasks from storage
            const stored = await this._loadFromStorage();
            if (stored) {
                this.tasks = stored;
            }
            this.initialized = true;
            console.log('[TaskBoard] Initialized with', this.tasks.length, 'tasks');
        } catch (error) {
            console.error('[TaskBoard] Failed to initialize:', error);
        }
    }

    /**
     * Get all tasks
     */
    getTasks() {
        return [...this.tasks];
    }

    /**
     * Get tasks by column
     */
    getTasksByColumn(column) {
        return this.tasks.filter(t => t.column === column);
    }

    /**
     * Add a new task
     */
    async addTask(task) {
        const newTask = {
            id: `task_${Date.now()}`,
            title: task.title,
            description: task.description || '',
            column: task.column || 'backlog',
            priority: task.priority || 'medium',
            dueDate: task.dueDate || null,
            calendarEventId: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: task.tags || [],
            color: task.color || this._getRandomColor()
        };

        // Add to calendar if due date is set
        if (newTask.dueDate) {
            try {
                const eventId = await calendarManager.addEvent({
                    title: `📋 ${newTask.title}`,
                    time: new Date(newTask.dueDate).toISOString(),
                    type: 'task'
                });
                newTask.calendarEventId = eventId;
            } catch (error) {
                console.warn('[TaskBoard] Could not add to calendar:', error);
            }
        }

        this.tasks.push(newTask);
        await this._saveToStorage();
        return newTask;
    }

    /**
     * Update task
     */
    async updateTask(taskId, updates) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index === -1) return null;

        this.tasks[index] = {
            ...this.tasks[index],
            ...updates,
            updatedAt: Date.now()
        };

        await this._saveToStorage();
        return this.tasks[index];
    }

    /**
     * Move task to another column
     */
    async moveTask(taskId, newColumn) {
        return this.updateTask(taskId, { column: newColumn });
    }

    /**
     * Delete task
     */
    async deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index === -1) return false;

        // Remove from calendar if linked
        const task = this.tasks[index];
        if (task.calendarEventId) {
            try {
                await calendarManager.deleteEvent(task.calendarEventId);
            } catch (error) {
                console.warn('[TaskBoard] Could not remove from calendar:', error);
            }
        }

        this.tasks.splice(index, 1);
        await this._saveToStorage();
        return true;
    }

    /**
     * Get task statistics
     */
    getStats() {
        const total = this.tasks.length;
        const done = this.tasks.filter(t => t.column === 'done').length;
        const inProgress = this.tasks.filter(t => t.column === 'inProgress').length;
        const overdue = this.tasks.filter(t =>
            t.dueDate && new Date(t.dueDate) < new Date() && t.column !== 'done'
        ).length;

        return {
            total,
            done,
            inProgress,
            backlog: this.tasks.filter(t => t.column === 'backlog').length,
            todo: this.tasks.filter(t => t.column === 'todo').length,
            overdue,
            completionRate: total > 0 ? Math.round((done / total) * 100) : 0
        };
    }

    /**
     * Get random color for task
     */
    _getRandomColor() {
        const colors = [
            '#3B82F6', // blue
            '#8B5CF6', // purple
            '#EC4899', // pink
            '#10B981', // green
            '#F59E0B', // amber
            '#EF4444', // red
            '#06B6D4', // cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Load tasks from electron-store via IPC
     */
    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.tasks || [];
            }
            return [];
        } catch (error) {
            console.error('[TaskBoard] Load error:', error);
            return [];
        }
    }

    /**
     * Save tasks to storage
     */
    async _saveToStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                await window.nizhal.memory.setUserPreferences({
                    ...prefs,
                    tasks: this.tasks
                });
            }
        } catch (error) {
            console.error('[TaskBoard] Save error:', error);
        }
    }
}

export const taskBoardService = new TaskBoardService();
export default TaskBoardService;
