/**
 * ConversationMemoryService - Store and retrieve conversation highlights
 * 
 * Features:
 * - Track important conversation moments
 * - Entity extraction (names, places, events)
 * - Memory highlights for recall
 * - Relationship tracking
 */

class ConversationMemoryService {
    constructor() {
        this.memories = [];
        this.entities = {
            people: new Map(),    // name -> details
            places: new Map(),    // place -> context
            events: new Map(),    // event -> date/details
            preferences: new Map() // preference -> value
        };
        this.relationships = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.memories = stored.memories || [];
                this._restoreEntities(stored.entities || {});
                this.relationships = stored.relationships || [];
            }
            this.initialized = true;
            console.log('[ConversationMemory] Loaded', this.memories.length, 'memories');
        } catch (error) {
            console.error('[ConversationMemory] Init error:', error);
        }
    }

    /**
     * Add a memory from a conversation
     */
    async addMemory(options) {
        const memory = {
            id: `mem_${Date.now()}`,
            content: options.content,
            type: options.type || 'general', // general, personal, preference, event
            importance: options.importance || 0.5, // 0-1 scale
            emotion: options.emotion || 'neutral',
            entities: options.entities || [],
            timestamp: Date.now(),
            conversationId: options.conversationId || null,
            recalled: 0 // times this memory was recalled
        };

        this.memories.push(memory);

        // Extract and store entities
        if (options.entities) {
            this._processEntities(options.entities, memory);
        }

        await this._saveToStorage();
        return memory;
    }

    /**
     * Process and store extracted entities
     */
    _processEntities(entities, memory) {
        for (const entity of entities) {
            switch (entity.type) {
                case 'person':
                    const existing = this.entities.people.get(entity.name) || { mentions: [], details: {} };
                    existing.mentions.push({ memoryId: memory.id, context: entity.context });
                    if (entity.relationship) existing.details.relationship = entity.relationship;
                    this.entities.people.set(entity.name, existing);
                    break;
                case 'place':
                    this.entities.places.set(entity.name, {
                        context: entity.context,
                        lastMentioned: memory.timestamp
                    });
                    break;
                case 'event':
                    this.entities.events.set(entity.name, {
                        date: entity.date,
                        details: entity.context,
                        memoryId: memory.id
                    });
                    break;
                case 'preference':
                    this.entities.preferences.set(entity.name, {
                        value: entity.value,
                        lastUpdated: memory.timestamp
                    });
                    break;
            }
        }
    }

    /**
     * Search memories by query
     */
    searchMemories(query, options = {}) {
        const lowerQuery = query.toLowerCase();
        const limit = options.limit || 10;
        const minImportance = options.minImportance || 0;

        return this.memories
            .filter(m =>
                m.content.toLowerCase().includes(lowerQuery) &&
                m.importance >= minImportance
            )
            .sort((a, b) => b.importance - a.importance)
            .slice(0, limit);
    }

    /**
     * Get recent memories
     */
    getRecentMemories(count = 10) {
        return this.memories
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }

    /**
     * Get important memories
     */
    getImportantMemories(count = 10) {
        return this.memories
            .filter(m => m.importance >= 0.7)
            .sort((a, b) => b.importance - a.importance)
            .slice(0, count);
    }

    /**
     * Get memories by emotion
     */
    getMemoriesByEmotion(emotion, count = 10) {
        return this.memories
            .filter(m => m.emotion === emotion)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }

    /**
     * Get information about a person
     */
    getPerson(name) {
        return this.entities.people.get(name) || null;
    }

    /**
     * Get all known people
     */
    getPeople() {
        return Array.from(this.entities.people.entries()).map(([name, data]) => ({
            name,
            ...data
        }));
    }

    /**
     * Get user preferences
     */
    getPreferences() {
        return Object.fromEntries(this.entities.preferences);
    }

    /**
     * Get a specific preference
     */
    getPreference(key) {
        return this.entities.preferences.get(key)?.value || null;
    }

    /**
     * Set a preference
     */
    async setPreference(key, value) {
        this.entities.preferences.set(key, {
            value,
            lastUpdated: Date.now()
        });
        await this._saveToStorage();
    }

    /**
     * Recall a memory (increases recall count)
     */
    async recallMemory(memoryId) {
        const memory = this.memories.find(m => m.id === memoryId);
        if (memory) {
            memory.recalled++;
            memory.lastRecalled = Date.now();
            await this._saveToStorage();
            return memory;
        }
        return null;
    }

    /**
     * Get conversation summary for context
     */
    getContextSummary() {
        const recentImportant = this.getImportantMemories(5);
        const preferences = this.getPreferences();
        const people = this.getPeople().slice(0, 5);

        return {
            keyMemories: recentImportant.map(m => m.content),
            knownPreferences: preferences,
            knownPeople: people.map(p => p.name),
            stats: {
                totalMemories: this.memories.length,
                peopleKnown: this.entities.people.size,
                preferencesKnown: this.entities.preferences.size
            }
        };
    }

    /**
     * Delete a memory
     */
    async deleteMemory(memoryId) {
        const index = this.memories.findIndex(m => m.id === memoryId);
        if (index > -1) {
            this.memories.splice(index, 1);
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Clear all memories
     */
    async clearAll() {
        this.memories = [];
        this.entities = {
            people: new Map(),
            places: new Map(),
            events: new Map(),
            preferences: new Map()
        };
        this.relationships = [];
        await this._saveToStorage();
    }

    _restoreEntities(storedEntities) {
        if (storedEntities.people) {
            this.entities.people = new Map(Object.entries(storedEntities.people));
        }
        if (storedEntities.places) {
            this.entities.places = new Map(Object.entries(storedEntities.places));
        }
        if (storedEntities.events) {
            this.entities.events = new Map(Object.entries(storedEntities.events));
        }
        if (storedEntities.preferences) {
            this.entities.preferences = new Map(Object.entries(storedEntities.preferences));
        }
    }

    _serializeEntities() {
        return {
            people: Object.fromEntries(this.entities.people),
            places: Object.fromEntries(this.entities.places),
            events: Object.fromEntries(this.entities.events),
            preferences: Object.fromEntries(this.entities.preferences)
        };
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.conversationMemory || {};
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
                    conversationMemory: {
                        memories: this.memories.slice(-500), // Keep last 500
                        entities: this._serializeEntities(),
                        relationships: this.relationships
                    }
                });
            }
        } catch (error) {
            console.error('[ConversationMemory] Save error:', error);
        }
    }
}

export const conversationMemoryService = new ConversationMemoryService();
export default ConversationMemoryService;
