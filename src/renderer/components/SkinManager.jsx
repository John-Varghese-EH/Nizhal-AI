import React, { useState, useEffect } from 'react';
import JarvisHUD from './skins/JarvisHUD';
import CompanionOrb from './skins/CompanionOrb';
import VideoAvatar from './avatar/VideoAvatar';
import OptimizedVRMAvatar from './avatar/OptimizedVRMAvatar';

const VRM_MODELS = {
    aldina: '/assets/models/11_Aldina.vrm',
    zome: '/assets/models/14_Zome.vrm',
    lazuli: '/assets/models/12_Lazuli.vrm',
    miku: '/assets/models/08_Miku.vrm',
    nahida: '/assets/models/09_Nahida.vrm',
    alicia: '/assets/models/07_Alicia.vrm',
    pranama: '/assets/models/10_Pranama.vrm',
    riku: '/assets/models/13_Riku.vrm',
    sheeba: '/assets/models/01_Sheeba.vrm',
    meera: '/assets/models/02_Meera.vrm',
    devika: '/assets/models/03_Devika.vrm',
    linda: '/assets/models/04_Linda.vrm',
    lakshmi: '/assets/models/05_Lakshmi.vrm',
    ananya: '/assets/models/06_Ananya.vrm',
    kavya: '/assets/models/11_Aldina.vrm',
    arjun: '/assets/models/13_Riku.vrm'
};

const SkinManager = ({
    personaId = 'jarvis',
    activeSkin = 'default',
    personalityState,
    isActive = true,
    showVideoAvatar = true
}) => {
    const [selectedModel, setSelectedModel] = useState(null);

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const prefs = await window.nizhal?.memory?.getUserPreferences?.();
                if (prefs?.characterModel) {
                    setSelectedModel(prefs.characterModel);
                }
            } catch (e) {
                console.error('[SkinManager] Failed to load preferences:', e);
            }
        };

        loadPreferences();

        // Listen for live onboarding preference updates
        window.addEventListener('preferences-updated', loadPreferences);
        return () => window.removeEventListener('preferences-updated', loadPreferences);
    }, []);

    const getMoodColor = (mood) => {
        const colors = {
            happy: '#10b981',
            neutral: '#6366f1',
            concerned: '#f59e0b',
            protective: '#ef4444',
            playful: '#ec4899',
            thoughtful: '#8b5cf6'
        };
        return colors[mood] || colors.neutral;
    };

    const renderSkin = () => {
        // Resolve model mapping
        let modelKey = personaId;
        
        // Map personality IDs (gf, bf, nizhal, javirs) to their beautiful 3D VRM defaults or custom preferences
        if (personaId === 'gf' || personaId === 'javirs') {
            modelKey = selectedModel || 'aldina';
        } else if (personaId === 'bf') {
            modelKey = selectedModel || 'riku';
        } else if (personaId === 'nizhal') {
            modelKey = selectedModel || 'zome';
        } else if (personaId === 'jarvis') {
            // Jarvis HUD skin fallback
            if (activeSkin === 'jarvis_hud') {
                return (
                    <JarvisHUD
                        mood={personalityState?.mood}
                        affection={personalityState?.affection}
                        isActive={isActive}
                    />
                );
            }
            modelKey = selectedModel || 'riku';
        }

        // Get matching VRM Model
        let vrmModelUrl = VRM_MODELS[modelKey];
        
        // Final Bulletproof Fallback: if model url not resolved, fall back to Aldina VRM
        if (!vrmModelUrl && modelKey !== 'jarvis') {
            vrmModelUrl = VRM_MODELS.aldina;
        }

        if (vrmModelUrl) {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    <OptimizedVRMAvatar
                        modelUrl={vrmModelUrl}
                        size={{ width: '100%', height: '100%' }}
                        expression={personalityState?.mood || 'neutral'}
                        isSpeaking={personalityState?.isSpeaking || false}
                        isThinking={personalityState?.isThinking || false}
                        quality="medium"
                    />
                </div>
            );
        }

        // Skin C: Video Avatar (Bella/Thozhi style)
        if (showVideoAvatar && ['kavya', 'arjun', 'tamil_nanban', 'naruto', 'goku', 'elsa'].includes(personaId)) {
            return (
                <div className="relative w-full h-full flex items-center justify-center">
                    <VideoAvatar
                        personaId={personaId}
                        currentState={isActive ? 'listening' : 'idle'}
                        mood={personalityState?.mood}
                        size="fullscreen"
                    />
                </div>
            );
        }

        // Skin B: Companion Orb (Fallback/Default)
        return (
            <CompanionOrb
                mood={personalityState?.mood}
                moodColor={getMoodColor(personalityState?.mood)}
                isActive={isActive}
            />
        );
    };

    return (
        <div className="absolute inset-0 z-0">
            {renderSkin()}
        </div>
    );
};

export default SkinManager;
