import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatView from './components/ChatView';
import Marketplace from './components/Marketplace';
import SettingsView from './components/SettingsView';
import JournalView from './components/JournalView';
import SkinManager from './components/SkinManager';
import MagicSetup from './components/Onboarding/MagicSetup';
import AppLayout from './components/layout/AppLayout';
import LifeView from './components/LifeView';
import AndroidMirror from './components/AndroidMirror';
import geminiLiveService from '../services/GeminiLiveService';
import assistant from '../assistant/index.js';

const App = () => {
    const [activePersona, setActivePersona] = useState(null);
    const [personalityState, setPersonalityState] = useState(null);
    const [currentView, setCurrentView] = useState('chat');
    const [isLoading, setIsLoading] = useState(true);
    const [clickThrough, setClickThrough] = useState(false);
    const [windowMode, setWindowMode] = useState('compact');
    const [isMaximized, setIsMaximized] = useState(false);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showMirror, setShowMirror] = useState(false);

    // Voice/connection state
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);

    // Analysers (kept for future visualizer integration)
    const [analyserIn, setAnalyserIn] = useState(null);
    const [analyserOut, setAnalyserOut] = useState(null);

    useEffect(() => {
        initializeApp();
        assistant.start();

        const checkWindowState = async () => {
            if (window.nizhal?.window?.getState) {
                const state = await window.nizhal.window.getState();
                if (state) {
                    setIsMaximized(state.isMaximized);
                    setWindowMode(state.isMaximized ? 'full' : 'compact');
                }
            } else {
                const isWide = window.innerWidth > 800;
                setIsMaximized(isWide);
                setWindowMode(isWide ? 'full' : 'compact');
            }
        };

        checkWindowState();

        if (!window.nizhal) {
            window.addEventListener('resize', checkWindowState);
        }

        const interval = setInterval(checkWindowState, 1000);

        const unsubscribePersona = window.nizhal?.onPersonaChange?.(setActivePersona);
        const unsubscribeMood = window.nizhal?.onMoodChange?.((mood) => setPersonalityState(prev => ({ ...prev, mood })));
        const unsubscribePrivacy = window.nizhal?.on?.('privacy:changed', (enabled) => {
            setPrivacyMode(enabled);
            geminiLiveService.setPrivacyMode(enabled);
        });

        return () => {
            clearInterval(interval);
            if (!window.nizhal) window.removeEventListener('resize', checkWindowState);
            unsubscribePersona?.();
            unsubscribeMood?.();
            unsubscribePrivacy?.();
            geminiLiveService.destroy();
        };
    }, []);

    const initializeApp = async () => {
        try {
            const persona = await window.nizhal?.persona.getActive();
            const state = await window.nizhal?.persona.getState();
            const privacy = await window.nizhal?.privacy?.getMode?.();
            const prefs = await window.nizhal?.memory?.getUserPreferences?.();

            setActivePersona(persona);
            setPersonalityState(state);
            setPrivacyMode(privacy || false);
            geminiLiveService.setPrivacyMode(privacy || false);

            if (!prefs?.onboardingComplete) setShowOnboarding(true);
        } catch (error) {
            console.error('Failed to initialize:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = useCallback(async () => {
        if (privacyMode) return;
        const prefs = await window.nizhal?.memory?.getUserPreferences?.();
        const apiKey = prefs?.geminiApiKey;
        if (!apiKey) {
            setCurrentView('settings');
            return;
        }
        const success = await geminiLiveService.connect(apiKey, `You are ${activePersona?.name || 'Nizhal'}, a helpful AI.`);
        if (success) {
            setIsConnected(true);
            setIsListening(true);
            const { analyserIn, analyserOut } = geminiLiveService.getAnalysers();
            setAnalyserIn(analyserIn);
            setAnalyserOut(analyserOut);
        }
    }, [privacyMode, activePersona]);

    const handleDisconnect = useCallback(() => {
        geminiLiveService.disconnect();
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
    }, []);

    const handleMicToggle = useCallback(() => {
        if (isConnected) {
            geminiLiveService.setMuted(isListening);
            setIsListening(!isListening);
        }
    }, [isConnected, isListening]);

    if (isLoading) return <div className="h-full w-full flex items-center justify-center bg-black text-white">Loading...</div>;
    if (showOnboarding) return <MagicSetup onComplete={() => setShowOnboarding(false)} />;

    const isCompact = windowMode === 'compact';

    return (
        <AppLayout
            activeTab={currentView}
            onTabChange={setCurrentView}
            persona={activePersona}
            isConnected={isConnected}
            isListening={isListening}
            onMicToggle={handleMicToggle}
            isCameraEnabled={isCameraEnabled}
            onCameraToggle={() => setIsCameraEnabled(!isCameraEnabled)}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            privacyMode={privacyMode}
            onPrivacyToggle={() => setPrivacyMode(!privacyMode)}
            onMirrorToggle={() => setShowMirror(!showMirror)}
            windowMode={windowMode}
        >
            <AnimatePresence>
                {showMirror && <AndroidMirror onClose={() => setShowMirror(false)} />}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {currentView === 'chat' && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col md:flex-row"
                    >
                        {/* Avatar Layer */}
                        <div className={`relative ${isCompact ? 'absolute inset-0 z-0' : 'w-[450px] shrink-0 h-full z-10 border-r border-white/5'}`}>
                            {/* Only show SkinManager/Avatar here if needed, or keeping it global? 
                                 Original design had it always present. For unified, let's keep it here.
                             */}
                            <div className="w-full h-full opacity-50 md:opacity-100 transition-opacity">
                                <SkinManager
                                    personaId={activePersona?.id}
                                    activeSkin={activePersona?.skin}
                                    personalityState={personalityState}
                                    isActive={true}
                                />
                            </div>
                        </div>

                        {/* Chat Interface */}
                        <div className={`flex-1 flex flex-col z-20 ${isCompact ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}>
                            <ChatView
                                persona={activePersona}
                                personalityState={personalityState}
                                onListeningChange={setIsListening}
                                onThinkingChange={setIsThinking}
                                onSpeakingChange={setIsSpeaking}
                            />
                        </div>
                    </motion.div>
                )}

                {currentView === 'life' && (
                    <motion.div key="life" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <LifeView />
                    </motion.div>
                )}

                {currentView === 'settings' && (
                    <motion.div key="settings" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <SettingsView
                            onBack={() => setCurrentView('chat')} // Back button might be redundant in Sidebar mode but good for Compact
                            onPersonaChange={setActivePersona}
                            privacyMode={privacyMode}
                            onPrivacyToggle={() => setPrivacyMode(!privacyMode)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
};

export default App;

