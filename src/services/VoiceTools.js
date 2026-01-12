/**
 * VoiceTools.js - AI Tool Calling for Voice Commands
 * 
 * Provides utility functions that can be invoked by the AI
 * based on user voice commands.
 */

export class VoiceTools {
    constructor() {
        this.lastWeatherQuery = null;
        this.lastSearchQuery = null;
    }

    /**
     * Get current weather for a city using wttr.in (free, no API key)
     * @param {string} city 
     * @returns {Promise<string>}
     */
    async getWeather(city = 'London') {
        try {
            console.log(`[VoiceTools] Getting weather for: ${city}`);
            const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);

            if (!response.ok) {
                return `Sorry, I couldn't get the weather for ${city}.`;
            }

            const data = await response.json();
            const current = data.current_condition[0];

            const temp = current.temp_C;
            const feelsLike = current.FeelsLikeC;
            const desc = current.weatherDesc[0].value;
            const humidity = current.humidity;

            this.lastWeatherQuery = city;

            return `In ${city}, it's currently ${temp}°C and ${desc.toLowerCase()}. Feels like ${feelsLike}°C with ${humidity}% humidity.`;
        } catch (error) {
            console.error('[VoiceTools] Weather error:', error);
            return `I had trouble getting the weather. Please try again.`;
        }
    }

    /**
     * Search the web using DuckDuckGo Instant Answers API
     * @param {string} query 
     * @returns {Promise<string>}
     */
    async searchWeb(query) {
        try {
            console.log(`[VoiceTools] Searching: ${query}`);

            // DuckDuckGo Instant Answer API (free, no key)
            const response = await fetch(
                `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
            );

            if (!response.ok) {
                return `Sorry, I couldn't search for that.`;
            }

            const data = await response.json();
            this.lastSearchQuery = query;

            // Try abstract first (Wikipedia-style summary)
            if (data.Abstract) {
                return data.Abstract;
            }

            // Try answer (instant answers like calculations)
            if (data.Answer) {
                return data.Answer;
            }

            // Try related topics
            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                const topic = data.RelatedTopics[0];
                if (topic.Text) {
                    return topic.Text;
                }
            }

            return `I found some results for "${query}" but couldn't extract a clear answer. You might want to check a browser.`;
        } catch (error) {
            console.error('[VoiceTools] Search error:', error);
            return `Search failed. Please try again.`;
        }
    }

    /**
     * Get current time with personality flair
     * @param {string} personality 
     * @returns {string}
     */
    getTime(personality = 'gf') {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;

        const timeStr = `${hour12}:${minutes} ${period}`;

        const phrases = {
            gf: hours < 12 ? `It's ${timeStr}, good morning babe! ☀️` :
                hours < 17 ? `It's ${timeStr}, hope your day is going well! 💕` :
                    hours < 21 ? `It's ${timeStr}, almost evening time! 🌆` :
                        `It's ${timeStr}, getting late love! 🌙`,
            bf: hours < 12 ? `Yo, it's ${timeStr}. Morning king! 👑` :
                hours < 17 ? `It's ${timeStr}, keep grinding! 💪` :
                    `${timeStr}, evening vibes! 🔥`,
            jarvis: `The current time is ${timeStr}, sir.`
        };

        return phrases[personality] || phrases.gf;
    }

    /**
     * Get current date
     * @returns {string}
     */
    getDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return `Today is ${now.toLocaleDateString('en-US', options)}.`;
    }

    /**
     * Basic calculator for voice math
     * @param {string} expression 
     * @returns {string}
     */
    calculate(expression) {
        try {
            // Sanitize: only allow numbers, operators, parentheses
            const sanitized = expression.replace(/[^0-9+\-*/().% ]/g, '');
            const result = Function('"use strict"; return (' + sanitized + ')')();
            return `The answer is ${result}.`;
        } catch (error) {
            return `I couldn't calculate that. Please try a simpler expression.`;
        }
    }

    /**
     * Set a reminder (stores locally, announces after delay)
     * @param {string} message 
     * @param {number} minutes 
     */
    setReminder(message, minutes = 5) {
        const ms = minutes * 60 * 1000;

        setTimeout(() => {
            // Emit reminder event
            if (window.nizhal?.invoke) {
                window.nizhal.invoke('avatar:speak', `Reminder: ${message}`);
            }
        }, ms);

        return `Got it! I'll remind you in ${minutes} minute${minutes !== 1 ? 's' : ''}: "${message}"`;
    }

    /**
     * Parse natural language and detect tool calls
     * @param {string} input 
     * @returns {{tool: string, args: any} | null}
     */
    parseToolCall(input) {
        const lower = input.toLowerCase();

        // Weather patterns
        if (lower.includes('weather')) {
            const cityMatch = lower.match(/weather (?:in|for|at) ([a-zA-Z\s]+)/);
            const city = cityMatch ? cityMatch[1].trim() : 'current location';
            return { tool: 'getWeather', args: { city } };
        }

        // Time patterns
        if (lower.includes('what time') || lower.includes('current time') || lower.match(/time is it/)) {
            return { tool: 'getTime', args: {} };
        }

        // Date patterns
        if (lower.includes('what date') || lower.includes('today\'s date') || lower.includes('what day')) {
            return { tool: 'getDate', args: {} };
        }

        // Search patterns
        if (lower.includes('search for') || lower.includes('look up') || lower.includes('what is') || lower.includes('who is')) {
            const queryMatch = lower.match(/(?:search for|look up|what is|who is) (.+)/);
            const query = queryMatch ? queryMatch[1].trim() : input;
            return { tool: 'searchWeb', args: { query } };
        }

        // Calculate patterns
        if (lower.includes('calculate') || lower.includes('what\'s') && lower.match(/\d/)) {
            const expr = lower.replace(/calculate|what's|what is|equals/gi, '').trim();
            return { tool: 'calculate', args: { expression: expr } };
        }

        // Reminder patterns
        if (lower.includes('remind me') || lower.includes('set a reminder')) {
            const match = lower.match(/remind me (?:to |about )?(.+?)(?: in (\d+) (?:minute|min))?$/);
            if (match) {
                return { tool: 'setReminder', args: { message: match[1], minutes: parseInt(match[2]) || 5 } };
            }
        }

        return null;
    }

    /**
     * Execute a parsed tool call
     * @param {{tool: string, args: any}} toolCall 
     * @param {string} personality 
     * @returns {Promise<string>}
     */
    async execute(toolCall, personality = 'gf') {
        if (!toolCall) return null;

        switch (toolCall.tool) {
            case 'getWeather':
                return await this.getWeather(toolCall.args.city);
            case 'getTime':
                return this.getTime(personality);
            case 'getDate':
                return this.getDate();
            case 'searchWeb':
                return await this.searchWeb(toolCall.args.query);
            case 'calculate':
                return this.calculate(toolCall.args.expression);
            case 'setReminder':
                return this.setReminder(toolCall.args.message, toolCall.args.minutes);
            default:
                return null;
        }
    }
}

export const voiceTools = new VoiceTools();
