import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MusicDanceService } from '../../services/MusicDanceService';
import { ExpressionController } from '../../services/ExpressionController';
import { getAvatarStateController, AvatarState } from '../../services/AvatarStateController';
import { windowSittingService } from '../../services/WindowSitting';
import { companionPersonality } from '../../services/CompanionPersonality';
import { cuteErrorHandler } from '../../services/CuteErrorHandler';
import { surpriseService } from '../../services/SurpriseService';
import CharacterCustomizer from '../components/CharacterCustomizer';
import SpeechBubble from '../components/avatar/SpeechBubble';
import QuickMenu from '../components/QuickMenu';
import ShareCard from '../components/ShareCard';
import SettingsView from '../components/SettingsView';
import TicTacToe from '../components/TicTacToe';
import MobileAvatar2D from '../components/avatar/MobileAvatar2D';
import AvatarWindow from '../../components/AvatarWindow';
import { Platform } from '../../services/PlatformBridge';

import { useTheme } from '../hooks/useTheme';
import { useFileDrop, getFileDescription } from '../hooks/useFileDrop';
import '../styles/glass.css';

// Conditionally import Three.js stack — only loaded on HIGH/MEDIUM tier devices
// This saves ~800KB+ of JS on low-end mobile devices
let Canvas, extend, THREE;
try {
    const fiber = await import('@react-three/fiber');
    Canvas = fiber.Canvas;
    extend = fiber.extend;
    THREE = await import('three');
} catch (e) {
    console.warn('[CharacterApp] Three.js not available, using 2D fallback');
}

// Lazy-load heavy 3D components only when needed
const OptimizedVRMModel = lazy(() =>
    import('../components/avatar/OptimizedVRMAvatar').then(module => ({ default: module.OptimizedVRMModel }))
);
const JarvisHologram = lazy(() => import('../components/avatar/JarvisHologram'));
const ParticleEffects = lazy(() => import('../components/ParticleEffects'));

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
    // Device capability tier: 'high', 'medium', 'low'
    const [deviceTier, setDeviceTier] = useState('medium');
    const [platformReady, setPlatformReady] = useState(false);
    const isMobile = Platform.isMobile();
    const shouldUse3D = Canvas && (deviceTier === 'high' || deviceTier === 'medium');

    // Initialize platform detection on mount
    useEffect(() => {
        Platform.init().then(() => {
            setDeviceTier(Platform.getDeviceTier());
            setPlatformReady(true);
            console.log(`[CharacterApp] Device tier: ${Platform.getDeviceTier()}, Mobile: ${Platform.isMobile()}, 3D: ${Platform.shouldUse3D()}`);
        });
    }, []);

    // Unified settings state
    const [userProfile, setUserProfile] = useState({
        name: '',
        vibe: 50,
        relationship: 'friend'
    });

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
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [isDancing, setIsDancing] = useState(false);
    const [danceIntensity, setDanceIntensity] = useState(0);
    const [vrmLoaded, setVrmLoaded] = useState(false);
    const [isClickThrough, setIsClickThrough] = useState(true);
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [windowReady, setWindowReady] = useState(false);
    const [isGameActive, setIsGameActive] = useState(false);
    const [isScreensaver, setIsScreensaver] = useState(false);
    const [bootComplete, setBootComplete] = useState(false);
    // In-canvas character position (pixels offset from center)
    const [characterPosition, setCharacterPosition] = useState({ x: 0, y: 0 });
    const [localScaleOffset, setLocalScaleOffset] = useState(1.0);
    const previousWindowSize = useRef(null);
    const isPositionInitialized = useRef(false);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const dragStartCharPos = useRef({ x: 0, y: 0 });
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

    // Toggle Settings with Fullscreen
    const handleSettingsToggle = useCallback(async (open) => {
        if (open) {
            if (settingsOpen) return;

            // 1. Close context menu immediately for responsiveness
            setContextMenuOpen(false);

            // 2. Open settings modal
            setSettingsOpen(true);

            // 3. Resize window (async, non-blocking for UI)
            try {
                // Save current size and position
                const currentPos = await window.nizhal?.character?.getPosition?.() || { x: 0, y: 0 };
                previousWindowSize.current = { ...windowSize, x: currentPos.x, y: currentPos.y };

                const { width, height } = window.screen;
                await window.nizhal?.character?.setSize?.(width, height);
                await window.nizhal?.character?.setPosition?.(0, 0);
            } catch (err) {
                console.error("Failed to resize for settings:", err);
            }
        } else {
            setSettingsOpen(false);

            // Restore size
            try {
                if (previousWindowSize.current) {
                    await window.nizhal?.character?.setSize?.(
                        previousWindowSize.current.width,
                        previousWindowSize.current.height
                    );
                    // Restore position if we have it
                    if (previousWindowSize.current.x !== undefined) {
                        await window.nizhal?.character?.setPosition?.(
                            previousWindowSize.current.x,
                            previousWindowSize.current.y
                        );
                    }
                }
            } catch (err) {
                console.error("Failed to restore window size:", err);
            }
        }
    }, [windowSize, settingsOpen]);

    // Get current character
    const currentCharacter = useMemo(() =>
        AVAILABLE_CHARACTERS.find(c => c.id === settings.character) || AVAILABLE_CHARACTERS[0],
        [settings.character]
    );

    // Reset loaded state when character model changes to guarantee smooth transitions
    useEffect(() => {
        setVrmLoaded(false);
    }, [currentCharacter.model]);

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
                    if (globalState.user?.profile) {
                        setUserProfile(globalState.user.profile);
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
        const unsubState = window.nizhal?.state?.subscribe?.(['ai', 'vrm', 'ui', 'user'], (data) => {
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
            if (data.path?.startsWith('user.profile')) {
                setUserProfile(data.value);
            }
        });

        const mapEmotionToState = (emotion) => {
            const emotionStateMap = {
                happy: AvatarState.HAPPY,
                sad: AvatarState.SAD,
                excited: AvatarState.EXCITED,
                thinking: AvatarState.THINKING,
                neutral: AvatarState.IDLE
            };
            return emotionStateMap[emotion] || AvatarState.IDLE;
        };

        // Subscribe to emotion changes for animations
        const unsubEmotion = window.nizhal?.state?.onEmotionChange?.((data) => {
            setCurrentEmotion(data.emotion);
            // Trigger expression animation
            expressionRef.current?.onEvent(data.emotion);
            getAvatarStateController().setState(mapEmotionToState(data.emotion));
        });

        // Subscribe to direct VRM model changes (faster than state sync)
        const unsubVRM = window.nizhal?.state?.onVRMChange?.((modelId) => {
            console.log('Received direct VRM model change:', modelId);
            setSettings(prev => ({ ...prev, character: modelId }));
        });

        // Listen for local vision events (faster than IPC)
        const handleLocalEmotion = (e) => {
            const emotion = e.detail;
            setCurrentEmotion(emotion);
            expressionRef.current?.onEvent(emotion);
            getAvatarStateController().setState(mapEmotionToState(emotion));
        };
        window.addEventListener('nizhal-emotion', handleLocalEmotion);

        return () => {
            unsubState?.();
            unsubEmotion?.();
            unsubVRM?.();
            window.removeEventListener('nizhal-emotion', handleLocalEmotion);
        };
    }, []);

    // Track window size for responsive VRM scaling
    useEffect(() => {
        const updateSize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (w > 0 && h > 0) {
                setWindowSize({ width: w, height: h });
                if (!isPositionInitialized.current && w > 100 && h > 100) {
                    isPositionInitialized.current = true;
                    // Place avatar at bottom-right by default
                    const defaultX = (w / 2) - 210; 
                    const defaultY = (h / 2) - 280; 
                    setCharacterPosition({ x: defaultX, y: defaultY });
                }
                // Mark window as ready once we have valid dimensions
                if (!windowReady && w > 100 && h > 100) {
                    setWindowReady(true);
                }
            }
        };

        // Initial check immediately
        updateSize();

        // Polling checks to ensure we catch the final window size after App startup/maximize
        const timers = [
            setTimeout(updateSize, 100),
            setTimeout(updateSize, 500),
            setTimeout(updateSize, 1000),
            setTimeout(updateSize, 2000),
            // Force a resize event after a slight delay to ensure canvas catches up
            setTimeout(() => window.dispatchEvent(new Event('resize')), 1500)
        ];

        window.addEventListener('resize', updateSize);

        return () => {
            timers.forEach(t => clearTimeout(t));
            window.removeEventListener('resize', updateSize);
        };
    }, [windowReady]);

    // Auto-clamp character position when window size or scale changes to prevent it from going off-screen
    useEffect(() => {
        const sWidth = windowSize.width || window.innerWidth;
        const sHeight = windowSize.height || window.innerHeight;
        if (sWidth <= 0 || sHeight <= 0) return;

        const canvasWidth = 420 * localScaleOffset;
        const canvasHeight = 560 * localScaleOffset;

        const minX = -sWidth / 2 + 30 * localScaleOffset;
        const maxX = sWidth / 2 - 30 * localScaleOffset;

        const minY = -sHeight / 2 + 50 * localScaleOffset;
        const maxY = sHeight / 2 - 50 * localScaleOffset;

        setCharacterPosition(prev => {
            const newX = Math.max(minX, Math.min(maxX, prev.x));
            const newY = Math.max(minY, Math.min(maxY, prev.y));
            if (newX !== prev.x || newY !== prev.y) {
                console.log(`[CharacterApp] Window resized/scaled. Clamping position from {x: ${prev.x}, y: ${prev.y}} to {x: ${newX}, y: ${newY}}`);
                return { x: newX, y: newY };
            }
            return prev;
        });
    }, [windowSize, localScaleOffset]);

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

        // Move model down significantly so head is visible only in screensaver mode (adjusted lower to prevent cropping)
        const positionY = isScreensaver ? -3.2 : -1.0;

        // Allow larger scale in screensaver mode
        const maxScale = isScreensaver ? 3.0 : 1.5;

        // Virtual Screen Position approximation
        window.nizhalCharacterScreenPos = {
            x: width / 2 - 150,
            y: height / 2 + 100, // roughly where feet would land relative to center
            width: 300,
            height: height / 2, // virtual collision height
        };

        return {
            scale: Math.max(0.8, Math.min(maxScale, scaleFactor)), // Smaller scale to fit full body
            position: [0, positionY, 0], // Lower position
            cameraPosition: [0, 0.5, cameraZ] // Camera at mid-height, further back
        };
    }, [windowSize, isScreensaver]);

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
        window.nizhal?.on?.('system:idle', (data) => {
            console.log('Received system idle', data);

            if (data?.isFullscreen) {
                setIsScreensaver(true);
                getAvatarStateController().setState(AvatarState.DANCING); // Or just idle? Maybe floating?
            } else {
                getAvatarStateController().setState(AvatarState.SLEEPING);
            }

            setSpeechMessage('Zzz...');
            setIsSpeechVisible(true);
        });

        window.nizhal?.on?.('system:resume', () => {
            console.log('Received system resume');
            setIsScreensaver(false);
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
            setAvatarState(prev => {
                const nextState = { ...prev, ...data };
                if (data.isThinking) {
                    expressionRef.current?.onEvent('thinking');
                    getAvatarStateController().setState(AvatarState.THINKING);
                } else if (data.isSpeaking) {
                    expressionRef.current?.onEvent('speaking');
                    getAvatarStateController().setState(AvatarState.SPEAKING);
                } else if (data.isThinking === false || data.isSpeaking === false) {
                    if (!nextState.isThinking && !nextState.isSpeaking) {
                        getAvatarStateController().setState(AvatarState.IDLE);
                    }
                }
                return nextState;
            });
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

        const handleResetTransform = () => {
            console.log('[CharacterApp] Reset character transform event received');
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (w > 0 && h > 0) {
                const defaultX = (w / 2) - 210; 
                const defaultY = (h / 2) - 280; 
                setCharacterPosition({ x: defaultX, y: defaultY });
            }
        };

        const handleAvatarSpeak = (payload) => {
            const text = typeof payload === 'string' ? payload : (payload?.text || payload?.message || '');
            if (text) {
                setSpeechMessage(text);
                setSpeechVariant(payload?.variant || 'default');
                setIsSpeechVisible(true);
            }
        };

        window.nizhal?.on?.('avatar:state', handleAvatarState);
        window.nizhal?.on?.('avatar:persona', handleCharacterChange);
        window.nizhal?.on?.('avatar:speak', handleAvatarSpeak);
        window.nizhal?.on?.('character:interactionToggle', handleInteractionToggle);
        window.nizhal?.on?.('game:toggle', handleGameToggleRequest);
        window.nizhal?.on?.('reset-character-transform', handleResetTransform);

        return () => {
            window.nizhal?.off?.('avatar:state', handleAvatarState);
            window.nizhal?.off?.('avatar:persona', handleCharacterChange);
            window.nizhal?.off?.('avatar:speak', handleAvatarSpeak);
            window.nizhal?.off?.('character:interactionToggle', handleInteractionToggle);
            window.nizhal?.off?.('game:toggle', handleGameToggleRequest);
            window.nizhal?.off?.('reset-character-transform', handleResetTransform);
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
        if (isScreensaver) {
            // Wake up if clicked in screensaver
            window.nizhal?.invoke?.('show_chat_window'); // Or just wake up
            // Main process should handle the click and restore too?
            // Actually the click might not propagate if window is clickthrough but we enable interaction?
            // For now, assume it works.
        } else {
            window.nizhal?.invoke?.('show_chat_window');
        }
    }, [isScreensaver]);

    // Initialize Surprise Service
    useEffect(() => {
        // Handle surprise events
        const cleanup = surpriseService.onSurprise((type, data) => {
            console.log('[CharacterApp] Surprise event:', type, data);

            switch (type) {
                case 'emote':
                    expressionRef.current?.onEvent(data);
                    particleRef.current?.burst(data === 'love' ? 'heart' : 'spark', window.innerWidth / 2, window.innerHeight / 2, 10);
                    break;
                case 'message':
                    setSpeechMessage(data);
                    setIsSpeechVisible(true);
                    break;
                case 'spin':
                    getAvatarStateController().setState(AvatarState.DANCING);
                    setTimeout(() => getAvatarStateController().setState(AvatarState.IDLE), 2000);
                    break;
            }
        });

        if (isScreensaver) {
            surpriseService.start(true); // Frequent surprises in screensaver
        } else {
            // Start infrequent background surprises
            surpriseService.start(false);
        }

        return () => {
            surpriseService.stop();
            cleanup();
        };
    }, [isScreensaver]);

    // Drag handlers — moves the 3D model WITHIN the full-screen canvas
    const handleDragStart = useCallback((e) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        expressionRef.current?.setDragging(true);
        getAvatarStateController().setState(AvatarState.DRAGGING);
        // Record starting mouse position and current character position
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStartPos.current = { x: clientX, y: clientY };
        dragStartCharPos.current = { ...characterPosition };
    }, [characterPosition]);

    const handleDrag = useCallback((e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaX = clientX - dragStartPos.current.x;
        const deltaY = clientY - dragStartPos.current.y;

        const sWidth = windowSize.width || window.innerWidth;
        const sHeight = windowSize.height || window.innerHeight;

        const targetX = dragStartCharPos.current.x + deltaX;
        const targetY = dragStartCharPos.current.y + deltaY;

        // Keep 3D canvas strictly contained within the window viewport,
        // allowing transparent margins to overflow just enough for visible model borders to reach screen limits.
        const minX = -sWidth / 2 + 30 * localScaleOffset;
        const maxX = sWidth / 2 - 30 * localScaleOffset;

        // Vertically clamp to keep character grounded, allowing transparent padding to overflow just enough for head/feet to touch screen borders
        const minY = -sHeight / 2 + 50 * localScaleOffset; // Allow top of canvas to go off-screen so head can touch top border
        const maxY = sHeight / 2 - 50 * localScaleOffset; // Allow bottom of canvas to go off-screen so feet can touch bottom border

        setCharacterPosition({
            x: Math.max(minX, Math.min(maxX, targetX)),
            y: Math.max(minY, Math.min(maxY, targetY))
        });
    }, [isDragging, windowSize, localScaleOffset]);

    const handleDragEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        expressionRef.current?.setDragging(false);

        // Check if character is near taskbar (bottom of screen)
        const screenHeight = windowSize.height || window.innerHeight;
        const taskbarThreshold = 100; // pixels from bottom
        // characterPosition.y is offset from center; positive = downward
        const feetY = (screenHeight / 2) + characterPosition.y;

        if (feetY > screenHeight - taskbarThreshold) {
            console.log('[CharacterApp] Near taskbar — entering sitting pose');
            // Snap to exact taskbar edge
            setCharacterPosition(prev => ({
                ...prev,
                y: (screenHeight / 2) - taskbarThreshold + 30
            }));
            getAvatarStateController().setState(AvatarState.SITTING_TASKBAR);
            return;
        }

        // Return to idle
        getAvatarStateController().setState(AvatarState.IDLE);
    }, [isDragging, characterPosition, windowSize]);

    // Wheel resize handler
    const handleWheel = useCallback((e) => {
        if (!isAltPressed) return;
        // Provide consistent scaling regardless of mouse wheel tick size
        const direction = Math.sign(e.deltaY);
        setLocalScaleOffset(prev => {
            // Zoom out if scrolling down (direction > 0), zoom in if scrolling up
            const step = 0.15; 
            const newScale = prev - (direction * step);
            return Math.max(0.1, Math.min(3.5, newScale));
        });
    }, [isAltPressed]);

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
        const result = await window.nizhal?.invoke?.('toggle_character_always_on_top');
        setSettings(prev => ({ ...prev, alwaysOnTop: result ?? !prev.alwaysOnTop }));
    }, []);

    // Menu actions
    const menuActions = {
        showChat: () => window.nizhal?.invoke?.('show_chat_window'),
        toggleAlwaysOnTop,
        toggleDance,
        toggleGravity,
        jump: () => {},
        snapTopRight: () => window.nizhal?.invoke?.('snap_character', { position: 'top-right' }),
        snapBottomRight: () => window.nizhal?.invoke?.('snap_character', { position: 'bottom-right' }),
        snapBottomLeft: () => window.nizhal?.invoke?.('snap_character', { position: 'bottom-left' }),
        hide: () => window.nizhal?.invoke?.('hide_character_window'),
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
    }, [toggleDance]); // Close handleQuickAction

    const handleProfileChange = useCallback(async (newProfile) => {
        setUserProfile(newProfile);
        await window.nizhal?.state?.set?.('user.profile', newProfile);
        console.log('[CharacterApp] Profile updated:', newProfile);
    }, []);

    // Dynamic zoom based on Idle/Active state (IDLE = 1.0x, ACTIVE = 0.85x)
    const [dynamicIdleScale, setDynamicIdleScale] = useState(1.0);
    
    useEffect(() => {
        // If the avatar is not thinking, speaking, or listening, they are IDLE
        const isIdle = !avatarState.isSpeaking && !avatarState.isThinking && !avatarState.isListening;
        
        // Target scale based on idle state
        setDynamicIdleScale(isIdle ? 1.0 : 0.85);
    }, [avatarState]);

    // NOTE: All character animations now come from VRMA files in /public/assets/animations
    // CSS-based dance/float animations have been removed to use only VRMA bone animations

    // Prevent rendering until window size is detected to avoid "small top-left" glitch
    if (!windowReady) return null;



    return (
        <>
            {/* Only load particle effects on capable devices */}
            {shouldUse3D && <Suspense fallback={null}><ParticleEffects ref={particleRef} /></Suspense>}

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

            <div
                className={`w-screen h-screen overflow-hidden select-none transition-opacity duration-300 ${isClickThrough && !isGameActive ? 'pointer-events-none' : 'pointer-events-auto'}`}
                style={{ opacity: (!shouldUse3D || vrmLoaded || currentCharacter.type === 'hologram') ? (uiSettings.transparency ?? settings.characterOpacity ?? settings.opacity ?? 0.95) : 0 }}
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

                {/* SpeechBubble moved inside dynamic avatar model container below for perfect sticky & adaptive positioning */}

                {/* Alt-Key Interactive UI Controls */}
                <AnimatePresence>
                    {isAltPressed && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4 p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 pointer-events-auto"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Scroll to Resize • Drag to Move</span>
                                <div className="flex gap-2">
                                    <button 
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors border border-slate-600 focus:outline-none"
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            const scales = [0.8, 1.0, 1.25, 1.5, 2.0];
                                            let nextScaleIdx = scales.findIndex(s => s > localScaleOffset);
                                            if (nextScaleIdx === -1) nextScaleIdx = 0;
                                            setLocalScaleOffset(scales[nextScaleIdx]);
                                        }}
                                        title={`Current Scale: ${localScaleOffset.toFixed(2)}x`}
                                    >
                                        Resize
                                    </button>

                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button 
                                        className="px-3 py-1.5 bg-pink-500/80 hover:bg-pink-500 text-white rounded-lg text-xs font-medium transition-colors border border-pink-400 focus:outline-none"
                                        onClick={(e) => { e.stopPropagation(); expressionRef.current?.onEvent('happy'); }}
                                    >👋 Wave</button>
                                    <button 
                                        className="px-3 py-1.5 bg-purple-500/80 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors border border-purple-400 focus:outline-none"
                                        onClick={(e) => { e.stopPropagation(); toggleDance(); }}
                                    >🎵 Dance</button>
                                    <button 
                                        className="px-3 py-1.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors border border-blue-400 focus:outline-none"
                                        onClick={(e) => { e.stopPropagation(); getAvatarStateController().setState(AvatarState.SLEEPING); }}
                                    >💤 Sleep</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    className="relative interactive cursor-pointer w-full h-full flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    onClick={handleAvatarClick}
                    onContextMenu={handleContextMenu}
                    onMouseDown={!isMobile ? handleDragStart : undefined}
                    onMouseMove={!isMobile ? handleDrag : undefined}
                    onMouseUp={!isMobile ? handleDragEnd : undefined}
                    onMouseLeave={!isMobile ? handleDragEnd : undefined}
                    onWheel={!isMobile ? handleWheel : undefined}
                    onTouchStart={isMobile ? handleDragStart : undefined}
                    onTouchMove={isMobile ? handleDrag : undefined}
                    onTouchEnd={isMobile ? handleDragEnd : undefined}
                >
                    {/* === ADAPTIVE RENDERING === */}
                    {/* LOW TIER / Mobile fallback: Lightweight 2D SVG avatar */}
                    {!shouldUse3D && (
                        <div className="flex items-center justify-center w-full h-full">
                            <MobileAvatar2D
                                characterId={settings.character}
                                emotion={currentEmotion}
                                isSpeaking={avatarState.isSpeaking}
                                isThinking={avatarState.isThinking}
                                isListening={avatarState.isListening}
                                size={Math.min(windowSize.width, windowSize.height) * 0.6}
                                onTap={handleAvatarClick}
                                onLongPress={() => {
                                    setContextMenuPos({ x: windowSize.width / 2, y: windowSize.height / 2 });
                                    setContextMenuOpen(true);
                                }}
                            />
                        </div>
                    )}

                    {/* HIGH/MEDIUM TIER: Robust Hardened Three.js VRM Viewport */}
                    {shouldUse3D && (
                        <div 
                            className="block"
                            style={{
                                width: 420 * localScaleOffset,
                                height: 560 * localScaleOffset,
                                pointerEvents: 'auto',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: `translate(calc(-50% + ${characterPosition.x}px), calc(-50% + ${characterPosition.y}px))`
                            }}
                        >
                            <AvatarWindow
                                modelUrl={currentCharacter.model}
                                expression={currentEmotion === 'thinking' ? 'thinking' : currentEmotion}
                                isSpeaking={avatarState.isSpeaking}
                                onLoad={() => setVrmLoaded(true)}
                            />
                            <SpeechBubble
                                message={speechMessage}
                                variant={speechVariant}
                                isVisible={isSpeechVisible}
                                onClose={() => setIsSpeechVisible(false)}
                                scale={localScaleOffset}
                            />
                        </div>
                    )}

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

                {/* Desktop Alt key indicator - shows interaction hint */}
                {
                    !isMobile && isAltPressed && (
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
                    !isMobile && !isAltPressed && isClickThrough && !contextMenuOpen && !customizerOpen && (
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

                {/* Mobile Bottom Navigation Layout constraints */}
                {isMobile && (
                    <motion.div 
                        className="absolute bottom-0 w-full p-4 flex justify-around items-center bg-gradient-to-t from-black/80 to-transparent pointer-events-auto shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-50 rounded-t-3xl border-t border-white/10 backdrop-blur-md pb-6"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <button onClick={() => setContextMenuOpen(true)} className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                            <span className="text-2xl">✨</span>
                            <span className="text-[10px] font-medium text-white tracking-wide">Actions</span>
                        </button>
                        
                        <button onClick={handleAvatarClick} className="w-14 h-14 bg-blue-500/80 hover:bg-blue-400 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white/20 transform hover:scale-105 transition-all">
                            🎤
                        </button>

                        <button onClick={() => handleSettingsToggle(true)} className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                            <span className="text-2xl">⚙️</span>
                            <span className="text-[10px] font-medium text-white tracking-wide">Settings</span>
                        </button>
                    </motion.div>
                )}

                {/* Quick Menu (replaces old context menu) */}
                <QuickMenu
                    isOpen={contextMenuOpen}
                    position={contextMenuPos}
                    onClose={() => setContextMenuOpen(false)}
                    onPersonalityChange={handlePersonalityChange}
                    onEmotionTrigger={handleEmotionTrigger}
                    onQuickAction={handleQuickAction}
                    onSettingsOpen={() => handleSettingsToggle(true)}
                    currentPersonality={personalityMode}
                    currentEmotion={currentEmotion}
                    settings={uiSettings}
                />

                {/* Unified Settings Panel with Mobile Responsiveness */}
                <AnimatePresence>
                    {settingsOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-200" onClick={() => handleSettingsToggle(false)}>
                            <div
                                className={`w-full ${isMobile ? 'h-full max-h-[90vh] mt-auto rounded-t-3xl pt-2' : 'h-[600px] max-w-[800px] rounded-2xl mx-4'} bg-black/80 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl relative flex flex-col`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {isMobile && (
                                    <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2" />
                                )}
                                <SettingsView
                                    onClose={() => handleSettingsToggle(false)}
                                    userProfile={userProfile}
                                    onProfileChange={handleProfileChange}
                                    isModal={true}
                                    onPersonaChange={(persona) => {
                                        setPersonalityMode(persona.id);
                                        setSettings(prev => ({ ...prev, character: persona.id }));
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Viral Share Card */}
                <ShareCard
                    isOpen={shareOpen}
                    onClose={() => setShareOpen(false)}
                    userName={userProfile.name || "User"} // In future, get from Memory
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
