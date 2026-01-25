const { contextBridge, ipcRenderer } = require('electron');

const validChannels = {
    window: ['minimize', 'maximize', 'close', 'setClickThrough', 'setAlwaysOnTop', 'setOpacity', 'showChat', 'hideChat', 'moveCharacter', 'toggleDetection', 'getState'],
    character: ['show', 'hide', 'toggleAlwaysOnTop', 'snap', 'setClickThrough', 'toggleGravity', 'jump', 'setModel', 'toggleGame', 'setSize'],
    system: ['getVolume', 'setVolume', 'getBrightness', 'setBrightness', 'launchApp', 'getSystemInfo'],
    privacy: ['getMode', 'setMode'],
    persona: ['getActive', 'setActive', 'getAll', 'getState', 'updateMood'],
    memory: ['getHistory', 'search', 'addEntry', 'getUserPreferences', 'setUserPreferences'],
    ai: ['chat', 'setProvider', 'getProviders', 'getProviderStatus', 'checkLocalAI', 'setProviderOrder', 'setFallbackEnabled', 'getModels', 'setModel'],
    voice: ['speak', 'stop', 'getVoices', 'setVoice'],
    payment: ['checkout', 'verify'],
    license: ['check', 'unlock', 'getUnlocked'],
    marketplace: ['getPersonas', 'purchase', 'download'],
    // LiveKit Voice/Video APIs
    livekit: ['connect', 'disconnect', 'getStatus', 'startAgent', 'stopAgent', 'restartAgent', 'updatePersonality'],
    // Android Control
    adb: ['check', 'connect', 'disconnect', 'getDevices', 'tap', 'swipe', 'type', 'key', 'home', 'back', 'launch', 'close', 'screenshot', 'info'],
    // Onboarding & Avatar
    onboarding: ['complete'],
    avatar: ['speak'],
    app: ['getTheme', 'openExternal', 'getVersion'],
    state: ['get', 'set', 'batch', 'subscribe', 'getPersonalityConfig'],
    navigate: []
};

function createSecureApi(namespace) {
    const api = {};
    const channels = validChannels[namespace];

    if (!channels) return api;

    channels.forEach(channel => {
        api[channel] = (...args) => ipcRenderer.invoke(`${namespace}:${channel}`, ...args);
    });

    return api;
}

// Store listener references for cleanup
const listenerMap = new Map();
const stateListeners = new Map(); // For state change subscriptions

contextBridge.exposeInMainWorld('nizhal', {
    window: createSecureApi('window'),
    character: createSecureApi('character'),
    system: createSecureApi('system'),
    persona: createSecureApi('persona'),
    memory: createSecureApi('memory'),
    ai: createSecureApi('ai'),
    voice: createSecureApi('voice'),
    payment: createSecureApi('payment'),
    license: createSecureApi('license'),
    marketplace: createSecureApi('marketplace'),
    privacy: createSecureApi('privacy'),
    // LiveKit Voice/Video
    livekit: createSecureApi('livekit'),
    // Android
    adb: createSecureApi('adb'),
    // Onboarding & Avatar
    onboarding: createSecureApi('onboarding'),
    avatar: createSecureApi('avatar'),
    app: createSecureApi('app'),

    // Unified State API
    state: {
        // Get state value at path (e.g., 'ai.personalityMode')
        get: (path) => ipcRenderer.invoke('state:get', path),

        // Get entire state
        getAll: () => ipcRenderer.invoke('state:get'),

        // Set state value at path
        set: (path, value) => ipcRenderer.invoke('state:set', path, value),

        // Batch set multiple paths at once
        batch: (updates) => ipcRenderer.invoke('state:batch', updates),

        // Get personality mode configuration
        getPersonalityConfig: (mode) => ipcRenderer.invoke('state:getPersonalityConfig', mode),

        // Subscribe to state changes (returns unsubscribe function)
        subscribe: (paths, callback) => {
            // Register with main process
            ipcRenderer.invoke('state:subscribe', paths);

            // Listen for state changes
            const handler = (_, data) => {
                // Check if this change affects any of our subscribed paths
                if (paths.some(p => data.path?.startsWith(p) || data.paths?.some(dp => dp.startsWith(p)))) {
                    callback(data);
                }
            };

            ipcRenderer.on('state:changed', handler);
            stateListeners.set(callback, handler);

            // Return unsubscribe function
            return () => {
                ipcRenderer.removeListener('state:changed', handler);
                stateListeners.delete(callback);
            };
        },

        // Subscribe to emotion changes
        onEmotionChange: (callback) => {
            const handler = (_, data) => callback(data);
            ipcRenderer.on('emotion:changed', handler);
            return () => ipcRenderer.removeListener('emotion:changed', handler);
        },

        // Subscribe to VRM model changes
        onVRMChange: (callback) => {
            const handler = (_, data) => callback(data);
            ipcRenderer.on('vrm:modelChanged', handler);
            return () => ipcRenderer.removeListener('vrm:modelChanged', handler);
        },

        // Subscribe to state reset
        onReset: (callback) => {
            const handler = (_, state) => callback(state);
            ipcRenderer.on('state:reset', handler);
            return () => ipcRenderer.removeListener('state:reset', handler);
        }
    },

    platform: process.platform,

    // Generic invoke for any channel
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

    // Event listeners for character window
    on: (channel, callback) => {
        const handler = (_, ...args) => callback(...args);
        ipcRenderer.on(channel, handler);
        listenerMap.set(callback, { channel, handler });
        return () => {
            ipcRenderer.removeListener(channel, handler);
            listenerMap.delete(callback);
        };
    },

    off: (channel, callback) => {
        const entry = listenerMap.get(callback);
        if (entry) {
            ipcRenderer.removeListener(entry.channel, entry.handler);
            listenerMap.delete(callback);
        }
    },

    // Legacy event listeners
    onThemeChange: (callback) => {
        const handler = (_, theme) => callback(theme);
        ipcRenderer.on('theme-changed', handler);
        return () => ipcRenderer.removeListener('theme-changed', handler);
    },

    onPersonaChange: (callback) => {
        const handler = (_, persona) => callback(persona);
        ipcRenderer.on('persona-changed', handler);
        return () => ipcRenderer.removeListener('persona-changed', handler);
    },

    onMoodChange: (callback) => {
        const handler = (_, mood) => callback(mood);
        ipcRenderer.on('mood-changed', handler);
        return () => ipcRenderer.removeListener('mood-changed', handler);
    },

    // Window ready event
    onWindowReady: (callback) => {
        const handler = (_, windowType) => callback(windowType);
        ipcRenderer.on('window:ready', handler);
        return () => ipcRenderer.removeListener('window:ready', handler);
    },

    // Navigation event for chat window
    onNavigate: (callback) => {
        const handler = (_, route) => callback(route);
        ipcRenderer.on('navigate', handler);
        return () => ipcRenderer.removeListener('navigate', handler);
    }
});