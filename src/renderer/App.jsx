import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TitleBar from './components/TitleBar';
import ChatView from './components/ChatView';
import Marketplace from './components/Marketplace';
import SettingsView from './components/SettingsView';
import JournalView from './components/JournalView';
import SkinManager from './components/SkinManager';
import Navigation from './components/Navigation';
import InteractiveAvatar from './components/avatar/InteractiveAvatar';
import FloatingCompanion from './components/avatar/FloatingCompanion';

const App = () => {
    const [activePersona, setActivePersona] = useState(null);
    const [personalityState, setPersonalityState] = useState(null);
    const [currentView, setCurrentView] = useState('chat');
    const [isLoading, setIsLoading] = useState(true);
    const [clickThrough, setClickThrough] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showFloatingAvatar, setShowFloatingAvatar] = useState(true);
    const [floatingAvatarPosition, setFloatingAvatarPosition] = useState({ x: 20, y: 100 });

    useEffect(() => {
        initializeApp();

        const unsubscribePersona = window.nizhal?.onPersonaChange((persona) => {
            setActivePersona(persona);
        });

        const unsubscribeMood = window.nizhal?.onMoodChange((mood) => {
            setPersonalityState(prev => ({ ...prev, mood }));
        });

        return () => {
            unsubscribePersona?.();
            unsubscribeMood?.();
        };
    }, []);

    const initializeApp = async () => {
        try {
            const persona = await window.nizhal?.persona.getActive();
            const state = await window.nizhal?.persona.getState();
            setActivePersona(persona);
            setPersonalityState(state);
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

    const handleAvatarClick = useCallback(async () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        setIsListening(true);

        setTimeout(() => {
            setIsListening(false);
            setIsThinking(true);

            setTimeout(() => {
                setIsThinking(false);
                setIsSpeaking(true);

                setTimeout(() => {
                    setIsSpeaking(false);
                }, 3000);
            }, 2000);
        }, 3000);
    }, [isListening]);

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

    return (
        <div className="h-full w-full flex flex-col glass-panel overflow-hidden">
            <TitleBar
                personaName={activePersona?.displayName || 'Nizhal AI'}
                clickThrough={clickThrough}
                onClickThroughToggle={handleClickThroughToggle}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <SkinManager
                    personaId={activePersona?.id}
                    activeSkin={activePersona?.skin}
                    personalityState={personalityState}
                    isActive={currentView === 'chat'}
                />

                {/* Avatar is now in separate character window - removed from here */}

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
                                    showFloatingAvatar={showFloatingAvatar}
                                    onFloatingAvatarToggle={setShowFloatingAvatar}
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
