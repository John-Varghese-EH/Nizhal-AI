const { contextBridge, ipcRenderer } = require('electron');

const validChannels = {
    window: ['minimize', 'maximize', 'close', 'setClickThrough', 'setAlwaysOnTop', 'setOpacity', 'showChat', 'hideChat', 'moveCharacter', 'toggleDetection'],
    character: ['show', 'hide', 'toggleAlwaysOnTop', 'snap', 'setClickThrough', 'toggleGravity', 'jump', 'setModel'],
    system: ['getVolume', 'setVolume', 'getBrightness', 'setBrightness', 'launchApp', 'getSystemInfo'],
    persona: ['getActive', 'setActive', 'getAll', 'getState', 'updateMood'],
    memory: ['getHistory', 'search', 'addEntry', 'getUserPreferences', 'setUserPreferences'],
    ai: ['chat', 'setProvider', 'getProviders', 'getProviderStatus', 'checkLocalAI', 'setProviderOrder', 'setFallbackEnabled', 'getModels'],
    voice: ['speak', 'stop', 'getVoices', 'setVoice'],
    payment: ['checkout', 'verify'],
    license: ['check', 'unlock', 'getUnlocked'],
    marketplace: ['getPersonas', 'purchase', 'download'],
    app: ['getTheme', 'openExternal', 'getVersion'],
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
    app: createSecureApi('app'),

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
