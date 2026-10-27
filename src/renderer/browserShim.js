/**
 * browserShim.js
 * Provides the nizhal API bridge - either via Tauri or mock for browser mode
 */

import tauriAPI from '../lib/tauri.js';
import { isTauri } from '@tauri-apps/api/core';

// Check if running in Tauri
if (isTauri()) {
    // Running in Tauri — use native APIs
    window.nizhal = tauriAPI;
    console.log('🦀 Running in Tauri mode — native APIs active');
} else {
    // Running in plain browser — use mock API
    console.log('🌐 Running in browser mode — using mock APIs');
    window.nizhal = createMockAPI();
}

function createMockAPI() {
    // Load state from local storage to make it functional
    const getPrefs = () => {
        try {
            const prefs = localStorage.getItem('nizhal_prefs');
            return prefs ? JSON.parse(prefs) : {
                voiceEnabled: false,
                geminiApiKey: '',
                privacyMode: false,
            };
        } catch {
            return { voiceEnabled: false, geminiApiKey: '', privacyMode: false };
        }
    };

    const getContext = () => {
        try {
            const ctx = localStorage.getItem('nizhal_context');
            return ctx ? JSON.parse(ctx) : [];
        } catch {
            return [];
        }
    };

    return {
        window: {
            minimize: async () => console.log('[Browser] minimize not available'),
            maximize: async () => false,
            close: async () => window.close(),
            getState: async () => ({ isMaximized: false, isVisible: true }),
            showChat: async () => {},
            hideChat: async () => {},
            startDragging: async () => {},
        },
        persona: {
            getActive: async () => ({ id: 'gf', name: 'Girlfriend', display_name: 'Girlfriend Mode', displayName: 'Your AI Companion' }),
            setActive: async (id) => ({ success: true }),
            getAll: async () => [
                { id: 'gf', name: 'Girlfriend', display_name: 'Girlfriend Mode', displayName: 'Girlfriend Mode' },
            ],
            getState: async () => ({ mood: 'neutral', emotion: 'calm' }),
            updateMood: async (mood) => {},
        },
        memory: {
            getHistory: async () => getContext(),
            search: async () => [],
            addEntry: async (entry) => {
                const ctx = getContext();
                ctx.push(entry);
                localStorage.setItem('nizhal_context', JSON.stringify(ctx));
            },
            getUserPreferences: async () => getPrefs(),
            setUserPreferences: async (prefs) => {
                localStorage.setItem('nizhal_prefs', JSON.stringify(prefs));
            },
        },
        ai: {
            chat: async (message) => {
                const prefs = getPrefs();
                const apiKey = prefs.geminiApiKey;
                
                if (!apiKey) {
                    return {
                        success: false,
                        response: 'Please enter your Gemini API Key in Settings to enable Browser Mode AI chat.',
                    };
                }

                try {
                    const ctx = getContext();
                    const contents = ctx.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    }));
                    
                    contents.push({ role: 'user', parts: [{ text: message }] });

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: contents })
                    });
                    
                    if (!response.ok) throw new Error('API Error');
                    const data = await response.json();
                    const aiText = data.candidates[0].content.parts[0].text;
                    
                    // Save context
                    ctx.push({ role: 'user', content: message });
                    ctx.push({ role: 'assistant', content: aiText });
                    if (ctx.length > 20) ctx.splice(0, ctx.length - 20);
                    localStorage.setItem('nizhal_context', JSON.stringify(ctx));

                    return { success: true, response: aiText, provider: 'gemini (browser)' };
                } catch (e) {
                    return { success: false, response: 'Browser API request failed. Ensure valid API key and internet connection.' };
                }
            },
            setProvider: async () => {},
            getProviders: async () => [],
            getProviderStatus: async () => ({ status: 'browser-mode', current_provider: 'gemini', available_providers: ['gemini'] }),
            getModels: async () => ({}),
            setModel: async () => {},
            getEphemeralToken: async () => ({ success: true, token: getPrefs().geminiApiKey }),
            clearContext: async () => localStorage.removeItem('nizhal_context'),
            checkLocalAI: async () => false,
            detectGpu: async () => ({ device: "CPU (Mock Browser)", backend: "CPU" }),
            localModelStatus: async () => ({ is_downloaded: false, download_progress: 0.0 }),
            localModelDownload: async () => {},
            localModelLoad: async () => {},
        },
        voice: {
            speak: async (text) => {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    window.speechSynthesis.speak(utterance);
                }
            },
            stop: async () => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            },
            getVoices: async () => [],
            setVoice: async () => {},
        },
        livekit: {
            connect: async () => ({ success: false, error: 'LiveKit disabled in browser.' }),
            disconnect: async () => {},
            getStatus: async () => ({ configured: false }),
            startAgent: async () => ({ success: false }),
            stopAgent: async () => ({}),
            restartAgent: async () => ({}),
            updatePersonality: async () => ({}),
        },
        privacy: {
            getMode: async () => false,
            setMode: async (enabled) => enabled,
        },
        app: {
            getTheme: async () => 'dark',
            openExternal: async (url) => window.open(url, '_blank'),
            getVersion: async () => '1.0.0-browser',
        },
        state: {
            get: async () => null,
            set: async () => {},
            getAll: async () => ({}),
            batch: async () => {},
            subscribe: () => () => {},
            getPersonalityConfig: async () => ({}),
            onEmotionChange: () => () => {},
            onVRMChange: () => () => {},
            onReset: () => () => {},
        },
        env: {
            getAll: async () => ({}),
            set: async () => {},
            delete: async () => {},
        },
        adb: {
            check: async () => false,
            connect: async () => ({ success: false }),
            disconnect: async () => {},
            getDevices: async () => [],
            tap: async () => {}, swipe: async () => {}, type: async () => {},
            key: async () => {}, home: async () => {}, back: async () => {},
            launch: async () => {}, close: async () => {},
            screenshot: async () => ({ success: false }),
            info: async () => ({}),
        },
        onboarding: { complete: async () => true },
        avatar: { speak: async () => {} },
        character: {
            show: async () => {}, hide: async () => {},
            toggleAlwaysOnTop: async () => false,
            snap: async () => {}, setClickThrough: async () => {},
            setModel: async () => {}, toggleGravity: async () => false,
            jump: async () => {}, toggleGame: async () => false,
            setSize: async () => {}, setPosition: async () => {},
            getPosition: async () => ({ x: 0, y: 0, width: 300, height: 400 }),
        },
        system: {
            getSystemInfo: async () => ({}),
            getStats: async () => ({}),
            getVolume: async () => 50,
            setVolume: async () => {},
            getBrightness: async () => 100,
            setBrightness: async () => {},
            launchApp: async () => {},
        },
        marketplace: { getPersonas: async () => [], purchase: async () => {}, download: async () => {} },
        payment: { checkout: async () => {}, verify: async () => {} },
        license: { check: async () => true, unlock: async () => true, getUnlocked: async () => [] },

        platform: navigator.platform.includes('Win') ? 'win32' : navigator.platform.includes('Mac') ? 'darwin' : 'linux',
        invoke: async () => {},
        on: () => () => {},
        off: () => {},
        onPersonaChange: () => () => {},
        onMoodChange: () => () => {},
        onThemeChange: () => () => {},
        onWindowReady: () => () => {},
        onNavigate: () => () => {},
    };
}

export default window.nizhal;
