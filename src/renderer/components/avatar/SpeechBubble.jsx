import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SpeechBubble = ({ message, isVisible, onClose, duration = 5000, variant = 'default', position = { x: 0, y: 0 }, avatarScale = 1.0, windowSize = { width: typeof window !== 'undefined' ? window.innerWidth : 1920, height: typeof window !== 'undefined' ? window.innerHeight : 1080 } }) => {
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

    // Determine bubble placement relative to the character
    // If character is on the right half of the screen, show bubble on their left. Otherwise, show on right.
    const isCharacterOnRight = position.x > 0; 
    
    // Y-position tweaks: Move it UP to be near the face, not the feet. 
    // Character Y is relative to center. Face is roughly 200-300px above the character center point, scaled by avatarSize.
    const bubbleY = position.y - (250 * avatarScale); 
    
    // X-position tweaks: Offset to the side of the character.
    const bubbleX = position.x + ((isCharacterOnRight ? -220 : 220) * avatarScale);

    return (
        <AnimatePresence>
            {isVisible && message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 * avatarScale, x: isCharacterOnRight ? 20 : -20 }}
                    animate={{ opacity: 1, scale: 1 * avatarScale, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 * avatarScale, x: isCharacterOnRight ? 10 : -10, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute z-50 pointer-events-none"
                    style={{
                        // 50% translates it to center of screen first, then we apply the exact pixel overrides
                        top: `calc(50% + ${bubbleY}px)`,
                        left: `calc(50% + ${bubbleX}px)`,
                        transform: 'translate(-50%, -50%)',
                        maxWidth: '300px'
                    }}
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

                        {/* Bubble tail - dynamic positioning */}
                        <div 
                            className={`absolute top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[8px] border-b-[8px] border-t-transparent border-b-transparent ${isCharacterOnRight ? 'right-[-10px] border-l-[10px] border-l-slate-800/90' : 'left-[-10px] border-r-[10px] border-r-slate-800/90'}`} 
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SpeechBubble;
