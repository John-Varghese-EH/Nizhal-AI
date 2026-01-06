import React from 'react';
import { motion } from 'framer-motion';

const IdleAnimations = ({ persona, mood, isActive = true }) => {
    if (!isActive) return null;

    const animations = {
        jarvis: <JarvisIdleAnimation mood={mood} />,
        bestie: <CompanionIdleAnimation mood={mood} color="#ec4899" />,
        buddy: <CompanionIdleAnimation mood={mood} color="#3b82f6" />
    };

    return animations[persona] || animations.jarvis;
};

const JarvisIdleAnimation = ({ mood }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                {[...Array(3)].map((_, i) => (
                    <motion.circle
                        key={i}
                        cx="200"
                        cy="200"
                        r={80 + i * 40}
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="0.5"
                        strokeDasharray="10 20"
                        opacity={0.3 - i * 0.1}
                        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                        transition={{
                            duration: 30 + i * 10,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                        style={{ transformOrigin: '200px 200px' }}
                    />
                ))}

                {[...Array(8)].map((_, i) => {
                    const angle = (i * 45) * (Math.PI / 180);
                    const x = 200 + Math.cos(angle) * 150;
                    const y = 200 + Math.sin(angle) * 150;

                    return (
                        <motion.circle
                            key={`node-${i}`}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#00d4ff"
                            opacity={0.5}
                            animate={{
                                opacity: [0.3, 0.8, 0.3],
                                scale: [1, 1.5, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.25
                            }}
                        />
                    );
                })}

                <motion.text
                    x="200"
                    y="380"
                    textAnchor="middle"
                    fill="#00d4ff"
                    fontSize="10"
                    opacity={0.4}
                >
                    SYSTEM READY
                </motion.text>
            </svg>

            <motion.div
                className="absolute top-4 right-4 text-xs font-mono text-cyan-500/50"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {new Date().toLocaleTimeString()}
            </motion.div>

            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 rounded-full bg-cyan-400"
                    style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`
                    }}
                    animate={{
                        y: [0, -100],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.5
                    }}
                />
            ))}
        </div>
    );
};

const CompanionIdleAnimation = ({ mood, color }) => {
    const moodEmojis = {
        happy: ['✨', '💫', '💕', '🌟'],
        neutral: ['•', '◦', '∘', '○'],
        concerned: ['💭', '❓', '🤔'],
        playful: ['🎵', '🎶', '💃', '✨'],
        thoughtful: ['💭', '📚', '💡']
    };

    const emojis = moodEmojis[mood] || moodEmojis.neutral;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{
                    scale: [1, 1.02, 1],
                    rotate: [0, 1, -1, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            >
                <div
                    className="w-64 h-64 rounded-full opacity-10"
                    style={{ backgroundColor: color }}
                />
            </motion.div>

            {emojis.map((emoji, i) => (
                <motion.div
                    key={i}
                    className="absolute text-2xl"
                    initial={{
                        x: Math.random() * 100 + '%',
                        y: '110%',
                        opacity: 0
                    }}
                    animate={{
                        y: '-10%',
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 6 + Math.random() * 4,
                        repeat: Infinity,
                        delay: i * 2
                    }}
                >
                    {emoji}
                </motion.div>
            ))}

            <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default IdleAnimations;
