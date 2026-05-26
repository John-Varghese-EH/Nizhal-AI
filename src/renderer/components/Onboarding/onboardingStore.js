import { create } from 'zustand';

export const useOnboardingStore = create((set, get) => ({
    currentStep: 1,
    data: {
        name: '',
        vibe: 50,
        relationship: 'friend',
        provider: 'gemini',
        apiKey: '',
        characterModel: 'aldina',
        globalHotkey: 'Ctrl+Shift+N',
        voiceTone: 'female',
        startWithWindows: false,
        theme: 'purple'
    },
    error: null,
    isValidating: false,

    setStep: (step) => set({ currentStep: step, error: null }),
    updateData: (updates) => set((state) => ({ data: { ...state.data, ...updates } })),
    setError: (error) => set({ error }),
    setValidating: (isValidating) => set({ isValidating }),

    completeOnboarding: async (onCompleteCallback) => {
        const { data } = get();
        set({ isValidating: true, error: null });

        try {
            // Get current preferences so we don't overwrite unrelated fields
            const prefs = (await window.nizhal?.memory?.getUserPreferences?.()) || {};
            
            const updatedPrefs = {
                ...prefs,
                name: data.name,
                vibe: data.vibe,
                relationship: data.relationship,
                characterModel: data.characterModel,
                globalHotkey: data.globalHotkey,
                voiceTone: data.voiceTone,
                startWithWindows: data.startWithWindows,
                theme: data.theme,
                onboardingComplete: true
            };

            // Save API key if provided
            if (data.apiKey) {
                const updatedApiKeys = { ...prefs.apiKeys, [data.provider]: data.apiKey.trim() };
                updatedPrefs.apiKeys = updatedApiKeys;

                // Sync API Key to provider natively
                if (window.nizhal?.ai?.setProvider) {
                    await window.nizhal.ai.setProvider(data.provider, { apiKey: data.apiKey.trim() });
                }
            }

            // Sync active provider if specified
            if (data.provider && window.nizhal?.ai?.setProvider) {
                await window.nizhal.ai.setProvider(data.provider, {});
                updatedPrefs.aiProvider = data.provider;
            }

            // Set character model in Tauri bridge
            if (data.characterModel && window.nizhal?.character?.setModel) {
                await window.nizhal.character.setModel(data.characterModel);
            }

            // Save preferences to disk via tauri bridge
            if (window.nizhal?.memory?.setUserPreferences) {
                await window.nizhal.memory.setUserPreferences(updatedPrefs);
            }

            // Dispatch global event for live component updates
            window.dispatchEvent(new Event('preferences-updated'));

            set({ isValidating: false });
            if (onCompleteCallback) {
                onCompleteCallback();
            }
        } catch (err) {
            console.error('[OnboardingStore] Complete failed:', err);
            set({ error: `Failed to complete setup: ${err.message || err}`, isValidating: false });
        }
    }
}));
