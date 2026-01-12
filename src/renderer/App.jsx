import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TitleBar from './components/TitleBar';
import ChatView from './components/ChatView';
import Marketplace from './components/Marketplace';
import SettingsView from './components/SettingsView';
import JournalView from './components/JournalView';
import SkinManager from './components/SkinManager';
import Navigation from './components/Navigation';
import FullDashboard from './components/FullDashboard';
import CompactChatBox from './components/CompactChatBox';
import geminiLiveService from '../services/GeminiLiveService';

const App = () => {
    const [activePersona, setActivePersona] = useState(null);
    const [personalityState, setPersonalityState] = useState(null);
    const [currentView, setCurrentView] = useState('chat');
    const [isLoading, setIsLoading] = useState(true);
    const [clickThrough, setClickThrough] = useState(false);

    // Adaptive UI state
    const [windowMode, setWindowMode] = useState('compact'); // 'full' | 'compact'
    const [isMaximized, setIsMaximized] = useState(false);

    // Privacy mode
    const [privacyMode, setPrivacyMode] = useState(false);

    // Voice/connection state
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(false);

    // Analysers for visualizer
    const [analyserIn, setAnalyserIn] = useState(null);
    const [analyserOut, setAnalyserOut] = useState(null);

    useEffect(() => {
        initializeApp();

        // Listen for window state changes
        const checkWindowState = async () => {
            const state = await window.nizhal?.window?.getState?.();
            if (state) {
                setIsMaximized(state.isMaximized);
                setWindowMode(state.isMaximized ? 'full' : 'compact');
            }
        };

        // Check initial state
        checkWindowState();

        // Poll for changes (fallback if no event)
        const interval = setInterval(checkWindowState, 1000);

        const unsubscribePersona = window.nizhal?.onPersonaChange((persona) => {
            setActivePersona(persona);
        });

        const unsubscribeMood = window.nizhal?.onMoodChange((mood) => {
            setPersonalityState(prev => ({ ...prev, mood }));
        });

        // Listen for privacy mode changes
        const unsubscribePrivacy = window.nizhal?.on?.('privacy:changed', (enabled) => {
            setPrivacyMode(enabled);
            geminiLiveService.setPrivacyMode(enabled);
        });

        return () => {
            clearInterval(interval);
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

            setActivePersona(persona);
            setPersonalityState(state);
            setPrivacyMode(privacy || false);
            geminiLiveService.setPrivacyMode(privacy || false);
        } catch (error) {
            console.error('Failed to initialize:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClickThroughToggle = useCallback(async () => {
        const newValue = !clickThrough;
        await window.nizhal?.window.setClickThrough(newValue);
        setClickThrough(newValue);
    }, [clickThrough]);

    const handlePrivacyToggle = useCallback(async () => {
        const newValue = !privacyMode;
        await window.nizhal?.privacy?.setMode?.(newValue);
        setPrivacyMode(newValue);
        geminiLiveService.setPrivacyMode(newValue);
    }, [privacyMode]);

    const handleConnect = useCallback(async () => {
        if (privacyMode) {
            console.warn('Privacy mode enabled, cannot connect to cloud');
            return;
        }

        // Get API key from settings
        const prefs = await window.nizhal?.memory?.getUserPreferences?.();
        const apiKey = prefs?.geminiApiKey;

        if (!apiKey) {
            console.error('Gemini API key not configured');
            setCurrentView('settings');
            return;
        }

        const persona = activePersona || { name: 'Nizhal AI' };
        const systemInstruction = `You are ${persona.name}, a helpful and friendly AI desktop companion.`;

        const success = await geminiLiveService.connect(apiKey, systemInstruction);

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

    const handleCameraToggle = useCallback(async () => {
        setIsCameraEnabled(!isCameraEnabled);
    }, [isCameraEnabled]);

    const handleMaximize = useCallback(async () => {
        const isMax = await window.nizhal?.window?.maximize?.();
        setIsMaximized(isMax);
        setWindowMode(isMax ? 'full' : 'compact');
    }, []);

    // Restore to small window (unmaximize)
    const handleRestore = useCallback(async () => {
        // Toggle maximize will unmaximize if already maximized
        const isMax = await window.nizhal?.window?.maximize?.();
        setIsMaximized(isMax);
        setWindowMode(isMax ? 'full' : 'compact');
    }, []);

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center glass-panel">
                <motion.div
                    className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            </div>
        );
    }

    // Full Dashboard mode (maximized window)
    if (windowMode === 'full' && isMaximized) {
        return (
            <FullDashboard
                persona={activePersona}
                personalityState={personalityState}
                isConnected={isConnected}
                isListening={isListening}
                isSpeaking={isSpeaking}
                isUserSpeaking={isUserSpeaking}
                isCameraEnabled={isCameraEnabled}
                privacyMode={privacyMode}
                analyserIn={analyserIn}
                analyserOut={analyserOut}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onMicToggle={handleMicToggle}
                onCameraToggle={handleCameraToggle}
                onPrivacyToggle={handlePrivacyToggle}
                onRestore={handleRestore}
                onSettingsOpen={() => setCurrentView('settings')}
            />
        );
    }

    // Compact/Standard mode
    return (
        <div className="h-full w-full flex flex-col bg-slate-950 text-white overflow-hidden">
            <TitleBar
                personaName={activePersona?.displayName || 'Nizhal AI'}
                clickThrough={clickThrough}
                onClickThroughToggle={handleClickThroughToggle}
                onMaximize={handleMaximize}
                privacyMode={privacyMode}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <SkinManager
                    personaId={activePersona?.id}
                    activeSkin={activePersona?.skin}
                    personalityState={personalityState}
                    isActive={currentView === 'chat'}
                />

                <div className="relative z-10 flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {currentView === 'chat' && (
                                <ChatView
                                    persona={activePersona}
                                    personalityState={personalityState}
                                    onListeningChange={setIsListening}
                                    onThinkingChange={setIsThinking}
                                    onSpeakingChange={setIsSpeaking}
                                />
                            )}
                            {currentView === 'marketplace' && (
                                <Marketplace onBack={() => setCurrentView('chat')} />
                            )}
                            {currentView === 'journal' && (
                                <JournalView onBack={() => setCurrentView('chat')} />
                            )}
                            {currentView === 'settings' && (
                                <SettingsView
                                    onBack={() => setCurrentView('chat')}
                                    onPersonaChange={setActivePersona}
                                    privacyMode={privacyMode}
                                    onPrivacyToggle={handlePrivacyToggle}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <Navigation
                currentView={currentView}
                onViewChange={setCurrentView}
            />
        </div>
    );
};

export default App;

