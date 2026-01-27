/**
 * KeyboardShortcutsService - Manage keyboard shortcuts
 * 
 * Provides a central registry for keyboard shortcuts with
 * customization and conflict detection.
 */

class KeyboardShortcutsService {
    constructor() {
        this.shortcuts = new Map();
        this.customBindings = {};
        this.initialized = false;
        this.enabled = true;
    }

    async initialize() {
        if (this.initialized) return;

        // Load custom bindings from storage
        const stored = await this._loadFromStorage();
        if (stored) {
            this.customBindings = stored;
        }

        // Register default shortcuts
        this._registerDefaults();

        // Set up global listener
        this._setupGlobalListener();

        this.initialized = true;
        console.log('[Shortcuts] Initialized with', this.shortcuts.size, 'shortcuts');
    }

    /**
     * Register default shortcuts
     */
    _registerDefaults() {
        const defaults = [
            // General
            { id: 'toggle_settings', keys: 'Ctrl+,', description: 'Open Settings', category: 'general' },
            { id: 'toggle_chat', keys: 'Ctrl+Enter', description: 'Focus Chat Input', category: 'general' },
            { id: 'quick_notes', keys: 'Ctrl+N', description: 'Open Quick Notes', category: 'general' },
            { id: 'toggle_voice', keys: 'Ctrl+M', description: 'Toggle Voice Input', category: 'voice' },

            // Navigation
            { id: 'nav_chat', keys: 'Ctrl+1', description: 'Go to Chat', category: 'navigation' },
            { id: 'nav_life', keys: 'Ctrl+2', description: 'Go to Life', category: 'navigation' },
            { id: 'nav_android', keys: 'Ctrl+3', description: 'Go to Android', category: 'navigation' },
            { id: 'nav_settings', keys: 'Ctrl+4', description: 'Go to Settings', category: 'navigation' },

            // Avatar
            { id: 'avatar_emotion_happy', keys: 'Alt+1', description: 'Set Happy Emotion', category: 'avatar' },
            { id: 'avatar_emotion_sad', keys: 'Alt+2', description: 'Set Sad Emotion', category: 'avatar' },
            { id: 'avatar_emotion_neutral', keys: 'Alt+3', description: 'Set Neutral Emotion', category: 'avatar' },
            { id: 'avatar_wave', keys: 'Alt+W', description: 'Wave Animation', category: 'avatar' },

            // Focus Mode
            { id: 'start_focus', keys: 'Ctrl+F', description: 'Start Focus Timer', category: 'productivity' },
            { id: 'stop_focus', keys: 'Ctrl+Shift+F', description: 'Stop Focus Timer', category: 'productivity' },

            // Quick Actions
            { id: 'quick_command', keys: 'Ctrl+K', description: 'Open Command Palette', category: 'general' },
            { id: 'screenshot', keys: 'Ctrl+Shift+S', description: 'Take Screenshot', category: 'general' },
            { id: 'toggle_privacy', keys: 'Ctrl+P', description: 'Toggle Privacy Mode', category: 'general' },
        ];

        defaults.forEach(shortcut => {
            this.register(shortcut.id, {
                ...shortcut,
                keys: this.customBindings[shortcut.id] || shortcut.keys
            });
        });
    }

    /**
     * Register a shortcut
     */
    register(id, config) {
        this.shortcuts.set(id, {
            id,
            keys: config.keys,
            description: config.description,
            category: config.category || 'general',
            callback: config.callback || null,
            enabled: true
        });
    }

    /**
     * Set callback for a shortcut
     */
    setCallback(id, callback) {
        const shortcut = this.shortcuts.get(id);
        if (shortcut) {
            shortcut.callback = callback;
        }
    }

    /**
     * Customize a shortcut
     */
    async customize(id, newKeys) {
        const shortcut = this.shortcuts.get(id);
        if (shortcut) {
            // Check for conflicts
            const conflict = this.findConflict(newKeys, id);
            if (conflict) {
                return { success: false, conflict };
            }

            shortcut.keys = newKeys;
            this.customBindings[id] = newKeys;
            await this._saveToStorage();
            return { success: true };
        }
        return { success: false, error: 'Shortcut not found' };
    }

    /**
     * Reset a shortcut to default
     */
    async resetToDefault(id) {
        const defaults = this._getDefaultKey(id);
        if (defaults) {
            const shortcut = this.shortcuts.get(id);
            if (shortcut) {
                shortcut.keys = defaults;
                delete this.customBindings[id];
                await this._saveToStorage();
                return true;
            }
        }
        return false;
    }

    /**
     * Find conflicting shortcut
     */
    findConflict(keys, excludeId = null) {
        for (const [id, shortcut] of this.shortcuts) {
            if (id !== excludeId && shortcut.keys.toLowerCase() === keys.toLowerCase()) {
                return shortcut;
            }
        }
        return null;
    }

    /**
     * Get all shortcuts
     */
    getAll() {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Get shortcuts by category
     */
    getByCategory(category) {
        return this.getAll().filter(s => s.category === category);
    }

    /**
     * Get categories
     */
    getCategories() {
        const categories = new Set();
        this.shortcuts.forEach(s => categories.add(s.category));
        return Array.from(categories);
    }

    /**
     * Parse key string into components
     */
    parseKeys(keyString) {
        const parts = keyString.split('+').map(p => p.trim().toLowerCase());
        return {
            ctrl: parts.includes('ctrl') || parts.includes('control'),
            alt: parts.includes('alt'),
            shift: parts.includes('shift'),
            meta: parts.includes('meta') || parts.includes('cmd'),
            key: parts[parts.length - 1]
        };
    }

    /**
     * Check if event matches shortcut
     */
    matchesEvent(shortcut, event) {
        const parsed = this.parseKeys(shortcut.keys);
        return (
            event.ctrlKey === parsed.ctrl &&
            event.altKey === parsed.alt &&
            event.shiftKey === parsed.shift &&
            event.metaKey === parsed.meta &&
            event.key.toLowerCase() === parsed.key
        );
    }

    /**
     * Set up global keyboard listener
     */
    _setupGlobalListener() {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (event) => {
            if (!this.enabled) return;

            // Don't trigger in input fields
            if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
                return;
            }

            for (const shortcut of this.shortcuts.values()) {
                if (shortcut.enabled && shortcut.callback && this.matchesEvent(shortcut, event)) {
                    event.preventDefault();
                    shortcut.callback();
                    break;
                }
            }
        });
    }

    /**
     * Enable/disable all shortcuts
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Get default key for shortcut
     */
    _getDefaultKey(id) {
        const defaults = {
            'toggle_settings': 'Ctrl+,',
            'toggle_chat': 'Ctrl+Enter',
            'quick_notes': 'Ctrl+N',
            'toggle_voice': 'Ctrl+M'
        };
        return defaults[id];
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.keyboardShortcuts || {};
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
                    keyboardShortcuts: this.customBindings
                });
            }
        } catch (error) {
            console.error('[Shortcuts] Save error:', error);
        }
    }
}

export const keyboardShortcutsService = new KeyboardShortcutsService();
export default KeyboardShortcutsService;
