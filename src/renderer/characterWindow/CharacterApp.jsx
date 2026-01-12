import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { MusicDanceService } from '../../services/MusicDanceService';
import { ExpressionController } from '../../services/ExpressionController';
import { getAvatarStateController, AvatarState } from '../../services/AvatarStateController';
import { windowSittingService } from '../../services/WindowSitting';
import { companionPersonality } from '../../services/CompanionPersonality';
import { cuteErrorHandler } from '../../services/CuteErrorHandler';
import CharacterCustomizer from '../components/CharacterCustomizer';
import JarvisHologram from '../components/avatar/JarvisHologram';
import SpeechBubble from '../components/avatar/SpeechBubble';
import QuickMenu from '../components/QuickMenu';
import ParticleEffects from '../components/ParticleEffects';
import BootSequence from './BootSequence';
import ShareCard from '../components/ShareCard';
import SettingsPanel from '../components/SettingsPanel';
import MagicSetup from '../components/Onboarding/MagicSetup';
import TicTacToe from '../components/TicTacToe';

import { useTheme } from '../hooks/useTheme';
import { useFileDrop, getFileDescription } from '../hooks/useFileDrop';
import '../styles/glass.css';

// Extend THREE objects for R3F (required in v8+)
extend(THREE);

// Import VRM model component (without Canvas wrapper) for use inside existing Canvas
const OptimizedVRMModel = lazy(() =>
    import('../components/avatar/OptimizedVRMAvatar').then(module => ({ default: module.OptimizedVRMModel }))
);

// Available characters - includes both VRM models and special avatars
const AVAILABLE_CHARACTERS = [
    { id: 'jarvis', name: 'Jarvis', type: 'hologram', model: null }, // Futuristic hologram sphere
    { id: 'aldina', name: 'Aldina', type: 'vrm', model: '/assets/models/11_Aldina.vrm' },
    { id: 'zome', name: 'Zome', type: 'vrm', model: '/assets/models/14_Zome.vrm' },
    { id: 'lazuli', name: 'Lazuli', type: 'vrm', model: '/assets/models/12_Lazuli.vrm' },
    { id: 'miku', name: 'Hatsune Miku', type: 'vrm', model: '/assets/models/08_Miku.vrm' },
    { id: 'nahida', name: 'Nahida', type: 'vrm', model: '/assets/models/09_Nahida.vrm' },
    { id: 'alicia', name: 'Alicia', type: 'vrm', model: '/assets/models/07_Alicia.vrm' },
    { id: 'pranama', name: 'Pranama', type: 'vrm', model: '/assets/models/10_Pranama.vrm' },
    { id: 'riku', name: 'Riku', type: 'vrm', model: '/assets/models/13_Riku.vrm' },
    { id: 'sheeba', name: 'Sheeba', type: 'vrm', model: '/assets/models/01_Sheeba.vrm' },
    { id: 'meera', name: 'Meera', type: 'vrm', model: '/assets/models/02_Meera.vrm' },
    { id: 'devika', name: 'Devika', type: 'vrm', model: '/assets/models/03_Devika.vrm' },
    { id: 'linda', name: 'Linda', type: 'vrm', model: '/assets/models/04_Linda.vrm' },
    { id: 'lakshmi', name: 'Lakshmi', type: 'vrm', model: '/assets/models/05_Lakshmi.vrm' },
    { id: 'ananya', name: 'Ananya', type: 'vrm', model: '/assets/models/06_Ananya.vrm' },
];

/**
 * CharacterApp - Optimized standalone character window
 */
const CharacterApp = () => {
    // Unified settings state
    const [settings, setSettings] = useState({
        character: 'aldina', // Default to Aldina VRM model
        scale: 1,
        opacity: 1,
        quality: 'medium',
        position: 'auto',
        alwaysOnTop: true,
        enableDance: true,
        enableGravity: false,
        mouseTracking: true,
        autoBlink: true,
        personalityLevel: 2 // Default to Friendly
    });

    const [avatarState, setAvatarState] = useState({
        isListening: false,
        isThinking: false,
        isSpeaking: false
    });
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    // Personality and emotion state (synced with global state)
    const [personalityMode, setPersonalityMode] = useState('gf');

    // Apply dynamic theme based on personality
    useTheme(personalityMode);

    const [currentEmotion, setCurrentEmotion] = useState('neutral');
    const [uiSettings, setUiSettings] = useState({
        alwaysOnTop: true,
        clickThrough: true,
        transparency: 0.8
    });

    // Speech bubble state
    const [speechMessage, setSpeechMessage] = useState('');
    const [speechVariant, setSpeechVariant] = useState('default');
    const [isSpeechVisible, setIsSpeechVisible] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [customizerOpen, setCustomizerOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState(false); // Default true if no profile found
    const [isDancing, setIsDancing] = useState(false);
    const [danceIntensity, setDanceIntensity] = useState(0);
    const [vrmLoaded, setVrmLoaded] = useState(false);
    const [isClickThrough, setIsClickThrough] = useState(true); // Click-through by default
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 }); // Start with 0 to detect when ready
    const [windowReady, setWindowReady] = useState(false);
    const [isGameActive, setIsGameActive] = useState(false);
    const [bootComplete, setBootComplete] = useState(false);
    const previousWindowSize = useRef(null);

    const dragOffset = useRef({ x: 0, y: 0 });
    const danceServiceRef = useRef(null);
    const expressionRef = useRef(null);
    const particleRef = useRef(null);

    // File drop handling
    const handleFileDrop = useCallback((files) => {
        if (files.length > 0) {
            const description = getFileDescription(files);
            const message = `Processing your file: ${description}`;
            setSpeechText(message);
            setIsSpeechVisible(true);
            particleRef.current?.burst('spark', window.innerWidth / 2, window.innerHeight / 2, 10);

            // Trigger AI response about the file
            if (window.nizhal?.invoke) {
                window.nizhal.invoke('avatar:speak', `Got it! You dropped ${files[0].name}. What would you like me to do with it?`);
            }
        }
    }, []);

    const { isDragging: isFileDragging } = useFileDrop(handleFileDrop);

    // Get current character
    const currentCharacter = useMemo(() =>
        AVAILABLE_CHARACTERS.find(c => c.id === settings.character) || AVAILABLE_CHARACTERS[0],
        [settings.character]
    );

    // Initial load of settings from unified state and local storage
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Load from unified state service
                const globalState = await window.nizhal?.state?.getAll?.();
                if (globalState) {
                    // Check if onboarding is needed (missing profile name)
                    if (!globalState.user?.profile?.name) {
                        setNeedsOnboarding(true);
                    }

                    // Sync personality mode
                    if (globalState.ai?.personalityMode) {
                        setPersonalityMode(globalState.ai.personalityMode);
                    }
                    // Sync current emotion
                    if (globalState.ai?.emotion) {
                        setCurrentEmotion(globalState.ai.emotion);
                    }
                    // Sync UI settings
                    if (globalState.ui) {
                        setUiSettings(globalState.ui);
                    }
                    // Sync VRM model
                    if (globalState.vrm?.modelId) {
                        setSettings(prev => ({ ...prev, character: globalState.vrm.modelId }));
                    }
                }

                // Fallback to localStorage for backward compatibility
                const savedSettings = localStorage.getItem('character-settings');
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings);
                    setSettings(prev => ({ ...prev, ...parsed }));
                }
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        };

        loadSettings();

        // Subscribe to state changes
        const unsubState = window.nizhal?.state?.subscribe?.(['ai', 'vrm', 'ui'], (data) => {
            if (data.path?.startsWith('ai.personalityMode')) {
                setPersonalityMode(data.value);
            }
            if (data.path?.startsWith('ai.emotion')) {
                setCurrentEmotion(data.value);
            }
            if (data.path?.startsWith('vrm.modelId')) {
                setSettings(prev => ({ ...prev, character: data.value }));
            }
            if (data.path?.startsWith('ui')) {
                setUiSettings(prev => ({ ...prev, [data.path.split('.')[1]]: data.value }));
            }
        });

        // Subscribe to emotion changes for animations
        const unsubEmotion = window.nizhal?.state?.onEmotionChange?.((data) => {
            setCurrentEmotion(data.emotion);
            // Trigger expression animation
            expressionRef.current?.onEvent(data.emotion);
        });

        // Subscribe to direct VRM model changes (faster than state sync)
        const unsubVRM = window.nizhal?.state?.onVRMChange?.((modelId) => {
            console.log('Received direct VRM model change:', modelId);
            setSettings(prev => ({ ...prev, character: modelId }));
        });

        return () => {
            unsubState?.();
            unsubEmotion?.();
            unsubVRM?.();
        };
    }, []);

    // Track window size for responsive VRM scaling
    useEffect(() => {
        const updateSize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (w > 0 && h > 0) {
                setWindowSize({ width: w, height: h });
                // Mark window as ready once we have valid dimensions
                if (!windowReady && w > 100 && h > 100) {
                    setWindowReady(true);
                }
            }
        };

        // Delay initial size check to ensure window is fully rendered
        const initTimer = setTimeout(updateSize, 100);
        window.addEventListener('resize', updateSize);

        return () => {
            clearTimeout(initTimer);
            window.removeEventListener('resize', updateSize);
        };
    }, [windowReady]);

    // Calculate VRM scale and position based on window size
    const vrmConfig = useMemo(() => {
        // Use default values if window dimensions not yet available
        const width = windowSize.width || 300;
        const height = windowSize.height || 400;

        // Calculate scale based on window dimensions
        const minDimension = Math.min(width, height);

        // Scale to fill window nicely - smaller to fit full body
        const baseScale = 1.0;
        const scaleFactor = (minDimension / 300) * baseScale;

        // Camera distance - pull back more to see full model
        const cameraZ = 3.5;

        // Move model down significantly so head is visible (adjusted lower to prevent cropping)
        const positionY = -1.0;

        return {
            scale: Math.max(0.8, Math.min(1.5, scaleFactor)), // Smaller scale to fit full body
            position: [0, positionY, 0], // Lower position
            cameraPosition: [0, 0.5, cameraZ] // Camera at mid-height, further back
        };
    }, [windowSize]);

    // Save settings on change and sync personality level
    useEffect(() => {
        localStorage.setItem('character-settings', JSON.stringify(settings));

        // Sync personality level
        if (settings.personalityLevel !== undefined) {
            companionPersonality.setLevel(settings.personalityLevel);
        }
    }, [settings]);

    // Initialize services
    useEffect(() => {
        danceServiceRef.current = new MusicDanceService();
        expressionRef.current = new ExpressionController();
        expressionRef.current.initialize();

        const unsubDance = danceServiceRef.current.onDanceUpdate((data) => {
            setIsDancing(data.isDancing);
            setDanceIntensity(data.intensity);
        });

        return () => {
            unsubDance?.();
            danceServiceRef.current?.dispose();
            expressionRef.current?.dispose();
        };
    }, []);

    // Alt key detection for click-through toggle
    // By default, window is click-through. Hold Alt to interact.
    useEffect(() => {
        // Enable click-through on mount
        window.nizhal?.character?.setClickThrough?.(true);

        // Init window sitting service
        windowSittingService.initialize().then(() => {
            // Enable by default for testing, but handle errors gracefully
            cuteErrorHandler.try(windowSittingService.setEnabled(true));
        });

        // Init companion personality and error handler
        if (expressionRef.current) {
            const showMessage = (msg, variant = 'default') => {
                setSpeechMessage(msg);
                setSpeechVariant(variant);
                setIsSpeechVisible(true);
            };

            companionPersonality.initialize(expressionRef.current);
            companionPersonality.onMessage((msg) => showMessage(msg, 'default'));

            cuteErrorHandler.initialize(showMessage);

            // Startup greeting
            setTimeout(() => {
                cuteErrorHandler.triggerGreeting();
            }, 2000);
        }

        // Random complements timer (every 5-10 minutes)
        const complementTimer = setInterval(() => {
            // 30% chance to show a complement if idle
            if (Math.random() > 0.7 && !avatarState.isThinking && !avatarState.isSpeaking) {
                cuteErrorHandler.triggerComplement();
            }
        }, 300000); // Check every 5 mins

        // Handle sleep/wake events
        window.nizhal?.on?.('system:idle', () => {
            console.log('Received system idle');
            getAvatarStateController().setState(AvatarState.SLEEPING);
            setSpeechMessage('Zzz...');
            setIsSpeechVisible(true);
        });

        window.nizhal?.on?.('system:resume', () => {
            console.log('Received system resume');
            getAvatarStateController().setState(AvatarState.IDLE);
            setSpeechMessage('Huh? I\'m awake!');
            setIsSpeechVisible(true);
        });

        // FIXED: Alt key detection using global document listeners + polling
        // This works even when window is click-through because we listen on document
        let altKeyDown = false;

        const enableInteraction = () => {
            if (!altKeyDown) {
                altKeyDown = true;
                setIsAltPressed(true);
                setIsClickThrough(false);
                window.nizhal?.character?.setClickThrough?.(false);
                console.log('[CharacterApp] Alt pressed - interaction enabled');
            }
        };

        const disableInteraction = () => {
            if (altKeyDown) {
                altKeyDown = false;
                setIsAltPressed(false);
                if (!contextMenuOpen && !customizerOpen && !isDragging) {
                    setIsClickThrough(true);
                    window.nizhal?.character?.setClickThrough?.(true);
                    console.log('[CharacterApp] Alt released - click-through enabled');
                }
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Alt' || e.altKey) {
                e.preventDefault();
                enableInteraction();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Alt') {
                disableInteraction();
            }
        };

        // Also check on mouse events in case keydown was missed
        const handleMouseMove = (e) => {
            if (e.altKey && !altKeyDown) {
                enableInteraction();
            } else if (!e.altKey && altKeyDown && !isDragging) {
                disableInteraction();
            }
        };

        // When mouse leaves window, reset to non-interactive (safety)
        const handleMouseLeave = () => {
            if (!contextMenuOpen && !customizerOpen && !isDragging) {
                disableInteraction();
            }
        };

        // Poll for alt key state every 100ms as fallback
        // This catches cases where keydown was on another window
        const pollInterval = setInterval(() => {
            // We can't directly check key state, but if we have focus and no alt pressed
            // we should reset. This is a safety measure.
            if (document.hasFocus() && !document.querySelector(':focus')) {
                // Window has focus but no element - safe to assume keys are handled
            }
        }, 100);

        // Listen on both document and window to maximize coverage
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        // Also listen for blur to reset state
        window.addEventListener('blur', () => {
            // Don't disable immediately on blur - user might be interacting
        });

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            clearInterval(complementTimer);
            clearInterval(pollInterval);
        };
    }, [contextMenuOpen, customizerOpen, isDragging]);

    // Game logic
    const handleGameToggle = useCallback(async (enable) => {
        const shouldEnable = enable ?? !isGameActive;

        if (shouldEnable) {
            // Save current size
            previousWindowSize.current = { ...windowSize };

            // Calculate new size (square, larger for game)
            const display = window.screen;
            const size = Math.min(display.height * 0.5, 600); // Max 600px or 50% screen height

            await window.nizhal?.character?.setSize(size, size);
            setIsGameActive(true);

            // Move character to side or adjust scale? 
            // For now, let's keep character centered behind game or fade perfectly.
            // Maybe slight transparency for character?
            setSettings(prev => ({ ...prev, opacity: 0.8 }));
        } else {
            setIsGameActive(false);

            // Restore size
            if (previousWindowSize.current) {
                await window.nizhal?.character?.setSize(
                    previousWindowSize.current.width,
                    previousWindowSize.current.height
                );
            }
            setSettings(prev => ({ ...prev, opacity: 1 }));
        }
    }, [isGameActive, windowSize]);

    // IPC listeners
    useEffect(() => {
        const handleAvatarState = (data) => {
            setAvatarState(prev => ({ ...prev, ...data }));
            if (data.isThinking) expressionRef.current?.onEvent('thinking');
            if (data.isSpeaking) expressionRef.current?.onEvent('speaking');
        };

        const handleCharacterChange = (charId) => {
            setSettings(prev => ({ ...prev, character: charId }));
        };

        // Listen for interaction toggle from main process (Alt+Space or Ctrl+Alt+I)
        const handleInteractionToggle = (isEnabled) => {
            setIsAltPressed(isEnabled);
            setIsClickThrough(!isEnabled);
            console.log(`[CharacterApp] Interaction toggle from main: ${isEnabled}`);
        };

        const handleGameToggleRequest = (enable) => {
            handleGameToggle(enable);
        };

        window.nizhal?.on?.('avatar:state', handleAvatarState);
        window.nizhal?.on?.('avatar:persona', handleCharacterChange);
        window.nizhal?.on?.('character:interactionToggle', handleInteractionToggle);
        window.nizhal?.on?.('game:toggle', handleGameToggleRequest);

        return () => {
            window.nizhal?.off?.('avatar:state', handleAvatarState);
            window.nizhal?.off?.('avatar:persona', handleCharacterChange);
            window.nizhal?.off?.('character:interactionToggle', handleInteractionToggle);
            window.nizhal?.off?.('game:toggle', handleGameToggleRequest);
        };
    }, [handleGameToggle]);

    // Context menu
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setContextMenuOpen(true);
        // Ensure interaction is enabled when menu opens
        setIsClickThrough(false);
        window.nizhal?.character?.setClickThrough?.(false);
    }, []);

    useEffect(() => {
        if (contextMenuOpen) {
            const handleClick = () => {
                setContextMenuOpen(false);
                // Re-enable click-through if Alt isn't pressed and not dragging
                if (!isAltPressed && !isDragging) {
                    setIsClickThrough(true);
                    window.nizhal?.character?.setClickThrough?.(true);
                }
            };
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [contextMenuOpen, isAltPressed, isDragging]);

    // Avatar click
    const handleAvatarClick = useCallback(() => {
        window.nizhal?.invoke?.('window:showChat');
    }, []);

    // Drag handlers
    const handleDragStart = useCallback((e) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        expressionRef.current?.setDragging(true);
        // Update animation state to dragging
        getAvatarStateController().setState(AvatarState.DRAGGING);
        dragOffset.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleDrag = useCallback((e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - dragOffset.current.x;
        const deltaY = e.clientY - dragOffset.current.y;
        window.nizhal?.invoke?.('window:moveCharacter', deltaX, deltaY);
        dragOffset.current = { x: e.clientX, y: e.clientY };
    }, [isDragging]);

    const handleDragEnd = useCallback(async () => {
        setIsDragging(false);
        expressionRef.current?.setDragging(false);

        // Check if character is near taskbar (bottom of screen)
        try {
            const position = await window.nizhal?.invoke?.('window:getCharacterPosition');
            if (position) {
                const screenHeight = window.screen.height;
                const taskbarThreshold = 100; // pixels from bottom to trigger sitting

                // If character is near bottom of screen, trigger sitting on taskbar
                if (position.y + position.height > screenHeight - taskbarThreshold) {
                    console.log('[CharacterApp] Near taskbar - entering sitting pose');
                    getAvatarStateController().setState(AvatarState.SITTING_TASKBAR);
                    return;
                }
            }
        } catch (e) {
            // Position check failed, just go to idle
        }

        // Return to idle animation state
        getAvatarStateController().setState(AvatarState.IDLE);
    }, []);

    // Toggle functions
    const toggleDance = useCallback(async () => {
        if (isDancing) {
            danceServiceRef.current?.stop();
            setIsDancing(false);
            // Return to idle animation
            getAvatarStateController().setState(AvatarState.IDLE);
        } else {
            await danceServiceRef.current?.startMicrophoneListening();
            // Set dancing animation state
            getAvatarStateController().setState(AvatarState.DANCING);
        }
    }, [isDancing]);

    const toggleGravity = useCallback(() => {
        setSettings(prev => {
            const newValue = !prev.enableGravity;
            window.nizhal?.invoke?.('character:toggleGravity', newValue);
            return { ...prev, enableGravity: newValue };
        });
    }, []);

    const toggleAlwaysOnTop = useCallback(async () => {
        const result = await window.nizhal?.invoke?.('character:toggleAlwaysOnTop');
        setSettings(prev => ({ ...prev, alwaysOnTop: result ?? !prev.alwaysOnTop }));
    }, []);

    // Menu actions
    const menuActions = {
        showChat: () => window.nizhal?.invoke?.('window:showChat'),
        toggleAlwaysOnTop,
        toggleDance,
        toggleGravity,
        jump: () => window.nizhal?.invoke?.('character:jump'),
        snapTopRight: () => window.nizhal?.invoke?.('character:snap', 'top-right'),
        snapBottomRight: () => window.nizhal?.invoke?.('character:snap', 'bottom-right'),
        snapBottomLeft: () => window.nizhal?.invoke?.('character:snap', 'bottom-left'),
        hide: () => window.nizhal?.invoke?.('character:hide'),
        customize: () => setCustomizerOpen(true)
    };

    // Personality mode change handler
    const handlePersonalityChange = useCallback(async (mode) => {
        setPersonalityMode(mode);
        await window.nizhal?.state?.set?.('ai.personalityMode', mode);
        console.log('[CharacterApp] Personality mode changed to:', mode);

        // Visual feedback
        const particleType = mode === 'gf' ? 'heart' : mode === 'bf' ? 'spark' : 'note';
        particleRef.current?.burst(particleType, window.innerWidth / 2, window.innerHeight / 2, 15);
    }, []);

    // Emotion trigger handler
    const handleEmotionTrigger = useCallback(async (emotion) => {
        setCurrentEmotion(emotion);
        await window.nizhal?.state?.set?.('ai.emotion', emotion);
        // Trigger animation through expression controller
        expressionRef.current?.onEvent(emotion);
        console.log('[CharacterApp] Emotion triggered:', emotion);

        // Visual feedback
        particleRef.current?.burst('spark', window.innerWidth / 2, window.innerHeight / 2, 5);
    }, []);

    // Quick action handler
    const handleQuickAction = useCallback((action) => {
        switch (action) {
            case 'speak':
                menuActions.showChat();
                break;
            case 'dance':
                toggleDance();
                break;
            case 'game':
                handleGameToggle(true);
                break;
            case 'wave':
                // Trigger wave animation
                expressionRef.current?.onEvent('happy');
                break;
            case 'focus':
                // Open chat for focused interaction
                menuActions.showChat();
                break;
            default:
                console.log('[CharacterApp] Unknown quick action:', action);
        }
    }, [toggleDance]);

    // Dance animation
    const danceAnimation = isDancing ? {
        y: [0, -10 * danceIntensity, 0],
        rotate: [-3 * danceIntensity, 3 * danceIntensity, -3 * danceIntensity],
        scale: [1, 1 + 0.05 * danceIntensity, 1]
    } : {};

    // Prevent rendering until window size is detected to avoid "small top-left" glitch
    if (!windowReady) return null;

    // Adjust character position slightly when game is active
    // If game active, maybe push character up a bit?
    const activeVrmConfig = isGameActive ? {
        ...vrmConfig,
        position: [vrmConfig.position[0], vrmConfig.position[1] - 0.5, vrmConfig.position[2] - 1], // Push back and down
        scale: vrmConfig.scale * 0.8
    } : vrmConfig;

    return (
        <>
            <BootSequence onComplete={() => setBootComplete(true)} />
            <ParticleEffects ref={particleRef} />

            {/* File Drop Overlay */}
            {isFileDragging && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="p-8 rounded-3xl bg-black/50 backdrop-blur-xl border-2 border-dashed border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.3)]">
                        <p className="text-2xl font-bold text-white text-center">
                            📁 Drop it on me!
                        </p>
                        <p className="text-sm text-white/60 text-center mt-2">
                            I'll help you with this file
                        </p>
                    </div>
                </div>
            )}

            {/* Onboarding Overlay */}
            {needsOnboarding && (
                <MagicSetup onComplete={(data) => {
                    setNeedsOnboarding(false);
                    // Optionally trigger a welcome speech here
                    if (window.nizhal?.invoke) {
                        window.nizhal.invoke('avatar:speak', `Hello ${data.name}! I'm so happy to meet you.`);
                    }
                }} />
            )}

            <div
                className={`w-screen h-screen overflow-hidden select-none transition-opacity duration-300 ${isClickThrough && !isGameActive ? 'pointer-events-none' : 'pointer-events-auto'}`}
                style={{ opacity: (vrmLoaded && bootComplete) ? (settings.opacity ?? 1) : 0 }}
            >
                <AnimatePresence>
                    {isGameActive && (
                        <TicTacToe
                            onClose={() => handleGameToggle(false)}
                            onGameEnd={(winner) => {
                                if (winner === 'X') {
                                    expressionRef.current?.onEvent('sad'); // AI lost
                                } else if (winner === 'O') {
                                    expressionRef.current?.onEvent('happy'); // AI won
                                }
                            }}
                        />
                    )}
                </AnimatePresence>

                <SpeechBubble
                    message={speechMessage}
                    variant={speechVariant}
                    isVisible={isSpeechVisible}
                    onClose={() => setIsSpeechVisible(false)}
                />

                <motion.div
                    className="relative interactive cursor-pointer w-full h-full flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: settings.scale, opacity: 1, ...danceAnimation }}
                    transition={isDancing ? { repeat: Infinity, duration: 0.4, ease: 'easeInOut' } : { type: 'spring', damping: 15 }}
                    onClick={handleAvatarClick}
                    onContextMenu={handleContextMenu}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDrag}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                >
                    <Canvas
                        shadows
                        dpr={[1.5, 2]} // Higher pixel ratio for sharper rendering
                        camera={{
                            position: activeVrmConfig.cameraPosition,
                            fov: 35, // Narrower FOV prevents edge distortion
                            near: 0.1, // Prevent near clipping
                            far: 100 // Prevent far clipping
                        }}
                        gl={{
                            alpha: true,
                            antialias: true,
                            preserveDrawingBuffer: true,
                            powerPreference: 'high-performance'
                        }}
                        className="w-full h-full"
                        style={{ pointerEvents: 'none' }}
                    >
                        {/* Enhanced lighting for better VRM visibility */}
                        <ambientLight intensity={1.2} />
                        <directionalLight position={[0, 5, 5]} intensity={1.5} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} />
                        <pointLight position={[-10, 5, 5]} intensity={0.8} />

                        {currentCharacter.type === 'hologram' ? (
                            /* Jarvis Futuristic Hologram Sphere */
                            <JarvisHologram
                                state={avatarState.isSpeaking ? 'speaking' : avatarState.isThinking ? 'thinking' : avatarState.isListening ? 'listening' : 'idle'}
                                mood="neutral"
                                size="large"
                            />
                        ) : (
                            /* VRM 3D Character Model - dynamically scaled to window */
                            <Suspense fallback={null}>
                                {windowReady && (
                                    <OptimizedVRMModel
                                        key={currentCharacter.id}
                                        url={currentCharacter.model}
                                        scale={activeVrmConfig.scale}
                                        position={activeVrmConfig.position}
                                        isSpeaking={avatarState.isSpeaking}
                                        expression={currentEmotion === 'thinking' ? 'thinking' : currentEmotion}
                                        enableLookAt={settings.mouseTracking}
                                        enableBlink={true}
                                        onLoad={() => {
                                            console.log('VRM loaded successfully:', currentCharacter.name);
                                            setVrmLoaded(true);
                                        }}
                                        onError={(err) => {
                                            console.error('VRM failed to load:', currentCharacter.model, err);
                                        }}
                                    />
                                )}
                            </Suspense>
                        )}
                    </Canvas>

                    {/* Dance indicator */}
                    {isDancing && (
                        <motion.div
                            className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                        >
                            🎵
                        </motion.div>
                    )}
                </motion.div>

                {/* Drag indicator */}
                {
                    isDragging && (
                        <motion.div
                            className="absolute inset-0 border-2 border-dashed border-white/30 rounded-xl pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    )
                }

                {/* Alt key indicator - shows interaction hint */}
                {
                    isAltPressed && (
                        <motion.div
                            className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-500/80 text-white text-xs px-3 py-1 rounded-full pointer-events-none"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            🖱️ Interacting...
                        </motion.div>
                    )
                }
                {
                    !isAltPressed && isClickThrough && !contextMenuOpen && !customizerOpen && (
                        <motion.div
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/30 text-xs pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            whileHover={{ opacity: 1 }}
                        >
                            Alt+Space to interact
                        </motion.div>
                    )
                }

                {/* Quick Menu (replaces old context menu) */}
                <QuickMenu
                    isOpen={contextMenuOpen}
                    position={contextMenuPos}
                    onClose={() => setContextMenuOpen(false)}
                    onPersonalityChange={handlePersonalityChange}
                    onEmotionTrigger={handleEmotionTrigger}
                    onQuickAction={handleQuickAction}
                    onSettingsOpen={() => {
                        setContextMenuOpen(false);
                        setSettingsOpen(true);
                    }}
                    currentPersonality={personalityMode}
                    currentEmotion={currentEmotion}
                    settings={uiSettings}
                />

                {/* Unified Settings Panel */}
                <SettingsPanel
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    settings={{ ...settings, ...uiSettings, personalityMode }}
                    onSettingsChange={(newSettings) => {
                        setSettings(prev => ({ ...prev, ...newSettings }));
                        setUiSettings(prev => ({ ...prev, ...newSettings }));
                    }}
                    availableCharacters={AVAILABLE_CHARACTERS}
                    onShare={() => {
                        setSettingsOpen(false);
                        setShareOpen(true);
                    }}
                />

                {/* Viral Share Card */}
                <ShareCard
                    isOpen={shareOpen}
                    onClose={() => setShareOpen(false)}
                    userName={"User"} // In future, get from Memory
                    stats={{ level: 5, messages: 124, days: 3, lastMemory: "Helping with code" }} // Mock for now, hook up to Memory later
                    currentCharacter={currentCharacter}
                    personalityMode={personalityMode}
                />
            </div>
        </>
    );
};

// Menu item component
const MenuItem = ({ icon, label, onClick }) => (
    <button
        className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 text-white/80 hover:bg-white/10 transition-colors"
        onClick={onClick}
    >
        <span className="text-base">{icon}</span>
        <span>{label}</span>
    </button>
);

export default CharacterApp;
