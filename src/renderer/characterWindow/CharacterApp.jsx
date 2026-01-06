import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { MusicDanceService } from '../../services/MusicDanceService';
import { ExpressionController } from '../../services/ExpressionController';
import { getAvatarStateController, AvatarState } from '../../services/AvatarStateController';
import { windowSittingService } from '../../services/WindowSitting';
import { companionPersonality } from '../../services/CompanionPersonality';
import { cuteErrorHandler } from '../../services/CuteErrorHandler';
import CharacterCustomizer from '../components/CharacterCustomizer';
import JarvisHologram from '../components/avatar/JarvisHologram';
import SpeechBubble from '../components/avatar/SpeechBubble';

// Lazy load VRM avatar for performance
const OptimizedVRMAvatar = lazy(() => import('../components/avatar/OptimizedVRMAvatar'));

// Available characters - includes both VRM models and special avatars
const AVAILABLE_CHARACTERS = [
    { id: 'jarvis', name: 'Jarvis', type: 'hologram', model: null }, // Futuristic hologram sphere
    { id: 'zome', name: 'Zome', type: 'vrm', model: '/assets/models/zome.vrm' },
    { id: 'lazuli', name: 'Lazuli', type: 'vrm', model: '/assets/models/lazuli.vrm' },
    { id: 'aldina', name: 'Aldina', type: 'vrm', model: '/assets/models/aldina.vrm' }
];

/**
 * CharacterApp - Optimized standalone character window
 */
const CharacterApp = () => {
    // Unified settings state
    const [settings, setSettings] = useState({
        character: 'jarvis', // Default to Jarvis hologram
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

    // Speech bubble state
    const [speechMessage, setSpeechMessage] = useState('');
    const [speechVariant, setSpeechVariant] = useState('default');
    const [isSpeechVisible, setIsSpeechVisible] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [customizerOpen, setCustomizerOpen] = useState(false);
    const [isDancing, setIsDancing] = useState(false);
    const [danceIntensity, setDanceIntensity] = useState(0);
    const [vrmLoaded, setVrmLoaded] = useState(false);
    const [isClickThrough, setIsClickThrough] = useState(true); // Click-through by default
    const [isAltPressed, setIsAltPressed] = useState(false);

    const dragOffset = useRef({ x: 0, y: 0 });
    const danceServiceRef = useRef(null);
    const expressionRef = useRef(null);

    // Get current character
    const currentCharacter = useMemo(() =>
        AVAILABLE_CHARACTERS.find(c => c.id === settings.character) || AVAILABLE_CHARACTERS[0],
        [settings.character]
    );

    // Initial load of settings from local storage
    useEffect(() => {
        const savedSettings = localStorage.getItem('character-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
    }, []);

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

        // Alt key detection via MouseMove (Works when window is blurred/transparent)
        // We rely on Electron forwarding mouse events even when click-through
        const handleMouseMove = (e) => {
            const isAlt = e.altKey;

            // Only update if state changes to avoid IPC spam
            if (isAlt !== isAltPressed) {
                setIsAltPressed(isAlt);

                // If Alt is pressed, make interactive. Else make click-through (unless menu open)
                if (isAlt) {
                    setIsClickThrough(false);
                    window.nizhal?.character?.setClickThrough?.(false);
                } else if (!contextMenuOpen && !customizerOpen) {
                    setIsClickThrough(true);
                    window.nizhal?.character?.setClickThrough?.(true);
                }
            }
        };

        const handleMouseEnter = () => {
            // Optional: Check focus or modify state
        };

        // When mouse leaves window, reset to non-interactive (safety)
        const handleMouseLeave = () => {
            if (!contextMenuOpen && !customizerOpen && !isDragging) {
                setIsAltPressed(false);
                setIsClickThrough(true);
                window.nizhal?.character?.setClickThrough?.(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Alt') {
                handleMouseMove({ altKey: false });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('keyup', handleKeyUp);
            clearInterval(complementTimer);
        };
    }, [isAltPressed, contextMenuOpen, customizerOpen, isDragging]);

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

        window.nizhal?.on?.('avatar:state', handleAvatarState);
        window.nizhal?.on?.('avatar:persona', handleCharacterChange);

        return () => {
            window.nizhal?.off?.('avatar:state', handleAvatarState);
            window.nizhal?.off?.('avatar:persona', handleCharacterChange);
        };
    }, []);

    // Context menu
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setContextMenuOpen(true);
    }, []);

    useEffect(() => {
        if (contextMenuOpen) {
            const handleClick = () => setContextMenuOpen(false);
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [contextMenuOpen]);

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

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        expressionRef.current?.setDragging(false);
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

    // Dance animation
    const danceAnimation = isDancing ? {
        y: [0, -10 * danceIntensity, 0],
        rotate: [-3 * danceIntensity, 3 * danceIntensity, -3 * danceIntensity],
        scale: [1, 1 + 0.05 * danceIntensity, 1]
    } : {};

    return (
        <div
            className="w-screen h-screen relative select-none"
            onContextMenu={handleContextMenu}
        >
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
                onMouseDown={handleDragStart}
                onMouseMove={handleDrag}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
            >
                <Canvas
                    shadows
                    camera={{ position: [0, 0, 5], fov: 50 }}
                    gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
                    className="w-full h-full"
                    style={{ pointerEvents: 'none' }} // Let clicks pass to parent if needed, or use specific events
                >
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    {currentCharacter.type === 'hologram' ? (
                        /* Jarvis Futuristic Hologram Sphere */
                        <JarvisHologram
                            state={avatarState.isSpeaking ? 'speaking' : avatarState.isThinking ? 'thinking' : avatarState.isListening ? 'listening' : 'idle'}
                            mood="neutral"
                            size="large"
                        />
                    ) : (
                        /* VRM 3D Character Model */
                        <Suspense fallback={null}>
                            <OptimizedVRMAvatar
                                key={currentCharacter.id}
                                modelUrl={currentCharacter.model}
                                size={{ width: 400, height: 600 }}
                                quality={settings.quality}
                                isSpeaking={avatarState.isSpeaking}
                                isThinking={avatarState.isThinking}
                                enableInteraction={settings.mouseTracking}
                                onLoad={() => {
                                    console.log('VRM loaded successfully:', currentCharacter.name);
                                    setVrmLoaded(true);
                                }}
                                onError={(err) => {
                                    console.error('VRM failed to load:', currentCharacter.model, err);
                                }}
                            />
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
                        Hold Alt to interact
                    </motion.div>
                )
            }

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenuOpen && (
                    <motion.div
                        className="fixed bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-2 min-w-52 z-50 interactive"
                        style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        <MenuItem icon="💬" label="Open Chat" onClick={menuActions.showChat} />
                        <MenuItem icon="🎨" label="Customize" onClick={menuActions.customize} />

                        <div className="h-px bg-white/10 my-1" />
                        <div className="px-3 py-1 text-xs text-white/40 uppercase">Features</div>

                        <MenuItem icon={isDancing ? "🛑" : "💃"} label={isDancing ? "Stop Dancing" : "Dance to Music"} onClick={menuActions.toggleDance} />
                        <MenuItem icon={settings.enableGravity ? "🎈" : "⬇️"} label={settings.enableGravity ? "Disable Gravity" : "Enable Gravity"} onClick={menuActions.toggleGravity} />
                        {settings.enableGravity && <MenuItem icon="🦘" label="Jump!" onClick={menuActions.jump} />}
                        <MenuItem icon={settings.alwaysOnTop ? "📍" : "📌"} label={settings.alwaysOnTop ? "Unpin" : "Pin to Top"} onClick={menuActions.toggleAlwaysOnTop} />

                        <div className="h-px bg-white/10 my-1" />
                        <div className="px-3 py-1 text-xs text-white/40 uppercase">Position</div>

                        <MenuItem icon="↗️" label="Top Right" onClick={menuActions.snapTopRight} />
                        <MenuItem icon="↘️" label="Bottom Right" onClick={menuActions.snapBottomRight} />
                        <MenuItem icon="↙️" label="Bottom Left" onClick={menuActions.snapBottomLeft} />

                        <div className="h-px bg-white/10 my-1" />
                        <MenuItem icon="🙈" label="Hide" onClick={menuActions.hide} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Customizer Panel */}
            <CharacterCustomizer
                isOpen={customizerOpen}
                onClose={() => setCustomizerOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
                availableCharacters={AVAILABLE_CHARACTERS}
            />
        </div >
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
