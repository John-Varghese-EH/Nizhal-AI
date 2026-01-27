import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles, MessageSquare, Settings, Calendar, Mic, Camera, Keyboard, Heart } from 'lucide-react';

/**
 * AppTour - First-run onboarding experience
 * 
 * Guides new users through Nizhal AI features
 * with animated steps and interactive highlights.
 */
const AppTour = ({ isOpen, onClose, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [hasSeenTour, setHasSeenTour] = useState(false);

    const steps = [
        {
            title: "Welcome to Nizhal AI! 👻",
            description: "Your personal AI companion that lives on your desktop. Let me show you around!",
            icon: Sparkles,
            color: 'from-cyan-500 to-purple-500'
        },
        {
            title: "Meet Your Avatar",
            description: "This is your AI companion. They respond to your emotions, follow your cursor, and react to conversations. Try patting their head! 🥰",
            icon: Heart,
            color: 'from-pink-500 to-rose-500',
            tip: "Right-click on the avatar for quick actions"
        },
        {
            title: "Chat Naturally",
            description: "Type messages or use voice commands. Press Ctrl+M to toggle voice input. The AI remembers your conversations and learns about you over time.",
            icon: MessageSquare,
            color: 'from-blue-500 to-cyan-500',
            tip: "Use slash commands like /weather, /focus, /remind"
        },
        {
            title: "Voice Interaction",
            description: "Talk naturally without wake words. Your companion hears you and responds with voice synthesis. Enable voice in Settings.",
            icon: Mic,
            color: 'from-green-500 to-emerald-500',
            tip: "Works best with a headset microphone"
        },
        {
            title: "Emotion Detection",
            description: "Enable camera for emotion detection. Your avatar will mirror your expressions in real-time!",
            icon: Camera,
            color: 'from-amber-500 to-orange-500',
            tip: "Toggle in Settings → Camera"
        },
        {
            title: "Life Dashboard",
            description: "Track your moods, habits, tasks, and routines. View weather, calendar events, and set goals. Your companion helps you stay organized.",
            icon: Calendar,
            color: 'from-violet-500 to-purple-500',
            tip: "Click 'Life' in the navigation"
        },
        {
            title: "Customize Everything",
            description: "Change personalities (GF/BF/JARVIS), themes, AI providers, and even load custom VRM avatars!",
            icon: Settings,
            color: 'from-slate-500 to-gray-500',
            tip: "Drag & drop .vrm files to change avatars"
        },
        {
            title: "Keyboard Shortcuts",
            description: "Master Nizhal with shortcuts:\n• Ctrl+K - Command Palette\n• Ctrl+M - Toggle Voice\n• Ctrl+N - Quick Notes\n• Ctrl+, - Settings",
            icon: Keyboard,
            color: 'from-indigo-500 to-blue-500'
        },
        {
            title: "You're All Set! ✨",
            description: "Enjoy your new AI companion. They're always here for you, ready to chat, help, or just keep you company.",
            icon: Sparkles,
            color: 'from-gradient-start to-gradient-end',
            isLast: true
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        completeTour();
    };

    const completeTour = () => {
        // Save that user has seen the tour
        try {
            localStorage.setItem('nizhal_tour_completed', 'true');
        } catch (e) { }
        onComplete?.();
        onClose();
    };

    useEffect(() => {
        // Check if user has already seen the tour
        try {
            const seen = localStorage.getItem('nizhal_tour_completed');
            setHasSeenTour(seen === 'true');
        } catch (e) { }
    }, []);

    if (!isOpen) return null;

    const step = steps[currentStep];
    const Icon = step.icon;
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-lg bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    {/* Progress Bar */}
                    <div className="h-1 bg-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full bg-gradient-to-r ${step.color}`}
                        />
                    </div>

                    {/* Header */}
                    <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-white/40">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                        <button
                            onClick={handleSkip}
                            className="text-sm text-white/40 hover:text-white transition-colors"
                        >
                            Skip Tour
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center"
                            >
                                {/* Icon */}
                                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                                    <Icon size={40} className="text-white" />
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white mb-3">
                                    {step.title}
                                </h2>

                                {/* Description */}
                                <p className="text-white/70 whitespace-pre-line leading-relaxed">
                                    {step.description}
                                </p>

                                {/* Tip */}
                                {step.tip && (
                                    <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                        <p className="text-sm text-cyan-400">
                                            💡 {step.tip}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="px-8 pb-8 flex items-center justify-between">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${currentStep === 0
                                    ? 'text-white/20 cursor-not-allowed'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <ChevronLeft size={18} />
                            Previous
                        </button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r ${step.color} text-white shadow-lg`}
                        >
                            {step.isLast ? "Let's Go!" : 'Next'}
                            {!step.isLast && <ChevronRight size={18} />}
                        </motion.button>
                    </div>

                    {/* Step Dots */}
                    <div className="px-8 pb-6 flex items-center justify-center gap-2">
                        {steps.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentStep
                                        ? 'w-6 bg-cyan-500'
                                        : idx < currentStep
                                            ? 'bg-cyan-500/50'
                                            : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AppTour;
