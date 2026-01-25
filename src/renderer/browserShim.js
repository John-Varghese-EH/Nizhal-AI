/**
 * browserShim.js
 * Provides mock Electron APIs when running in browser mode
 */

// Check if running in Electron
const isElectron = !!window?.nizhal;

// Mock API for browser mode
const mockAPI = {
    window: {
        minimize: async () => console.log('[Browser] minimize not available'),
        maximize: async () => {
            console.log('[Browser] maximize not available');
            return false;
        },
        close: async () => window.close(),
        getState: async () => ({ isMaximized: false, isVisible: true }),
        showChat: async () => console.log('[Browser] showChat'),
        hideChat: async () => console.log('[Browser] hideChat'),
    },
    persona: {
        getActive: async () => ({ id: 'gf', name: 'Girlfriend', displayName: 'Your AI Companion' }),
        setActive: async (id) => {
            console.log('[Browser] Set persona:', id);
            return { success: true };
        },
        getAll: async () => [
            { id: 'gf', name: 'Girlfriend', displayName: 'Girlfriend Mode' },
            { id: 'bf', name: 'Boyfriend', displayName: 'Boyfriend Mode' },
            { id: 'jarvis', name: 'JARVIS', displayName: 'JARVIS Mode' },
            { id: 'lachu', name: 'Lakshmi', displayName: 'Lachu Mode' }
        ],
        getState: async () => ({ mood: 'neutral', emotion: 'calm' }),
        updateMood: async (mood) => console.log('[Browser] Update mood:', mood),
    },
    memory: {
        getHistory: async (limit) => {
            console.log('[Browser] Get history:', limit);
            return [];
        },
        search: async (query) => {
            console.log('[Browser] Search:', query);
            return [];
        },
        addEntry: async (entry) => console.log('[Browser] Add entry:', entry),
        getUserPreferences: async () => ({
            voiceEnabled: false,
            geminiApiKey: '',
            privacyMode: false
        }),
        setUserPreferences: async (prefs) => {
            console.log('[Browser] Set preferences:', prefs);
            localStorage.setItem('nizhal_prefs', JSON.stringify(prefs));
        },
    },
    ai: {
        chat: async (message) => {
            console.log('[Browser] Chat:', message);
            return {
                success: true,
                response: '🌐 Browser Mode Active\n\nNizhal AI is running in web browser mode. Features are limited:\n\n✅ Available:\n- Chat interface\n- Slash commands (/help)\n- Personality switching\n\n❌ Not Available:\n- Voice/video calls (LiveKit)\n- Desktop integration\n- Full AI responses\n\n💡 For full features, run the Electron desktop app!'
            };
        },
        setProvider: async (provider) => console.log('[Browser] Set provider:', provider),
        getProviders: async () => [],
        getProviderStatus: async () => ({ status: 'browser-mode' }),
    },
    voice: {
        speak: async (text) => console.log('[Browser] Speak:', text),
        stop: async () => console.log('[Browser] Stop voice'),
        getVoices: async () => [],
        setVoice: async (voice) => console.log('[Browser] Set voice:', voice),
    },
    livekit: {
        connect: async (userName) => {
            console.log('[Browser] LiveKit connect:', userName);
            return {
                success: false,
                error: 'LiveKit not available in browser mode. Please use the desktop app.'
            };
        },
        disconnect: async () => console.log('[Browser] LiveKit disconnect'),
        getStatus: async () => ({ configured: false }),
    },
    privacy: {
        getMode: async () => false,
        setMode: async (enabled) => console.log('[Browser] Privacy mode:', enabled),
    },
    app: {
        getTheme: async () => 'dark',
        openExternal: async (url) => window.open(url, '_blank'),
        getVersion: async () => '1.0.0-browser',
    },
    state: {
        get: async (path) => null,
        set: async (path, value) => console.log('[Browser] State set:', path, value),
    },
    // Event listeners
    onPersonaChange: (callback) => {
        console.log('[Browser] onPersonaChange registered');
        return () => { }; // unsubscribe
    },
    onMoodChange: (callback) => {
        console.log('[Browser] onMoodChange registered');
        return () => { };
    },
    on: (event, callback) => {
        console.log('[Browser] Event listener:', event);
        return () => { };
    },
};

// Inject mock API if not in Electron
if (!isElectron) {
    console.log('🌐 Running in browser mode - using mock Electron APIs');
    window.nizhal = mockAPI;
}

export default mockAPI;
