/**
 * QuickNotesService - Floating sticky notes
 * 
 * Provides quick note-taking functionality with
 * color coding, pinning, and search.
 */

class QuickNotesService {
    constructor() {
        this.notes = [];
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.notes = stored;
            }
            this.initialized = true;
            console.log('[QuickNotes] Loaded', this.notes.length, 'notes');
        } catch (error) {
            console.error('[QuickNotes] Init error:', error);
        }
    }

    /**
     * Create a new note
     */
    async createNote(options = {}) {
        const note = {
            id: `note_${Date.now()}`,
            content: options.content || '',
            title: options.title || '',
            color: options.color || 'yellow',
            isPinned: options.isPinned || false,
            position: options.position || { x: 100, y: 100 },
            size: options.size || { width: 200, height: 200 },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: options.tags || []
        };

        this.notes.unshift(note);
        await this._saveToStorage();
        return note;
    }

    /**
     * Update a note
     */
    async updateNote(id, updates) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            Object.assign(note, updates, { updatedAt: Date.now() });
            await this._saveToStorage();
            return note;
        }
        return null;
    }

    /**
     * Delete a note
     */
    async deleteNote(id) {
        const index = this.notes.findIndex(n => n.id === id);
        if (index > -1) {
            this.notes.splice(index, 1);
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Get all notes
     */
    getNotes() {
        return [...this.notes].sort((a, b) => {
            // Pinned first, then by update time
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.updatedAt - a.updatedAt;
        });
    }

    /**
     * Get pinned notes
     */
    getPinnedNotes() {
        return this.notes.filter(n => n.isPinned);
    }

    /**
     * Toggle pin status
     */
    async togglePin(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.isPinned = !note.isPinned;
            note.updatedAt = Date.now();
            await this._saveToStorage();
            return note;
        }
        return null;
    }

    /**
     * Search notes
     */
    search(query) {
        if (!query) return this.getNotes();
        const lowerQuery = query.toLowerCase();
        return this.notes.filter(n =>
            n.content.toLowerCase().includes(lowerQuery) ||
            n.title.toLowerCase().includes(lowerQuery) ||
            n.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Get note colors
     */
    getColors() {
        return [
            { id: 'yellow', bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
            { id: 'pink', bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
            { id: 'blue', bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
            { id: 'green', bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
            { id: 'purple', bg: '#EDE9FE', border: '#8B5CF6', text: '#5B21B6' },
            { id: 'orange', bg: '#FFEDD5', border: '#F97316', text: '#9A3412' }
        ];
    }

    /**
     * Get color styles
     */
    getColorStyle(colorId) {
        return this.getColors().find(c => c.id === colorId) || this.getColors()[0];
    }

    /**
     * Export notes
     */
    exportNotes() {
        return JSON.stringify({
            exportDate: new Date().toISOString(),
            notes: this.notes
        }, null, 2);
    }

    /**
     * Import notes
     */
    async importNotes(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.notes && Array.isArray(data.notes)) {
                this.notes = [...this.notes, ...data.notes];
                await this._saveToStorage();
                return data.notes.length;
            }
            return 0;
        } catch {
            return 0;
        }
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.quickNotes || [];
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
                    quickNotes: this.notes.slice(0, 100)
                });
            }
        } catch (error) {
            console.error('[QuickNotes] Save error:', error);
        }
    }
}

export const quickNotesService = new QuickNotesService();
export default QuickNotesService;
