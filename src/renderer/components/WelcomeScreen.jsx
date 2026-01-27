import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Settings, MessageSquare, Heart, Zap } from 'lucide-react';

/**
 * WelcomeScreen - First-run splash screen
 * 
 * Beautiful animated welcome for new users
 * before launching the App Tour.
 */
const WelcomeScreen = ({ isOpen, onContinue, onSkip }) => {
    const [animationPhase, setAnimationPhase] = useState(0);

    useEffect(() => {
        if (isOpen) {
            // Stagger animations
            const timer1 = setTimeout(() => setAnimationPhase(1), 500);
            const timer2 = setTimeout(() => setAnimationPhase(2), 1000);
            const timer3 = setTimeout(() => setAnimationPhase(3), 1500);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const features = [
        { icon: MessageSquare, label: 'Natural Conversations', color: 'from-blue-500 to-cyan-500' },
        { icon: Heart, label: 'Emotional Intelligence', color: 'from-pink-500 to-rose-500' },
        { icon: Settings, label: 'Fully Customizable', color: 'from-violet-500 to-purple-500' },
        { icon: Zap, label: 'Lightning Fast', color: 'from-amber-500 to-orange-500' }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden"
            >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    {/* Floating Orbs */}
                    <motion.div
                        animate={{
                            x: [0, 100, 50, 0],
                            y: [0, 50, 100, 0],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 20, repeat: Infinity }}
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            x: [0, -80, -40, 0],
                            y: [0, -60, 80, 0],
                            scale: [1, 1.3, 1]
                        }}
                        transition={{ duration: 25, repeat: Infinity }}
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            x: [0, 60, -60, 0],
                            y: [0, 80, -40, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 15, repeat: Infinity }}
                        className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-2xl mx-auto text-center px-6">
                    {/* Logo/Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                        className="mx-auto mb-8"
                    >
                        <div className="w-32 h-32 mx-auto relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-3xl rotate-6 opacity-60" />
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-3xl flex items-center justify-center">
                                <span className="text-6xl">👻</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={animationPhase >= 1 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl font-bold mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                                Welcome to Nizhal
                            </span>
                        </h1>
                        <p className="text-xl text-white/70 mb-8">
                            Your personal AI companion for desktop
                        </p>
                    </motion.div>

                    {/* Features Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={animationPhase >= 2 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="grid grid-cols-2 gap-4 mb-12"
                    >
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={animationPhase >= 2 ? { opacity: 1, scale: 1 } : {}}
                                transition={{ delay: idx * 0.1 }}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3"
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                                    <feature.icon size={20} className="text-white" />
                                </div>
                                <span className="text-white/80 text-sm font-medium">{feature.label}</span>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={animationPhase >= 3 ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onContinue}
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-2xl shadow-lg shadow-cyan-500/25"
                        >
                            <Sparkles size={20} />
                            Get Started
                            <ArrowRight size={20} />
                        </motion.button>

                        <button
                            onClick={onSkip}
                            className="text-white/40 hover:text-white/60 text-sm transition-colors"
                        >
                            I've used Nizhal before - Skip intro
                        </button>
                    </motion.div>

                    {/* Version */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={animationPhase >= 3 ? { opacity: 1 } : {}}
                        className="mt-12 text-white/20 text-xs"
                    >
                        Nizhal AI v2.0 • Made with ❤️
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WelcomeScreen;
