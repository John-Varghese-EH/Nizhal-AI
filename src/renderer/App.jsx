import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MagicSetup from './components/Onboarding/MagicSetup';
import AppLayout from './components/layout/AppLayout';
import geminiLiveService from '../services/GeminiLiveService';
import assistant from '../assistant/index.js';

const ChatView = lazy(() => import('./components/ChatView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const LifeView = lazy(() => import('./components/LifeView'));
const SkinManager = lazy(() => import('./components/SkinManager'));
const AndroidMirror = lazy(() => import('./components/AndroidMirror'));

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

        const interval = setInterval(checkWindowState, 3000);

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

            // Launch the transparent avatar window
            if (window.nizhal?.character?.create) {
                await window.nizhal.character.create();
                await window.nizhal.character.show();
            }
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

    if (isLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#030711] text-white gap-6">
            {/* Pulsing Logo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative"
            >
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl"
                    style={{ width: 120, height: 120, margin: 'auto', top: -10, left: -10, right: -10, bottom: -10 }}
                />
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
                    <span className="text-4xl font-thin tracking-[0.15em] bg-gradient-to-br from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent select-none">N</span>
                </div>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center gap-2"
            >
                <h1 className="text-2xl font-thin tracking-[0.25em] text-white/80">NIZHAL</h1>
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1 h-1 rounded-full bg-cyan-400"
                    />
                    <span className="text-[10px] text-white/30 font-mono tracking-[0.3em] uppercase">Initializing</span>
                    <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                        className="w-1 h-1 rounded-full bg-cyan-400"
                    />
                </div>
            </motion.div>
        </div>
    );
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
                {showMirror && (
                    <Suspense fallback={<div>Loading Mirror...</div>}>
                        <AndroidMirror onClose={() => setShowMirror(false)} />
                    </Suspense>
                )}
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
                            <div className="w-full h-full opacity-50 md:opacity-100 transition-opacity">
                                <Suspense fallback={null}>
                                    <SkinManager
                                        personaId={activePersona?.id}
                                        activeSkin={activePersona?.skin}
                                        personalityState={personalityState}
                                        isActive={true}
                                    />
                                </Suspense>
                            </div>
                        </div>

                        {/* Chat Interface */}
                        <div className={`flex-1 flex flex-col z-20 ${isCompact ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'}`}>
                            <Suspense fallback={<div className="h-full flex items-center justify-center">Loading Chat...</div>}>
                                <ChatView
                                    persona={activePersona}
                                    personalityState={personalityState}
                                    onListeningChange={setIsListening}
                                    onThinkingChange={setIsThinking}
                                    onSpeakingChange={setIsSpeaking}
                                />
                            </Suspense>
                        </div>
                    </motion.div>
                )}

                {currentView === 'life' && (
                    <motion.div key="life" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Suspense fallback={<div className="h-full flex items-center justify-center">Loading Life View...</div>}>
                            <LifeView />
                        </Suspense>
                    </motion.div>
                )}

                {currentView === 'settings' && (
                    <motion.div key="settings" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Suspense fallback={<div className="h-full flex items-center justify-center">Loading Settings...</div>}>
                            <SettingsView
                                onBack={() => setCurrentView('chat')} // Back button might be redundant in Sidebar mode but good for Compact
                                onPersonaChange={setActivePersona}
                                privacyMode={privacyMode}
                                onPrivacyToggle={() => setPrivacyMode(!privacyMode)}
                            />
                        </Suspense>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
};

export default App;

