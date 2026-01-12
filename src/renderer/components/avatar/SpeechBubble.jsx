import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SpeechBubble = ({ message, isVisible, onClose, duration = 5000, variant = 'default' }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Typing animation effect
    useEffect(() => {
        if (isVisible && message) {
            setDisplayedText('');
            setIsTyping(true);
            let i = 0;
            const typingSpeed = 30; // ms per character

            const typeInterval = setInterval(() => {
                if (i < message.length) {
                    setDisplayedText(message.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(typeInterval);
                    setIsTyping(false);
                }
            }, typingSpeed);

            return () => clearInterval(typeInterval);
        }
    }, [isVisible, message]);

    // Auto-hide after typing completes
    useEffect(() => {
        if (isVisible && !isTyping && displayedText && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, isTyping, displayedText, onClose, duration]);

    // Dark futuristic variant styles with cyan/purple accents
    const variants = {
        default: 'bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-cyan-900/80 text-cyan-100 border-cyan-500/40',
        error: 'bg-gradient-to-br from-slate-900/95 via-red-900/80 to-rose-900/70 text-rose-200 border-rose-500/50',
        success: 'bg-gradient-to-br from-slate-900/95 via-emerald-900/80 to-teal-900/70 text-emerald-200 border-emerald-500/50',
        love: 'bg-gradient-to-br from-slate-900/95 via-pink-900/80 to-purple-900/70 text-pink-200 border-pink-500/50'
    };

    const glowColors = {
        default: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
        error: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
        success: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
        love: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]'
    };

    const bubbleStyle = variants[variant] || variants.default;
    const glowStyle = glowColors[variant] || glowColors.default;

    return (
        <AnimatePresence>
            {isVisible && message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute bottom-[55%] left-1/2 transform -translate-x-1/2 max-w-[90%] z-50 pointer-events-none"
                >
                    <div className={`${bubbleStyle} ${glowStyle} backdrop-blur-xl px-5 py-3 rounded-xl border text-sm font-medium text-center relative`}>
                        {/* Futuristic corner accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400/60 rounded-tl" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400/60 rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400/60 rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400/60 rounded-br" />

                        {/* Emoji decorator based on variant */}
                        {variant === 'error' && <span className="mr-1">⚠️</span>}
                        {variant === 'love' && <span className="mr-1">💜</span>}
                        {variant === 'success' && <span className="mr-1">✨</span>}

                        {displayedText}

                        {/* Futuristic typing cursor */}
                        {isTyping && (
                            <motion.span
                                animate={{ opacity: [1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 0.4 }}
                                className="inline-block ml-1 w-[2px] h-4 bg-cyan-400 align-middle"
                            />
                        )}

                        {/* Bubble tail - futuristic triangle */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-slate-800/90" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SpeechBubble;
