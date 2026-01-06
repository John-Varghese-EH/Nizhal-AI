import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * ImageAvatar - Renders a 2D character avatar for Desktop Mate style companions.
 * Supports different states (idle, listening, thinking, speaking) with image swapping or CSS effects.
 */
const ImageAvatar = ({
    imageSrc,
    altImageSrc,
    speakingImageSrc,
    state = 'idle',
    mood = 'neutral',
    eyePosition = { x: 0, y: 0 },
    size = 'medium'
}) => {
    const sizeClasses = {
        small: 'w-24 h-24',
        medium: 'w-40 h-40',
        large: 'w-64 h-64'
    };

    const moodGradients = useMemo(() => ({
        happy: 'from-pink-500/20 to-yellow-500/20',
        neutral: 'from-blue-500/20 to-purple-500/20',
        concerned: 'from-orange-500/20 to-yellow-500/20',
        protective: 'from-red-500/20 to-orange-500/20',
        playful: 'from-pink-500/20 to-purple-500/20',
        thoughtful: 'from-purple-500/20 to-indigo-500/20'
    }), []);

    const currentGradient = moodGradients[mood] || moodGradients.neutral;

    const getCurrentImage = () => {
        if (state === 'speaking' && speakingImageSrc) {
            return speakingImageSrc;
        }
        if ((state === 'thinking' || state === 'listening') && altImageSrc) {
            return altImageSrc;
        }
        return imageSrc;
    };

    const getStateAnimation = () => {
        switch (state) {
            case 'listening':
                return {
                    scale: [1, 1.02, 1],
                    transition: { duration: 1.5, repeat: Infinity }
                };
            case 'thinking':
                return {
                    y: [0, -3, 0],
                    transition: { duration: 1, repeat: Infinity }
                };
            case 'speaking':
                return {
                    scale: [1, 1.03, 1],
                    transition: { duration: 0.3, repeat: Infinity }
                };
            default:
                return {
                    y: [0, -5, 0],
                    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                };
        }
    };

    return (
        <div className={`relative ${sizeClasses[size]}`}>
            {/* Mood Aura - non-circular for full character display */}
            <motion.div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${currentGradient} blur-xl`}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Character Image Container - full display without circular clip */}
            <motion.div
                className="relative w-full h-full overflow-visible"
                style={{
                    transform: `translate(${eyePosition.x * 2}px, ${eyePosition.y * 2}px)`
                }}
                animate={getStateAnimation()}
            >
                <img
                    src={getCurrentImage()}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%236366f1"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="12">Avatar</text></svg>';
                    }}
                />
            </motion.div>

            {/* Listening Pulse Rings */}
            {state === 'listening' && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-2xl border-2 border-cyan-400"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{
                                scale: [1, 1.4 + i * 0.2],
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

            {/* Thinking Dots */}
            {state === 'thinking' && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-purple-400 rounded-full"
                            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Speaking Waveform */}
            {state === 'speaking' && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-0.5 items-end h-4">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-green-400 rounded-full"
                            animate={{
                                height: [4, 12 + Math.random() * 8, 4]
                            }}
                            transition={{
                                duration: 0.2 + Math.random() * 0.2,
                                repeat: Infinity,
                                delay: i * 0.05
                            }}
                        />
                    ))}
                </div>
            )}

            {/* State Label */}
            <motion.div
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70 capitalize"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {state}
            </motion.div>
        </div>
    );
};

export default ImageAvatar;
