import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class MemoryService {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.memoryFile = path.join(dataPath, 'memory.json');
        this.preferencesFile = path.join(dataPath, 'preferences.json');
        this.conversationHistory = [];
        this.userPreferences = {};
        this.embeddings = new Map();
        this.maxHistorySize = 1000;
        this.initialized = false;
    }

    async initialize() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });

            try {
                const memoryData = await fs.readFile(this.memoryFile, 'utf-8');
                const parsed = JSON.parse(memoryData);
                this.conversationHistory = parsed.history || [];
                this.embeddings = new Map(Object.entries(parsed.embeddings || {}));
            } catch {
                this.conversationHistory = [];
                this.embeddings = new Map();
            }

            try {
                const prefsData = await fs.readFile(this.preferencesFile, 'utf-8');
                this.userPreferences = JSON.parse(prefsData);
            } catch {
                this.userPreferences = this.getDefaultPreferences();
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize memory service:', error);
            return false;
        }
    }

    getDefaultPreferences() {
        return {
            userName: '',
            greetingName: '',
            theme: 'dark',
            voiceEnabled: true,
            voiceId: 'default',
            language: 'en',
            startWithWindows: false,
            alwaysOnTop: true,
            opacity: 1.0,
            preferredPersona: 'jarvis',
            apiKeys: {
                gemini: '',
                elevenlabs: '',
                razorpay: '',
                stripe: ''
            }
        };
    }

    async save() {
        try {
            const memoryData = {
                history: this.conversationHistory,
                embeddings: Object.fromEntries(this.embeddings),
                lastSaved: Date.now()
            };

            await fs.writeFile(this.memoryFile, JSON.stringify(memoryData, null, 2));
            await fs.writeFile(this.preferencesFile, JSON.stringify(this.userPreferences, null, 2));

            return true;
        } catch (error) {
            console.error('Failed to save memory:', error);
            return false;
        }
    }

    async addEntry(entry) {
        const memoryEntry = {
            id: uuidv4(),
            timestamp: Date.now(),
            type: entry.type || 'conversation',
            userMessage: entry.userMessage,
            aiResponse: entry.aiResponse,
            persona: entry.persona,
            mood: entry.mood,
            metadata: entry.metadata || {}
        };

        this.conversationHistory.push(memoryEntry);

        if (this.conversationHistory.length > this.maxHistorySize) {
            const toRemove = this.conversationHistory.length - this.maxHistorySize;
            this.conversationHistory = this.conversationHistory.slice(toRemove);
        }

        const embedding = this.generateSimpleEmbedding(memoryEntry.userMessage);
        this.embeddings.set(memoryEntry.id, embedding);

        if (this.conversationHistory.length % 10 === 0) {
            await this.save();
        }

        return memoryEntry;
    }

    getHistory(limit = 50) {
        return this.conversationHistory.slice(-limit);
    }

    getRecentContext(messageCount = 10) {
        return this.conversationHistory.slice(-messageCount).map(entry => ({
            role: 'user',
            content: entry.userMessage,
            response: entry.aiResponse
        }));
    }

    search(query, limit = 10) {
        const queryEmbedding = this.generateSimpleEmbedding(query);
        const results = [];

        for (const entry of this.conversationHistory) {
            const entryEmbedding = this.embeddings.get(entry.id);
            if (entryEmbedding) {
                const similarity = this.cosineSimilarity(queryEmbedding, entryEmbedding);
                results.push({ entry, similarity });
            }
        }

        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, limit).map(r => r.entry);
    }

    generateSimpleEmbedding(text) {
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Array(100).fill(0);

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            for (let j = 0; j < word.length; j++) {
                const charCode = word.charCodeAt(j);
                const index = (charCode + i * 7 + j * 13) % 100;
                embedding[index] += 1;
            }
        }

        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
    }

    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        return normA > 0 && normB > 0 ? dotProduct / (normA * normB) : 0;
    }

    getUserPreferences() {
        return { ...this.userPreferences };
    }

    async setUserPreferences(prefs) {
        this.userPreferences = {
            ...this.userPreferences,
            ...prefs
        };
        await this.save();
        return this.userPreferences;
    }

    async setApiKey(service, key) {
        if (!this.userPreferences.apiKeys) {
            this.userPreferences.apiKeys = {};
        }
        this.userPreferences.apiKeys[service] = key;
        await this.save();
        return true;
    }

    getApiKey(service) {
        return this.userPreferences.apiKeys?.[service] || '';
    }

    async clearHistory() {
        this.conversationHistory = [];
        this.embeddings.clear();
        await this.save();
        return true;
    }

    async exportData() {
        return {
            history: this.conversationHistory,
            preferences: this.userPreferences,
            exportedAt: Date.now()
        };
    }

    async importData(data) {
        try {
            if (data.history) {
                this.conversationHistory = data.history;
                for (const entry of this.conversationHistory) {
                    if (entry.userMessage) {
                        const embedding = this.generateSimpleEmbedding(entry.userMessage);
                        this.embeddings.set(entry.id, embedding);
                    }
                }
            }
            if (data.preferences) {
                this.userPreferences = { ...this.getDefaultPreferences(), ...data.preferences };
            }
            await this.save();
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    getStats() {
        return {
            totalConversations: this.conversationHistory.length,
            oldestEntry: this.conversationHistory[0]?.timestamp,
            newestEntry: this.conversationHistory[this.conversationHistory.length - 1]?.timestamp,
            embeddingsCount: this.embeddings.size
        };
    }
}
