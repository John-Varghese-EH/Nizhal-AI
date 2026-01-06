import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const CompanionOrb = ({ mood, moodColor = '#6366f1', isActive }) => {
    const moodStyles = useMemo(() => {
        const styles = {
            happy: {
                color1: '#10b981',
                color2: '#34d399',
                color3: '#6ee7b7',
                animationSpeed: 1.2
            },
            neutral: {
                color1: '#6366f1',
                color2: '#818cf8',
                color3: '#a5b4fc',
                animationSpeed: 1
            },
            concerned: {
                color1: '#f59e0b',
                color2: '#fbbf24',
                color3: '#fcd34d',
                animationSpeed: 0.8
            },
            protective: {
                color1: '#ef4444',
                color2: '#f87171',
                color3: '#fca5a5',
                animationSpeed: 1.5
            },
            playful: {
                color1: '#ec4899',
                color2: '#f472b6',
                color3: '#f9a8d4',
                animationSpeed: 1.8
            },
            thoughtful: {
                color1: '#8b5cf6',
                color2: '#a78bfa',
                color3: '#c4b5fd',
                animationSpeed: 0.6
            }
        };
        return styles[mood] || styles.neutral;
    }, [mood]);

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="relative w-48 h-48">
                <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{ backgroundColor: moodStyles.color1 }}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 4 / moodStyles.animationSpeed,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />

                <motion.div
                    className="absolute inset-4 animate-morph"
                    style={{
                        background: `linear-gradient(135deg, ${moodStyles.color1}, ${moodStyles.color2}, ${moodStyles.color3})`,
                        filter: 'blur(1px)'
                    }}
                    animate={{
                        borderRadius: [
                            '60% 40% 30% 70% / 60% 30% 70% 40%',
                            '30% 60% 70% 40% / 50% 60% 30% 60%',
                            '60% 40% 30% 70% / 60% 30% 70% 40%'
                        ],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: 8 / moodStyles.animationSpeed,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />

                <motion.div
                    className="absolute inset-8"
                    style={{
                        background: `linear-gradient(225deg, ${moodStyles.color2}, ${moodStyles.color3})`,
                        filter: 'blur(2px)'
                    }}
                    animate={{
                        borderRadius: [
                            '30% 60% 70% 40% / 50% 60% 30% 60%',
                            '60% 40% 30% 70% / 60% 30% 70% 40%',
                            '30% 60% 70% 40% / 50% 60% 30% 60%'
                        ],
                        rotate: [360, 180, 0]
                    }}
                    transition={{
                        duration: 6 / moodStyles.animationSpeed,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />

                <motion.div
                    className="absolute inset-12 rounded-full"
                    style={{
                        background: `radial-gradient(circle at 30% 30%, ${moodStyles.color3}, ${moodStyles.color1})`,
                        boxShadow: `0 0 60px ${moodStyles.color1}, inset 0 0 30px rgba(255,255,255,0.2)`
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 2 / moodStyles.animationSpeed,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />

                <motion.div
                    className="absolute inset-16 rounded-full bg-white/20"
                    style={{
                        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)'
                    }}
                    animate={{
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 1.5 / moodStyles.animationSpeed,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />

                {isActive && (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                    backgroundColor: moodStyles.color3,
                                    left: '50%',
                                    top: '50%'
                                }}
                                animate={{
                                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 100],
                                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 100],
                                    opacity: [1, 0],
                                    scale: [1, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                    ease: 'easeOut'
                                }}
                            />
                        ))}
                    </>
                )}
            </div>

            <motion.div
                className="absolute bottom-24 left-0 right-0 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
            >
                <span
                    className="text-xs font-medium tracking-wider uppercase"
                    style={{ color: moodStyles.color2 }}
                >
                    {mood || 'neutral'}
                </span>
            </motion.div>
        </div>
    );
};

export default CompanionOrb;
