/**
 * AppStateService - Centralized state management for Nizhal AI
 * 
 * Provides a unified state system with:
 * - Zustand-backed reactive global state store
 * - Tauri store persistence and start-up synchronization
 * - IPC-based synchronization across all windows
 * - Hot-reload capability via observers
 * - Type-safe state access
 */

import { useAppStore, PersonalityMode, Emotion } from './store.js';

export { PersonalityMode, Emotion };

class AppStateService {
    constructor() {
        this.store = null;
        this.state = useAppStore.getState();
        this.observers = new Map(); // Map<path, Set<callback>>
        this.ipcMain = null;
        this.windows = new Set();
        this.initialized = false;
        this.healthStatus = 'INITIALIZING';

        // Keep local state reference in sync with Zustand store
        useAppStore.subscribe((newState) => {
            const oldState = this.state;
            this.state = newState;
            
            // Re-trigger any registered local observers when Zustand updates
            this._notifyAllObservers(newState, oldState);
        });
    }

    /**
     * Return standard health status (READY, INITIALIZING, ERROR)
     */
    status() {
        return this.healthStatus;
    }

    /**
     * Standard cleanup of all observers, listeners, and memory footprints
     */
    dispose() {
        this.observers.clear();
        this.windows.clear();
        this.initialized = false;
        this.healthStatus = 'INITIALIZING';
        console.log('[AppStateService] Disposed and resource allocation freed.');
    }

    /**
     * Standardized init setup wrapping the internal initializer
     */
    async init(ipcMain = null) {
        return this.initialize(ipcMain);
    }

    /**
     * Initialize the service and sync with the native backend store
     */
    async initialize(ipcMain = null) {
        if (this.initialized) return;

        this.ipcMain = ipcMain;
        this.healthStatus = 'INITIALIZING';

        // Setup IPC handlers if ipcMain is provided
        this._setupIPC();

        try {
            // Perform synchronization with the Rust backend
            await useAppStore.getState().syncWithBackend();
            this.initialized = true;
            this.healthStatus = 'READY';
            console.log('[AppStateService] Initialized and synchronized with backend state.');
        } catch (error) {
            this.healthStatus = 'ERROR';
            console.error('[AppStateService] Failed initialization sync with Rust backend:', error);
            throw error;
        }
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
            useAppStore.getState().batchUpdate(updates);
            this._broadcastToWindows('state:changed', { paths: Object.keys(updates), state: this.state });
            return true;
        });

        // Subscribe to state changes (uses events for updates)
        this.ipcMain.handle('state:subscribe', (event, _paths) => {
            const webContents = event.sender;
            if (!this.windows.has(webContents)) {
                this.windows.add(webContents);
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
     */
    registerWindow(window) {
        if (window && window.webContents && !window.isDestroyed()) {
            const webContents = window.webContents;
            this.windows.add(webContents);
            window.on('closed', () => {
                this.windows.delete(webContents);
            });
        }
    }

    /**
     * Get value at path (dot notation: 'ai.personalityMode')
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
     */
    getAll() {
        return { ...this.state };
    }

    /**
     * Set value at path
     */
    set(path, value, broadcast = true) {
        const oldValue = this.get(path);
        
        // Update Zustand store (which also handles Tauri/local storage persistence)
        useAppStore.getState().setPath(path, value);

        // Notify observers immediately
        this._notifyObservers(path, value, oldValue);

        // Broadcast to all windows
        if (broadcast) {
            this._broadcastToWindows('state:changed', { path, value, oldValue });
        }

        console.log(`[AppStateService] Set ${path} =`, value);
    }

    /**
     * Subscribe to state changes at path
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
     * Trigger all observers selectively by scanning for differences between old and new state
     */
    _notifyAllObservers(newState, oldState) {
        for (const path of this.observers.keys()) {
            const newVal = this.getValByPath(newState, path);
            const oldVal = this.getValByPath(oldState, path);
            if (newVal !== oldVal) {
                this._notifyObservers(path, newVal, oldVal);
            }
        }
    }

    getValByPath(stateObj, path) {
        const keys = path.split('.');
        let value = stateObj;
        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }
        return value;
    }

    /**
     * Notify all observers at path
     */
    _notifyObservers(path, newValue, oldValue) {
        if (this.observers.has(path)) {
            for (const callback of this.observers.get(path)) {
                try {
                    callback(newValue, oldValue, path);
                } catch (e) {
                    console.error('[AppStateService] Observer error:', e);
                }
            }
        }

        // Parent path observers (e.g. notify 'ai' observers when 'ai.emotion' changes)
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
        useAppStore.getState().reset();
        this._broadcastToWindows('state:reset', this.state);
    }
}

// Export singleton instance
export const appStateService = new AppStateService();
export default appStateService;
