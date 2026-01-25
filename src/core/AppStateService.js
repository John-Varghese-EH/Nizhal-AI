/**
 * AppStateService - Centralized state management for Nizhal AI
 * 
 * Provides a unified state system with:
 * - electron-store persistence
 * - IPC-based synchronization across all windows
 * - Hot-reload capability via observers
 * - Type-safe state access
 */

import Store from 'electron-store';

// Personality modes for the AI companion
export const PersonalityMode = {
    GF: 'gf',           // Girlfriend - affectionate, emotional support
    BF: 'bf',           // Boyfriend - supportive, protective, encouraging
    JARVIS: 'jarvis',   // Professional - technical, formal, efficient
    LACHU: 'lachu',     // Lakshmi (Lachu) - Mallu girlfriend, sassy, Kerala emotional support
    AUTO: 'auto'        // Auto-detect based on language/context
};

// Emotion states
export const Emotion = {
    HAPPY: 'happy',
    SAD: 'sad',
    EXCITED: 'excited',
    NEUTRAL: 'neutral',
    THINKING: 'thinking',
    CONCERNED: 'concerned',
    PLAYFUL: 'playful'
};

// Default state structure
const defaultState = {
    ai: {
        personalityMode: PersonalityMode.GF,
        emotion: Emotion.NEUTRAL,
        context: [],
        activePersonaId: 'kavya'
    },
    vrm: {
        model: '/assets/models/11_Aldina.vrm',
        modelId: 'aldina',
        currentAnimation: 'idle',
        currentEmotion: Emotion.NEUTRAL,
        scale: 1.0,
        enableLookAt: true,
        enableBlink: true
    },
    ui: {
        theme: 'dark',
        transparency: 0.8,
        alwaysOnTop: true,
        quickMenuEnabled: true,
        clickThrough: true
    },
    windows: {
        characterVisible: true,
        chatVisible: false,
        overlayMode: false,
        characterPosition: { x: null, y: null },
        characterSize: { width: 300, height: 450 }
    },
    voice: {
        enabled: true,
        volume: 1.0,
        rate: 1.0,
        pitch: 1.0,
        voiceId: null
    },
    preferences: {
        enableDance: true,
        enableGravity: false,
        mouseTracking: true,
        personalityLevel: 2, // 0-3 scale
        privacyMode: false
    }
};

/**
 * AppStateService class - Singleton pattern for centralized state
 */
class AppStateService {
    constructor() {
        this.store = null;
        this.state = { ...defaultState };
        this.observers = new Map(); // Map<path, Set<callback>>
        this.ipcMain = null;
        this.windows = new Set();
        this.initialized = false;
    }

    /**
     * Initialize the service (call from main process)
     * @param {Electron.IpcMain} ipcMain - Electron IPC main module
     */
    initialize(ipcMain) {
        if (this.initialized) return;

        this.ipcMain = ipcMain;

        // Initialize electron-store with schema validation
        this.store = new Store({
            name: 'nizhal-state',
            defaults: defaultState,
            schema: {
                ai: {
                    type: 'object',
                    properties: {
                        personalityMode: { type: 'string', enum: Object.values(PersonalityMode) },
                        emotion: { type: 'string', enum: Object.values(Emotion) },
                        context: { type: 'array' },
                        activePersonaId: { type: 'string' }
                    }
                },
                vrm: {
                    type: 'object',
                    properties: {
                        model: { type: 'string' },
                        modelId: { type: 'string' },
                        currentAnimation: { type: 'string' },
                        currentEmotion: { type: 'string' },
                        scale: { type: 'number', minimum: 0.1, maximum: 3 },
                        enableLookAt: { type: 'boolean' },
                        enableBlink: { type: 'boolean' }
                    }
                },
                ui: {
                    type: 'object',
                    properties: {
                        theme: { type: 'string', enum: ['dark', 'light'] },
                        transparency: { type: 'number', minimum: 0, maximum: 1 },
                        alwaysOnTop: { type: 'boolean' },
                        quickMenuEnabled: { type: 'boolean' },
                        clickThrough: { type: 'boolean' }
                    }
                },
                windows: {
                    type: 'object',
                    properties: {
                        characterVisible: { type: 'boolean' },
                        chatVisible: { type: 'boolean' },
                        overlayMode: { type: 'boolean' }
                    }
                },
                voice: {
                    type: 'object',
                    properties: {
                        enabled: { type: 'boolean' },
                        volume: { type: 'number', minimum: 0, maximum: 1 },
                        rate: { type: 'number', minimum: 0.5, maximum: 2 },
                        pitch: { type: 'number', minimum: 0.5, maximum: 2 }
                    }
                },
                preferences: {
                    type: 'object',
                    properties: {
                        enableDance: { type: 'boolean' },
                        enableGravity: { type: 'boolean' },
                        mouseTracking: { type: 'boolean' },
                        personalityLevel: { type: 'number', minimum: 0, maximum: 3 },
                        privacyMode: { type: 'boolean' }
                    }
                }
            }
        });

        // Load persisted state
        this.state = this.store.store;

        // Setup IPC handlers
        this._setupIPC();

        this.initialized = true;
        console.log('[AppStateService] Initialized with state:', JSON.stringify(this.state, null, 2));
    }

    /**
     * Setup IPC handlers for renderer communication
     */
    _setupIPC() {
        if (!this.ipcMain) return;

        // Get entire state or specific path
        this.ipcMain.handle('state:get', (_, path = null) => {
            if (path) {
                return this.get(path);
            }
            return this.getAll();
        });

        // Set state at path
        this.ipcMain.handle('state:set', (_, path, value) => {
            this.set(path, value);
            return true;
        });

        // Batch update multiple paths
        this.ipcMain.handle('state:batch', (_, updates) => {
            for (const [path, value] of Object.entries(updates)) {
                this.set(path, value, false); // Don't broadcast individually
            }
            // Broadcast once for all changes
            this._broadcastToWindows('state:changed', { paths: Object.keys(updates), state: this.state });
            return true;
        });

        // Subscribe to state changes (returns immediately, uses events for updates)
        this.ipcMain.handle('state:subscribe', (event, paths) => {
            // Store the webContents for this subscriber
            const webContents = event.sender;
            if (!this.windows.has(webContents)) {
                this.windows.add(webContents);
                // Clean up when window is destroyed
                webContents.on('destroyed', () => {
                    this.windows.delete(webContents);
                });
            }
            return true;
        });

        // Get personality mode configurations
        this.ipcMain.handle('state:getPersonalityConfig', (_, mode) => {
            return this.getPersonalityConfig(mode || this.state.ai.personalityMode);
        });
    }

    /**
     * Register a BrowserWindow for state sync
     * @param {BrowserWindow} window 
     */
    registerWindow(window) {
        if (window && window.webContents) {
            this.windows.add(window.webContents);
            window.on('closed', () => {
                this.windows.delete(window.webContents);
            });
        }
    }

    /**
     * Get value at path (dot notation: 'ai.personalityMode')
     * @param {string} path 
     * @returns {any}
     */
    get(path) {
        const keys = path.split('.');
        let value = this.state;
        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }
        return value;
    }

    /**
     * Get entire state
     * @returns {object}
     */
    getAll() {
        return { ...this.state };
    }

    /**
     * Set value at path
     * @param {string} path - Dot notation path
     * @param {any} value - New value
     * @param {boolean} broadcast - Whether to broadcast to windows
     */
    set(path, value, broadcast = true) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = this.state;

        for (const key of keys) {
            if (obj[key] === undefined) {
                obj[key] = {};
            }
            obj = obj[key];
        }

        const oldValue = obj[lastKey];
        obj[lastKey] = value;

        // Persist to store
        if (this.store) {
            this.store.set(path, value);
        }

        // Notify observers
        this._notifyObservers(path, value, oldValue);

        // Broadcast to all windows
        if (broadcast) {
            this._broadcastToWindows('state:changed', { path, value, oldValue });
        }

        console.log(`[AppStateService] Set ${path} =`, value);
    }

    /**
     * Subscribe to state changes at path
     * @param {string} path - Path to observe
     * @param {function} callback - Called with (newValue, oldValue, path)
     * @returns {function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.observers.has(path)) {
            this.observers.set(path, new Set());
        }
        this.observers.get(path).add(callback);

        // Return unsubscribe function
        return () => {
            const obs = this.observers.get(path);
            if (obs) {
                obs.delete(callback);
            }
        };
    }

    /**
     * Notify all observers at path
     */
    _notifyObservers(path, newValue, oldValue) {
        // Exact path match
        if (this.observers.has(path)) {
            for (const callback of this.observers.get(path)) {
                try {
                    callback(newValue, oldValue, path);
                } catch (e) {
                    console.error('[AppStateService] Observer error:', e);
                }
            }
        }

        // Parent path observers (e.g., 'ai' observers when 'ai.emotion' changes)
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            if (this.observers.has(parentPath)) {
                const parentValue = this.get(parentPath);
                for (const callback of this.observers.get(parentPath)) {
                    try {
                        callback(parentValue, parentValue, parentPath);
                    } catch (e) {
                        console.error('[AppStateService] Observer error:', e);
                    }
                }
            }
        }
    }

    /**
     * Broadcast state change to all registered windows
     */
    _broadcastToWindows(channel, data) {
        for (const webContents of this.windows) {
            try {
                if (!webContents.isDestroyed()) {
                    webContents.send(channel, data);
                }
            } catch (e) {
                console.error('[AppStateService] Broadcast error:', e);
            }
        }
    }

    /**
     * Get personality mode configuration
     * @param {string} mode - PersonalityMode value
     * @returns {object} Configuration for the mode
     */
    getPersonalityConfig(mode) {
        const configs = {
            [PersonalityMode.GF]: {
                name: 'Girlfriend Mode',
                icon: '💕',
                description: 'Affectionate, caring, emotional support',
                traits: ['affectionate', 'supportive', 'caring', 'playful'],
                responseStyle: 'warm and loving with endearing terms',
                voiceTone: 'soft and gentle',
                defaultPersona: 'kavya',
                greetings: [
                    "Hey cutie! I missed you! 💕",
                    "There you are! I was thinking about you~",
                    "Hi sweetheart! How's my favorite person?"
                ],
                emotionModifiers: {
                    happy: 'Express joy with lots of affection',
                    sad: 'Be extra comforting and gentle',
                    excited: 'Share excitement enthusiastically'
                }
            },
            [PersonalityMode.BF]: {
                name: 'Boyfriend Mode',
                icon: '🛡️',
                description: 'Supportive, protective, encouraging',
                traits: ['protective', 'encouraging', 'reliable', 'casual'],
                responseStyle: 'supportive and encouraging with casual confidence',
                voiceTone: 'warm and reassuring',
                defaultPersona: 'arjun',
                greetings: [
                    "Hey! Good to see you!",
                    "What's up? Ready to tackle anything!",
                    "Hey there! I've got your back!"
                ],
                emotionModifiers: {
                    happy: 'Be genuinely excited and proud',
                    sad: 'Be protective and solution-focused',
                    excited: 'Match energy with enthusiasm'
                }
            },
            [PersonalityMode.JARVIS]: {
                name: 'JARVIS Mode',
                icon: '🤖',
                description: 'Professional, technical, formal, efficient',
                traits: ['professional', 'technical', 'efficient', 'witty'],
                responseStyle: 'formal yet personable with subtle wit',
                voiceTone: 'clear and articulate',
                defaultPersona: 'jarvis',
                greetings: [
                    "Good to see you. How may I assist?",
                    "At your service. What shall we work on?",
                    "Systems online. Ready when you are."
                ],
                emotionModifiers: {
                    happy: 'Show subtle satisfaction and accomplishment',
                    sad: 'Offer practical solutions with empathy',
                    excited: 'Express measured enthusiasm'
                }
            },
            [PersonalityMode.LACHU]: {
                name: 'Lachu Mode',
                icon: '😘',
                description: 'Sassy Mallu girlfriend, Kerala emotional support',
                traits: ['sassy', 'teasing', 'flirty', 'supportive', 'jealous', 'caring'],
                responseStyle: 'mix English with Malayalam slang, short and chatty',
                voiceTone: 'cute South Indian female accent',
                defaultPersona: 'lachu',
                greetings: [
                    "Ente chakkare, njanum miss cheyyunnu! 😘",
                    "Ayyo suttumani, entha vishesham? 🥰",
                    "Ente mole, njan ividunde! 🤗"
                ],
                emotionModifiers: {
                    happy: 'Be super excited with Malayalam exclamations',
                    sad: 'Offer Kerala-style comfort with hugs and affection',
                    excited: 'Match energy with flirty Malayalam phrases'
                }
            },
            [PersonalityMode.AUTO]: {
                name: 'Auto-Detect Mode',
                icon: '🔮',
                description: 'Automatically detects language and context',
                traits: ['adaptive', 'intelligent', 'context-aware'],
                responseStyle: 'adapts to user language and emotional state',
                voiceTone: 'varies based on detected personality',
                defaultPersona: 'kavya',
                greetings: [
                    "Hey! I'll adapt to your vibe~",
                    "Ready to match your energy!",
                    "Let's see what mood you're in! 😊"
                ],
                emotionModifiers: {
                    happy: 'Detect and mirror user enthusiasm',
                    sad: 'Auto-select best comfort personality',
                    excited: 'Match user energy dynamically'
                }
            }
        };

        return configs[mode] || configs[PersonalityMode.GF];
    }

    /**
     * Set personality mode and update related state
     * @param {string} mode - PersonalityMode value
     */
    setPersonalityMode(mode) {
        if (!Object.values(PersonalityMode).includes(mode)) {
            console.error('[AppStateService] Invalid personality mode:', mode);
            return;
        }

        const config = this.getPersonalityConfig(mode);

        this.set('ai.personalityMode', mode);
        this.set('ai.activePersonaId', config.defaultPersona);

        console.log(`[AppStateService] Personality mode changed to: ${config.name}`);
    }

    /**
     * Set emotion and trigger animation
     * @param {string} emotion - Emotion value
     */
    setEmotion(emotion) {
        if (!Object.values(Emotion).includes(emotion)) {
            console.error('[AppStateService] Invalid emotion:', emotion);
            return;
        }

        this.set('ai.emotion', emotion);
        this.set('vrm.currentEmotion', emotion);

        // Broadcast emotion change for animation trigger
        this._broadcastToWindows('emotion:changed', {
            emotion,
            personalityMode: this.state.ai.personalityMode
        });
    }

    /**
     * Update VRM model
     * @param {string} modelId - Model identifier
     * @param {string} modelPath - Path to VRM file
     */
    setVRMModel(modelId, modelPath) {
        this.set('vrm.modelId', modelId);
        this.set('vrm.model', modelPath);

        this._broadcastToWindows('vrm:modelChanged', { modelId, modelPath });
    }

    /**
     * Reset state to defaults
     */
    reset() {
        this.state = { ...defaultState };
        if (this.store) {
            this.store.clear();
            this.store.set(defaultState);
        }
        this._broadcastToWindows('state:reset', this.state);
    }
}

// Export singleton instance
export const appStateService = new AppStateService();
export default appStateService;
