import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageAvatar from './ImageAvatar';
import JarvisHologram from './JarvisHologram';

// Lazy load VRM avatar for performance
const VRMAvatar = lazy(() => import('./VRMAvatar'));

// Persona configuration - defines avatar type and assets for each persona
const PersonaAvatarConfig = {
    // Mate-Engine VRM Characters (default)
    zome: {
        type: 'vrm',
        displayName: 'Zome',
        description: 'Cute anime companion from Mate-Engine',
        vrmModel: '/assets/models/zome.vrm'
    },
    lazuli: {
        type: 'vrm',
        displayName: 'Lazuli',
        description: 'Elegant VRM character',
        vrmModel: '/assets/models/lazuli.vrm'
    },
    aldina: {
        type: 'vrm',
        displayName: 'Aldina',
        description: 'Charming VRM avatar',
        vrmModel: '/assets/models/aldina.vrm'
    },
    // Original personas
    jarvis: {
        type: 'hologram',
        displayName: 'Jarvis'
    },
    kavya: {
        type: 'image',
        displayName: 'Kavya',
        imageSrc: '/assets/avatars/kavya-idle.png',
        altImageSrc: '/assets/avatars/kavya-thinking.png',
        speakingImageSrc: '/assets/avatars/kavya-speaking.png',
        vrmModel: '/assets/models/kavya.vrm'
    },
    arjun: {
        type: 'image',
        displayName: 'Arjun',
        imageSrc: '/assets/avatars/arjun-idle.png',
        altImageSrc: '/assets/avatars/arjun-thinking.png',
        speakingImageSrc: '/assets/avatars/arjun-speaking.png',
        vrmModel: '/assets/models/arjun.vrm'
    },
    miku: {
        type: 'vrm',
        displayName: 'Hatsune Miku',
        vrmModel: '/assets/models/miku.vrm'
    },
    naruto: {
        type: 'image',
        displayName: 'Naruto',
        imageSrc: '/assets/avatars/naruto-idle.png'
    },
    goku: {
        type: 'image',
        displayName: 'Goku',
        imageSrc: '/assets/avatars/goku-idle.png'
    },
    elsa: {
        type: 'image',
        displayName: 'Elsa',
        imageSrc: '/assets/avatars/elsa-idle.png'
    },
    tamil_nanban: {
        type: 'image',
        displayName: 'Nanban',
        imageSrc: '/assets/avatars/nanban-idle.png'
    },
    telugu_sneham: {
        type: 'image',
        displayName: 'Sneham',
        imageSrc: '/assets/avatars/sneham-idle.png'
    },
    hindi_dost: {
        type: 'image',
        displayName: 'Dost',
        imageSrc: '/assets/avatars/dost-idle.png'
    }
};

const AvatarStates = {
    IDLE: 'idle',
    LISTENING: 'listening',
    THINKING: 'thinking',
    SPEAKING: 'speaking',
    HAPPY: 'happy',
    CONCERNED: 'concerned',
    WAVING: 'waving'
};

const InteractiveAvatar = ({
    persona = 'jarvis',
    mood = 'neutral',
    isListening = false,
    isThinking = false,
    isSpeaking = false,
    onAvatarClick,
    size = 'medium'
}) => {
    const [currentState, setCurrentState] = useState(AvatarStates.IDLE);
    const [isHovered, setIsHovered] = useState(false);
    const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
    const [blinkState, setBlinkState] = useState(false);
    const avatarRef = useRef(null);
    const videoRef = useRef(null);
    const nextVideoRef = useRef(null);

    const sizeClasses = {
        small: 'w-24 h-24',
        medium: 'w-40 h-40',
        large: 'w-64 h-64',
        fullscreen: 'w-full h-full'
    };

    const personaColors = {
        jarvis: {
            primary: '#00d4ff',
            secondary: '#ff6b35',
            glow: 'rgba(0, 212, 255, 0.5)'
        },
        thozhi: {
            primary: '#ec4899',
            secondary: '#f472b6',
            glow: 'rgba(236, 72, 153, 0.5)'
        },
        thozhan: {
            primary: '#3b82f6',
            secondary: '#60a5fa',
            glow: 'rgba(59, 130, 246, 0.5)'
        }
    };

    const colors = personaColors[persona] || personaColors.jarvis;

    useEffect(() => {
        if (isListening) {
            setCurrentState(AvatarStates.LISTENING);
        } else if (isThinking) {
            setCurrentState(AvatarStates.THINKING);
        } else if (isSpeaking) {
            setCurrentState(AvatarStates.SPEAKING);
        } else if (mood === 'happy' || mood === 'playful') {
            setCurrentState(AvatarStates.HAPPY);
        } else if (mood === 'concerned' || mood === 'protective') {
            setCurrentState(AvatarStates.CONCERNED);
        } else {
            setCurrentState(AvatarStates.IDLE);
        }
    }, [isListening, isThinking, isSpeaking, mood]);

    useEffect(() => {
        const blinkInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                setBlinkState(true);
                setTimeout(() => setBlinkState(false), 150);
            }
        }, 2000);

        return () => clearInterval(blinkInterval);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!avatarRef.current) return;

        const rect = avatarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        setEyePosition({
            x: Math.max(-1, Math.min(1, deltaX)) * 3,
            y: Math.max(-1, Math.min(1, deltaY)) * 3
        });
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    const renderJarvisAvatar = () => (
        <div className="relative w-full h-full">
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${colors.primary}40, transparent 70%)`,
                    boxShadow: `0 0 60px ${colors.glow}, inset 0 0 40px ${colors.glow}`
                }}
                animate={{
                    scale: currentState === AvatarStates.SPEAKING ? [1, 1.05, 1] : 1,
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: currentState === AvatarStates.SPEAKING ? 0.3 : 2,
                    repeat: Infinity
                }}
            />

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth="0.5"
                    strokeDasharray="10 5"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '50% 50%' }}
                />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={colors.secondary}
                    strokeWidth="0.5"
                    strokeDasharray="8 4"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '50% 50%' }}
                />

                <motion.circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill={`${colors.primary}30`}
                    stroke={colors.primary}
                    strokeWidth="1"
                    animate={{
                        r: currentState === AvatarStates.THINKING ? [20, 22, 20] :
                            currentState === AvatarStates.SPEAKING ? [20, 25, 20] : 20,
                        opacity: currentState === AvatarStates.LISTENING ? [0.5, 1, 0.5] : 0.8
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />

                <motion.g
                    animate={{
                        x: eyePosition.x,
                        y: eyePosition.y
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <circle cx="42" cy="45" r={blinkState ? 0.5 : 3} fill={colors.primary} />
                    <circle cx="58" cy="45" r={blinkState ? 0.5 : 3} fill={colors.primary} />
                    {!blinkState && (
                        <>
                            <circle cx="42" cy="45" r="1.5" fill="white" />
                            <circle cx="58" cy="45" r="1.5" fill="white" />
                        </>
                    )}
                </motion.g>

                <motion.path
                    d="M 42 58 Q 50 62 58 58"
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    animate={{
                        d: currentState === AvatarStates.SPEAKING
                            ? ["M 42 58 Q 50 62 58 58", "M 42 58 Q 50 65 58 58", "M 42 58 Q 50 62 58 58"]
                            : mood === 'happy'
                                ? "M 42 58 Q 50 66 58 58"
                                : "M 42 58 Q 50 62 58 58"
                    }}
                    transition={{ duration: 0.2, repeat: currentState === AvatarStates.SPEAKING ? Infinity : 0 }}
                />
            </svg>

            {currentState === AvatarStates.LISTENING && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: colors.primary }}
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}

            {currentState === AvatarStates.THINKING && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: colors.primary,
                                left: '50%',
                                bottom: '-20px'
                            }}
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                        />
                    ))}
                </>
            )}
        </div>
    );

    const renderCompanionAvatar = () => (
        <div className="relative w-full h-full">
            <motion.div
                className="absolute inset-4 rounded-full"
                style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    boxShadow: `0 0 80px ${colors.glow}`
                }}
                animate={{
                    borderRadius: [
                        '60% 40% 30% 70% / 60% 30% 70% 40%',
                        '30% 60% 70% 40% / 50% 60% 30% 60%',
                        '60% 40% 30% 70% / 60% 30% 70% 40%'
                    ],
                    scale: currentState === AvatarStates.SPEAKING ? [1, 1.1, 1] : 1
                }}
                transition={{
                    borderRadius: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                    scale: { duration: 0.3, repeat: currentState === AvatarStates.SPEAKING ? Infinity : 0 }
                }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="flex gap-4"
                    animate={{
                        x: eyePosition.x * 2,
                        y: eyePosition.y * 2
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <motion.div
                        className="w-4 h-4 rounded-full bg-white"
                        animate={{
                            scaleY: blinkState ? 0.1 : 1,
                            scale: currentState === AvatarStates.HAPPY ? 1.2 : 1
                        }}
                    />
                    <motion.div
                        className="w-4 h-4 rounded-full bg-white"
                        animate={{
                            scaleY: blinkState ? 0.1 : 1,
                            scale: currentState === AvatarStates.HAPPY ? 1.2 : 1
                        }}
                    />
                </motion.div>
            </div>

            {currentState === AvatarStates.SPEAKING && (
                <motion.div
                    className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-6 h-3 rounded-full bg-white/50"
                    animate={{
                        scaleY: [1, 1.5, 1],
                        scaleX: [1, 0.8, 1]
                    }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                />
            )}

            {currentState === AvatarStates.LISTENING && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                border: `2px solid ${colors.primary}`,
                                inset: `${-10 - i * 20}px`
                            }}
                            animate={{
                                scale: [1, 1.2],
                                opacity: [0.6, 0]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.3
                            }}
                        />
                    ))}
                </>
            )}

            {isHovered && currentState === AvatarStates.IDLE && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/60 whitespace-nowrap"
                >
                    Click to talk
                </motion.div>
            )}
        </div>
    );

    // Main render function - selects avatar based on persona config
    const renderAvatar = () => {
        const config = PersonaAvatarConfig[persona];

        if (!config) {
            // Fallback to companion avatar for unknown personas
            return renderCompanionAvatar();
        }

        switch (config.type) {
            case 'hologram':
                return (
                    <JarvisHologram
                        state={currentState}
                        mood={mood}
                        eyePosition={eyePosition}
                        size={size}
                    />
                );
            case 'image':
                return (
                    <ImageAvatar
                        imageSrc={config.imageSrc}
                        altImageSrc={config.altImageSrc}
                        speakingImageSrc={config.speakingImageSrc}
                        state={currentState}
                        mood={mood}
                        eyePosition={eyePosition}
                        size={size}
                    />
                );
            case 'vrm':
                return (
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><span className="animate-pulse">Loading VRM...</span></div>}>
                        <VRMAvatar
                            modelUrl={config.vrmModel}
                            state={currentState}
                            mood={mood}
                            size={size}
                            enableTouchRegions={true}
                            enableLipSync={true}
                        />
                    </Suspense>
                );
            case '3d':
                // For GLTF/GLB models - fallback to companion avatar
                return renderCompanionAvatar();
            default:
                return renderCompanionAvatar();
        }
    };

    const handleClick = () => {
        if (onAvatarClick) {
            onAvatarClick();
        }
    };

    const handleWave = () => {
        setCurrentState(AvatarStates.WAVING);
        setTimeout(() => {
            setCurrentState(AvatarStates.IDLE);
        }, 2000);
    };

    return (
        <motion.div
            ref={avatarRef}
            className={`relative ${sizeClasses[size]} cursor-pointer select-none`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            onDoubleClick={handleWave}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                {renderAvatar()}
            </AnimatePresence>

            <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full text-xs font-medium"
                style={{
                    backgroundColor: `${colors.primary}30`,
                    color: colors.primary
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {currentState.charAt(0).toUpperCase() + currentState.slice(1)}
            </motion.div>
        </motion.div>
    );
};

export default InteractiveAvatar;
