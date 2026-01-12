import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MagicSetup - Futuristic Floating Onboarding
 * Glassmorphism + Glow effects for transparent window
 */
const MagicSetup = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        name: '',
        vibe: 50,
        relationship: 'friend'
    });

    const next = () => setStep(s => s + 1);

    const handleComplete = () => {
        if (window.nizhal?.invoke) {
            window.nizhal.invoke('onboarding:complete', data);
        }
        onComplete(data);
    };

    const variants = {
        enter: { opacity: 0, y: 30, scale: 0.9 },
        center: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, y: -30, scale: 1.1, transition: { duration: 0.3 } }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center text-white pointer-events-none">

            {/* Glassmorphism Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-[480px] min-h-[350px] pointer-events-auto rounded-3xl p-8 relative overflow-hidden
                    bg-black/30 backdrop-blur-xl 
                    border border-white/20
                    shadow-[0_8px_60px_-10px_rgba(236,72,153,0.3),0_4px_25px_-5px_rgba(0,0,0,0.5),inset_0_0_40px_rgba(255,255,255,0.05)]"
            >
                {/* Subtle Animated Glow Border */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-transparent to-blue-500/20 blur-xl opacity-50 animate-pulse" />
                </div>

                <AnimatePresence mode='wait'>

                    {/* STEP 1: NAME */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={variants} initial="enter" animate="center" exit="exit"
                            className="text-center w-full relative z-10"
                        >
                            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-300 to-blue-300 bg-clip-text text-transparent">
                                What should I call you?
                            </h2>
                            <p className="text-sm text-white/50 mb-6">Let's get acquainted 💫</p>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Your name..."
                                className="w-full bg-white/5 border border-white/20 rounded-xl text-2xl text-center py-4 px-4 focus:border-pink-500/50 focus:bg-white/10 outline-none mb-6 placeholder:text-white/30 transition-all"
                                value={data.name}
                                onChange={(e) => setData({ ...data, name: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && data.name && next()}
                            />
                            <button
                                disabled={!data.name}
                                onClick={next}
                                className="px-10 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] active:scale-95"
                            >
                                Continue →
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: VIBE */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={variants} initial="enter" animate="center" exit="exit"
                            className="text-center w-full relative z-10"
                        >
                            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                                What's the vibe?
                            </h2>
                            <p className="text-sm text-white/50 mb-8">How should I act around you?</p>

                            <div className="relative w-full mb-8 px-2">
                                <input
                                    type="range" min="0" max="100"
                                    value={data.vibe}
                                    onChange={(e) => setData({ ...data, vibe: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-400 [&::-webkit-slider-thumb]:to-blue-400 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,255,255,0.6)] [&::-webkit-slider-thumb]:cursor-grab"
                                />
                                <div className="flex justify-between mt-3 text-xs font-medium uppercase tracking-widest text-white/60">
                                    <span>🧘 Peaceful</span>
                                    <span>😈 Chaotic</span>
                                </div>
                            </div>

                            <button onClick={next} className="px-10 py-3 rounded-full bg-white/10 border border-white/20 font-bold transition-all hover:scale-105 hover:bg-white/20">
                                Next →
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 3: RELATIONSHIP */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={variants} initial="enter" animate="center" exit="exit"
                            className="text-center w-full relative z-10"
                        >
                            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                                We are...
                            </h2>

                            <div className="space-y-3 mb-6">
                                {[
                                    { id: 'friend', label: 'Best Friends', icon: '✨', desc: 'Casual, fun, supportive' },
                                    { id: 'partner', label: 'Partners', icon: '💕', desc: 'Romantic, caring, intimate' },
                                    { id: 'assistant', label: 'Co-Workers', icon: '🚀', desc: 'Professional, focused, efficient' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setData({ ...data, relationship: opt.id })}
                                        className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${data.relationship === opt.id
                                                ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-pink-400/50 shadow-[0_0_25px_rgba(236,72,153,0.3)]'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <span className="text-3xl">{opt.icon}</span>
                                        <div className="text-left">
                                            <span className="font-bold block">{opt.label}</span>
                                            <span className="text-xs text-white/50">{opt.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleComplete}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-blue-500 font-bold text-lg shadow-[0_4px_30px_rgba(236,72,153,0.4)] hover:shadow-[0_4px_40px_rgba(236,72,153,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                ✨ Begin Journey
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default MagicSetup;
