/**
 * tauri.js — Centralized Tauri API Wrapper
 *
 * Replaces all `window.nizhal.*` calls in the Nizhal AI frontend.
 * Every component should import from this module instead of using
 * `window.nizhal` or ipcRenderer directly.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow, WebviewWindow } from '@tauri-apps/api/webviewWindow';

// Detect if running in Tauri
export const isTauri = !!(window && window.__TAURI_INTERNALS__);

// ─── AI ─────────────────────────────────────────────────────────────────
export const ai = {
    chat: (message) => invoke('chat', { message }),
    streamChat: (message) => invoke('stream_chat', { message }),
    getProviders: () => invoke('get_providers'),
    setProvider: (provider, config) => invoke('set_provider', { provider, config }),
    getProviderStatus: () => invoke('get_provider_status'),
    getModels: () => invoke('get_models'),
    setModel: (provider, model) => invoke('set_model', { provider, model }),
    getEphemeralToken: () => invoke('get_ephemeral_token'),
    clearContext: () => invoke('clear_context'),
    checkLocalAI: async () => {
        try {
            const resp = await fetch('http://localhost:11434/api/tags');
            return resp.ok;
        } catch {
            return false;
        }
    },
};

// ─── Settings ───────────────────────────────────────────────────────────
export const settings = {
    get: (category, key) => invoke('get_setting', { category, key }),
    set: (category, key, value) => invoke('set_setting', { category, key, value }),
    getCategory: (category) => invoke('get_setting', { category, key: null }),
    setCategory: (category, settings) => invoke('set_setting', { category, key: '__category', value: settings }),
    getSchema: () => invoke('get_all_settings'),
    getAll: () => invoke('get_all_settings'),
    export: () => invoke('export_settings'),
    import: (data) => invoke('import_settings', { data }),
    reset: (category) => invoke('reset_settings', { category }),
    getSummary: () => invoke('get_all_settings'),
    search: (query) => invoke('get_all_settings'), // Full-text search not in Rust yet
    addListener: () => null, // Will use Tauri events instead
};

// ─── Persona ────────────────────────────────────────────────────────────
export const persona = {
    getActive: () => invoke('get_active_persona'),
    setActive: (personaId) => invoke('set_active_persona', { personaId }),
    getAll: () => invoke('get_all_personas'),
    getState: () => invoke('get_persona_state'),
    updateMood: (mood) => invoke('update_mood', { mood }),
    getPersonalityConfig: (mode) => invoke('get_personality_config', { mode }),
};

// ─── Memory ─────────────────────────────────────────────────────────────
export const memory = {
    getHistory: (limit) => invoke('get_history', { limit }),
    search: (query) => invoke('search_memory', { query }),
    addEntry: (entry) => invoke('add_entry', { entry }),
    getUserPreferences: () => invoke('get_user_preferences'),
    setUserPreferences: (prefs) => invoke('set_user_preferences', { prefs }),
};

// ─── Privacy ────────────────────────────────────────────────────────────
export const privacy = {
    getMode: () => invoke('get_privacy_mode'),
    setMode: (enabled) => invoke('set_privacy_mode', { enabled }),
};

// ─── System ─────────────────────────────────────────────────────────────
export const system = {
    getSystemInfo: () => invoke('get_system_info'),
    getStats: () => invoke('get_system_stats'),
    getPerformanceMode: () => invoke('get_performance_mode'),
    getVolume: async () => 50, // Not available natively in Tauri
    setVolume: async () => {},
    getBrightness: async () => 100,
    setBrightness: async () => {},
    launchApp: async () => {},
};

// ─── Window Controls ────────────────────────────────────────────────────
export const windowControls = {
    minimize: () => invoke('minimize_window'),
    maximize: () => invoke('maximize_window'),
    close: () => invoke('close_window'),
    showChat: async () => {
        try {
            const mainWindow = await WebviewWindow.getByLabel('main');
            if (mainWindow) {
                await mainWindow.show();
                await mainWindow.setFocus();
            }
        } catch(e) {
            console.warn('[WindowControls] Failed to show chat window:', e);
        }
    },
    hideChat: () => invoke('hide_chat_window'),
    getState: () => invoke('get_window_state'),
    moveCharacter: (deltaX, deltaY) => invoke('set_character_position', { x: deltaX, y: deltaY }),
    startDragging: () => getCurrentWebviewWindow().startDragging(),
    toggleDetection: async () => true,
    getCharacterPosition: () => invoke('get_character_position'),
    getMonitors: () => invoke('get_available_monitors'),
    setMonitor: (monitorName) => invoke('set_character_monitor', { monitorName }),
};

// ─── Character ──────────────────────────────────────────────────────────
export const character = {
    show: () => invoke('show_character_window'),
    hide: () => invoke('hide_character_window'),
    toggleAlwaysOnTop: () => invoke('toggle_character_always_on_top'),
    snap: (position) => invoke('snap_character', { position }),
    setClickThrough: (enable) => invoke('set_character_click_through', { enable }),
    setModel: (modelId) => {
        // Also emit event for character window
        emit('vrm:modelChanged', modelId);
        return Promise.resolve(modelId);
    },
    toggleGravity: async () => false,
    jump: async () => {},
    toggleGame: async () => false,
    setSize: (width, height) => invoke('set_character_size', { width, height }),
    setPosition: (x, y) => invoke('set_character_position', { x, y }),
    getPosition: () => invoke('get_character_position'),
    create: () => invoke('create_character_window'),
};

// ─── App ────────────────────────────────────────────────────────────────
export const app = {
    getTheme: () => invoke('get_app_theme'),
    openExternal: (url) => invoke('open_external_url', { url }),
    getVersion: () => invoke('get_app_version'),
};

// ─── Environment ────────────────────────────────────────────────────────
export const env = {
    getAll: () => invoke('get_all_env'),
    set: (key, value) => invoke('set_env', { key, value }),
    delete: (key) => invoke('delete_env', { key }),
};

// ─── LiveKit ────────────────────────────────────────────────────────────
export const livekit = {
    connect: (userName, roomName) => invoke('livekit_connect', { userName, roomName }),
    disconnect: () => invoke('livekit_disconnect'),
    getStatus: () => invoke('livekit_get_status'),
    startAgent: (personality, roomName) => invoke('livekit_start_agent', { personality, roomName }),
    stopAgent: () => invoke('livekit_stop_agent'),
    restartAgent: (personality) => invoke('livekit_stop_agent').then(() => invoke('livekit_start_agent', { personality })),
    updatePersonality: (personality) => invoke('livekit_start_agent', { personality }),
};

// ─── Voice (browser-side, no IPC needed) ────────────────────────────────
export const voice = {
    speak: async (text, options) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            if (options?.voice) utterance.voice = options.voice;
            if (options?.rate) utterance.rate = options.rate;
            if (options?.pitch) utterance.pitch = options.pitch;
            window.speechSynthesis.speak(utterance);
        }
    },
    stop: async () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    },
    getVoices: async () => {
        if ('speechSynthesis' in window) {
            return window.speechSynthesis.getVoices();
        }
        return [];
    },
    setVoice: async () => {},
};

// ─── ADB (Android Control) ─────────────────────────────────────────────
// ADB commands run through shell plugin - stub for now
export const adb = {
    check: async () => false,
    connect: async () => ({ success: false }),
    disconnect: async () => {},
    getDevices: async () => [],
    tap: async () => {},
    swipe: async () => {},
    type: async () => {},
    key: async () => {},
    home: async () => {},
    back: async () => {},
    launch: async () => {},
    close: async () => {},
    screenshot: async () => ({ success: false }),
    info: async () => ({}),
};

// ─── Onboarding ─────────────────────────────────────────────────────────
export const onboarding = {
    complete: async (data) => {
        const prefs = await memory.getUserPreferences();
        await memory.setUserPreferences({
            ...prefs,
            onboarding_complete: true,
            onboardingComplete: true,
            onboardingData: data,
        });
        return true;
    },
};

// ─── Avatar ─────────────────────────────────────────────────────────────
export const avatar = {
    speak: (message) => emit('avatar:speak', message),
};

// ─── State ──────────────────────────────────────────────────────────────
export const state = {
    get: async (path) => {
        // Map to appropriate invoke
        if (path === 'ai.activePersonaId') {
            const p = await persona.getActive();
            return p?.id;
        }
        return null;
    },
    set: async (path, value) => {
        if (path === 'vrm.modelId') {
            await emit('vrm:modelChanged', value);
        }
    },
    getAll: async () => ({}),
    batch: async () => {},
    subscribe: (paths, callback) => {
        // Use Tauri events for state change subscriptions
        const unlisteners = [];
        listen('state:changed', (event) => {
            callback(event.payload);
        }).then(ul => unlisteners.push(ul));

        return () => unlisteners.forEach(ul => ul());
    },
    getPersonalityConfig: (mode) => persona.getPersonalityConfig(mode),
    onEmotionChange: (callback) => {
        let unlisten;
        listen('emotion:changed', (e) => callback(e.payload)).then(ul => { unlisten = ul; });
        return () => unlisten?.();
    },
    onVRMChange: (callback) => {
        let unlisten;
        listen('vrm:modelChanged', (e) => callback(e.payload)).then(ul => { unlisten = ul; });
        return () => unlisten?.();
    },
    onReset: (callback) => {
        let unlisten;
        listen('state:reset', (e) => callback(e.payload)).then(ul => { unlisten = ul; });
        return () => unlisten?.();
    },
};

// ─── Streaming Events ───────────────────────────────────────────────────
export const onStreamChunk = (callback) => listen('ai-stream-chunk', (e) => callback(e.payload));
export const onStreamDone = (callback) => listen('ai-stream-done', (e) => callback(e.payload));

// ─── Event Listeners (generic) ──────────────────────────────────────────
export const events = {
    listen,
    emit,
    on: (channel, callback) => {
        let unlisten;
        listen(channel, (e) => callback(e.payload)).then(ul => { unlisten = ul; });
        return () => unlisten?.();
    },
};

// ─── Legacy Compatibility ───────────────────────────────────────────────
// These mirror the old `window.nizhal` event listeners
export const onPersonaChange = (callback) => {
    let unlisten;
    listen('persona-changed', (e) => callback(e.payload)).then(ul => { unlisten = ul; });
    return () => unlisten?.();
};

export const onMoodChange = (callback) => {
    let unlisten;
    listen('mood-changed', (e) => callback(e.payload)).then(ul => { unlisten = ul; });
    return () => unlisten?.();
};

export const onThemeChange = (callback) => {
    let unlisten;
    listen('theme-changed', (e) => callback(e.payload)).then(ul => { unlisten = ul; });
    return () => unlisten?.();
};

export const onWindowReady = (callback) => {
    let unlisten;
    listen('window:ready', (e) => callback(e.payload)).then(ul => { unlisten = ul; });
    return () => unlisten?.();
};

export const onNavigate = (callback) => {
    let unlisten;
    listen('navigate', (e) => callback(e.payload)).then(ul => { unlisten = ul; });
    return () => unlisten?.();
};

// ─── Full Nizhal API (drop-in replacement for window.nizhal) ────────────
const nizhalAPI = {
    window: windowControls,
    character,
    system,
    persona,
    memory,
    ai,
    voice,
    payment: { checkout: async () => {}, verify: async () => {} },
    license: { check: async () => true, unlock: async () => true, getUnlocked: async () => [] },
    marketplace: { getPersonas: async () => [], purchase: async () => {}, download: async () => {} },
    privacy,
    livekit,
    adb,
    onboarding,
    avatar,
    app,
    env,
    state,
    platform: navigator.platform.includes('Win') ? 'win32' : navigator.platform.includes('Mac') ? 'darwin' : 'linux',
    invoke: (channel, ...args) => invoke(channel, ...args),
    on: events.on,
    off: () => {}, // No-op, Tauri uses unlisten pattern
    onPersonaChange,
    onMoodChange,
    onThemeChange,
    onWindowReady,
    onNavigate,
};

export default nizhalAPI;
