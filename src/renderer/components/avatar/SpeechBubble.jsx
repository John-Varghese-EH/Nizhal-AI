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

    // Variant styles
    const variants = {
        default: 'bg-gradient-to-br from-white/95 to-blue-50/90 text-gray-800 border-blue-200/50',
        error: 'bg-gradient-to-br from-red-50/95 to-pink-50/90 text-red-800 border-red-200/50',
        success: 'bg-gradient-to-br from-green-50/95 to-emerald-50/90 text-green-800 border-green-200/50',
        love: 'bg-gradient-to-br from-pink-100/95 to-rose-50/90 text-pink-800 border-pink-200/50'
    };

    const bubbleStyle = variants[variant] || variants.default;

    return (
        <AnimatePresence>
            {isVisible && message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute top-8 left-1/2 transform -translate-x-1/2 max-w-[85%] z-50 pointer-events-none"
                >
                    <div className={`${bubbleStyle} backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border text-sm font-medium text-center relative`}>
                        {/* Emoji decorator based on variant */}
                        {variant === 'error' && <span className="mr-1">😅</span>}
                        {variant === 'love' && <span className="mr-1">💕</span>}
                        {variant === 'success' && <span className="mr-1">✨</span>}

                        {displayedText}

                        {/* Typing cursor */}
                        {isTyping && (
                            <motion.span
                                animate={{ opacity: [1, 0] }}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                                className="inline-block ml-0.5 w-0.5 h-4 bg-current align-middle"
                            />
                        )}

                        {/* Bubble tail */}
                        <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 ${bubbleStyle.split(' ')[0]} rotate-45 border-r border-b ${bubbleStyle.split('border-')[1]?.split(' ')[0] || ''}`}></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SpeechBubble;
