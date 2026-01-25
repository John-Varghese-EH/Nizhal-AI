import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BootSequence - Transparent Cinematic Startup
 * 
 * Flow:
 * 1. Floating glow logo
 * 2. Loading progress
 * 3. Fade out
 */
const BootSequence = ({ onComplete, serviceReady }) => {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('logo'); // logo, loading, complete

    useEffect(() => {
        const loadResources = async () => {
            // Stage 1: Quick burst to 30%
            for (let i = 0; i <= 30; i += 2) {
                setProgress(i);
                await new Promise(r => setTimeout(r, 20));
            }

            // Stage 2: Simulated service wait
            await new Promise(r => setTimeout(r, 800));

            // Stage 3: Smooth finish
            for (let i = 30; i <= 100; i++) {
                setProgress(i);
                await new Promise(r => setTimeout(r, 10));
            }

            // Hold at 100% briefly
            await new Promise(r => setTimeout(r, 500));
            setPhase('complete');

            // Trigger completion callback after fade out
            setTimeout(onComplete, 1000);
        };

        loadResources();
    }, []);

    return (
        <AnimatePresence>
            {phase !== 'complete' && (
                <motion.div
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden pointer-events-none"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                >
                    {/* NO BACKGROUND - Transparent */}

                    {/* Main Logo Container - Centered Floating Glow */}
                    <motion.div
                        className="relative z-10 flex flex-col items-center"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {/* Logo Icon with Animated Glow */}
                        <motion.div className="w-28 h-28 mb-6 relative">
                            {/* Outer Glow Pulse */}
                            <motion.div
                                className="absolute inset-[-20px] bg-gradient-to-r from-pink-500/50 to-purple-500/50 rounded-full blur-[40px]"
                                animate={{
                                    opacity: [0.4, 0.8, 0.4],
                                    scale: [1, 1.3, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Inner Glow */}
                            <motion.div
                                className="absolute inset-0 bg-purple-500/60 rounded-full blur-xl"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />

                            {/* Core Icon */}
                            <div className="relative z-10 w-full h-full bg-gradient-to-tr from-purple-600/80 to-blue-500/80 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(139,92,246,0.5)] border border-white/30 backdrop-blur-sm">
                                <span className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">✨</span>
                            </div>
                        </motion.div>

                        {/* Text with Glow */}
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-wider drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
                            NIZHAL AI
                        </h1>
                        <p className="text-white/60 text-sm tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                            Nizhal Engine
                        </p>
                    </motion.div>

                    {/* Progress Bar - Floating */}
                    <div className="absolute bottom-20 w-64 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        <motion.div
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                            style={{ width: `${progress}%` }}
                            layoutId="progressBar"
                        />
                    </div>

                    {/* Status Text */}
                    <motion.p
                        className="absolute bottom-12 text-xs text-white/50 font-mono drop-shadow-md"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        {progress < 30 ? "INITIALIZING..." :
                            progress < 70 ? "LOADING PERSONALITY..." :
                                progress < 100 ? "SYNCHRONIZING..." : "READY"}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BootSequence;
