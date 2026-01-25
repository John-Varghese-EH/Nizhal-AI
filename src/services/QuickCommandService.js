/**
 * QuickCommandService - Slash Commands Handler
 * 
 * Provides instant actions through slash commands:
 * /weather - Get current weather
 * /focus [minutes] - Start focus timer
 * /remind [message] - Set a reminder
 * /note [text] - Save a quick note
 * /tasks - Show task board summary
 * /mood [happy/sad/neutral] - Log current mood
 */

class QuickCommandService {
    constructor() {
        this.commands = new Map();
        this.history = [];
        this._registerDefaultCommands();
    }

    /**
     * Register default commands
     */
    _registerDefaultCommands() {
        // Weather command
        this.register('weather', async () => {
            try {
                const { weatherService } = await import('../assistant/life-manager/Weather.js');
                const weather = await weatherService.getWeather();
                return {
                    success: true,
                    message: `🌤️ ${weather.temp}°C in ${weather.city} - ${weather.description}`,
                    data: weather
                };
            } catch (error) {
                return { success: false, message: 'Failed to fetch weather' };
            }
        });

        // Focus command
        this.register('focus', async (args) => {
            const minutes = parseInt(args[0]) || 25;
            return {
                success: true,
                message: `🍅 Focus mode started for ${minutes} minutes!`,
                action: 'startFocus',
                data: { duration: minutes }
            };
        });

        // Remind command
        this.register('remind', async (args) => {
            const message = args.join(' ');
            if (!message) {
                return { success: false, message: 'Please provide a reminder message' };
            }
            return {
                success: true,
                message: `⏰ Reminder set: "${message}"`,
                action: 'setReminder',
                data: { message, time: Date.now() + 3600000 } // 1 hour default
            };
        });

        // Note command
        this.register('note', async (args) => {
            const text = args.join(' ');
            if (!text) {
                return { success: false, message: 'Please provide note text' };
            }
            try {
                const { lifeService } = await import('./LifeService.js');
                await lifeService.addMemory(text, 'note');
                return {
                    success: true,
                    message: `📝 Note saved: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                    data: { text }
                };
            } catch (error) {
                return { success: false, message: 'Failed to save note' };
            }
        });

        // Tasks summary command
        this.register('tasks', async () => {
            try {
                const { taskBoardService } = await import('../assistant/life-manager/TaskBoardService.js');
                await taskBoardService.initialize();
                const stats = taskBoardService.getStats();
                return {
                    success: true,
                    message: `📋 Tasks: ${stats.total} total | ${stats.inProgress} in progress | ${stats.done} done (${stats.completionRate}% complete)`,
                    data: stats
                };
            } catch (error) {
                return { success: false, message: 'Failed to get tasks' };
            }
        });

        // Mood logging command
        this.register('mood', async (args) => {
            const mood = args[0]?.toLowerCase() || 'neutral';
            const validMoods = ['happy', 'sad', 'neutral', 'excited', 'anxious', 'calm'];

            if (!validMoods.includes(mood)) {
                return {
                    success: false,
                    message: `Invalid mood. Use: ${validMoods.join(', ')}`
                };
            }

            const moodEmoji = {
                happy: '😊', sad: '😢', neutral: '😐',
                excited: '🤩', anxious: '😰', calm: '😌'
            };

            return {
                success: true,
                message: `${moodEmoji[mood]} Mood logged: ${mood}`,
                action: 'logMood',
                data: { mood, timestamp: Date.now() }
            };
        });

        // Help command
        this.register('help', async () => {
            const commands = [
                '/weather - Get current weather',
                '/focus [min] - Start focus timer (default 25 min)',
                '/remind [msg] - Set a reminder',
                '/note [text] - Save a quick note',
                '/tasks - Show task summary',
                '/mood [type] - Log current mood',
                '/clear - Clear chat history'
            ];
            return {
                success: true,
                message: `**Available Commands:**\n${commands.join('\n')}`,
                data: { commands }
            };
        });

        // Clear command
        this.register('clear', async () => {
            return {
                success: true,
                message: '🧹 Chat cleared!',
                action: 'clearChat'
            };
        });
    }

    /**
     * Register a new command
     */
    register(name, handler) {
        this.commands.set(name.toLowerCase(), handler);
    }

    /**
     * Check if input is a command
     */
    isCommand(input) {
        return input?.trim().startsWith('/');
    }

    /**
     * Execute a command
     */
    async execute(input) {
        if (!this.isCommand(input)) {
            return null;
        }

        const parts = input.trim().slice(1).split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (!this.commands.has(command)) {
            return {
                success: false,
                message: `Unknown command: /${command}. Type /help for available commands.`
            };
        }

        try {
            const result = await this.commands.get(command)(args);
            this.history.push({
                command,
                args,
                result,
                timestamp: Date.now()
            });
            return result;
        } catch (error) {
            console.error('[QuickCommand] Error:', error);
            return {
                success: false,
                message: `Command failed: ${error.message}`
            };
        }
    }

    /**
     * Get command history
     */
    getHistory() {
        return this.history;
    }

    /**
     * Get available commands
     */
    getCommands() {
        return Array.from(this.commands.keys());
    }
}

export const quickCommandService = new QuickCommandService();
export default QuickCommandService;
