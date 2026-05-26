import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SpeechBubble - Dynamic, adaptive dialogue bubble for VRM character companion.
 * Auto-detects available viewport space to position itself close to the model (above, left, right, below).
 * Actively clamps screen coordinates so it never overflows viewport boundaries.
 */
const SpeechBubble = ({
    message,
    isVisible,
    onClose,
    duration = 5000,
    variant = 'default',
    customPlacement = null,
    scale = 1.0
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [placement, setPlacement] = useState('above');
    const [screenShift, setScreenShift] = useState({ x: 0, y: 0 });
    const bubbleRef = useRef(null);

    const prevPlacementRef = useRef('above');
    const prevShiftRef = useRef({ x: 0, y: 0 });

    // Dynamic placement & viewport boundary clamping logic
    const updatePlacement = () => {
        if (customPlacement) {
            if (placement !== customPlacement) {
                setPlacement(customPlacement);
                prevPlacementRef.current = customPlacement;
            }
            return;
        }

        const bubbleEl = bubbleRef.current;
        if (!bubbleEl) return;

        const parent = bubbleEl.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();

        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = window.innerWidth - rect.right;

        // Choose main placement based on available space
        let newPlacement = 'above';
        if (spaceAbove > 120) {
            newPlacement = 'above';
        } else if (spaceRight > 240) {
            newPlacement = 'right';
        } else if (spaceLeft > 240) {
            newPlacement = 'left';
        } else {
            newPlacement = 'below';
        }

        if (prevPlacementRef.current !== newPlacement) {
            prevPlacementRef.current = newPlacement;
            setPlacement(newPlacement);
        }

        // Calculate fine shift adjustments to prevent screen overflow
        const bubbleRect = bubbleEl.getBoundingClientRect();
        if (bubbleRect.width === 0) return; // Wait for layout

        let shiftX = 0;
        let shiftY = 0;
        const padding = 12; // margin from screen boundaries

        // Horizontal overflow checks
        if (bubbleRect.left < padding) {
            shiftX = padding - bubbleRect.left;
        } else if (bubbleRect.right > window.innerWidth - padding) {
            shiftX = (window.innerWidth - padding) - bubbleRect.right;
        }

        // Vertical overflow checks
        if (bubbleRect.top < padding) {
            shiftY = padding - bubbleRect.top;
        } else if (bubbleRect.bottom > window.innerHeight - padding) {
            shiftY = (window.innerHeight - padding) - bubbleRect.bottom;
        }

        // Only trigger state updates if shift delta changes to prevent cascades
        if (Math.abs(prevShiftRef.current.x - shiftX) > 0.5 || Math.abs(prevShiftRef.current.y - shiftY) > 0.5) {
            prevShiftRef.current = { x: shiftX, y: shiftY };
            setScreenShift({ x: shiftX, y: shiftY });
        }
    };

    useLayoutEffect(() => {
        if (isVisible) {
            updatePlacement();

            // Bind resize and scroll listeners
            window.addEventListener('resize', updatePlacement);
            window.addEventListener('scroll', updatePlacement, true);

            // 60fps animation frame loop for fluid boundary shifts during active dragging
            let active = true;
            const tick = () => {
                if (!active) return;
                updatePlacement();
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);

            return () => {
                active = false;
                window.removeEventListener('resize', updatePlacement);
                window.removeEventListener('scroll', updatePlacement, true);
            };
        }
    }, [isVisible, customPlacement, message]);

    // Typing animation effect
    useEffect(() => {
        if (isVisible && message) {
            setDisplayedText('');
            setIsTyping(true);
            let i = 0;
            const typingSpeed = 25; // ms per char

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

    // Auto-close overlay timer
    useEffect(() => {
        if (isVisible && !isTyping && displayedText && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, isTyping, displayedText, onClose, duration]);

    // Dark cyberpunk thematic style variables
    const themeVariants = {
        default: {
            container: 'bg-slate-955/90 border-cyan-500/30 text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.25)]',
            tail: {
                above: 'border-t-slate-955/90',
                below: 'border-b-slate-955/90',
                left: 'border-l-slate-955/90',
                right: 'border-r-slate-955/90'
            },
            accent: 'border-cyan-400/50',
            cursor: 'bg-cyan-400'
        },
        error: {
            container: 'bg-slate-955/90 border-rose-500/40 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.25)]',
            tail: {
                above: 'border-t-slate-955/90',
                below: 'border-b-slate-955/90',
                left: 'border-l-slate-955/90',
                right: 'border-r-slate-955/90'
            },
            accent: 'border-rose-400/50',
            cursor: 'bg-rose-400'
        },
        success: {
            container: 'bg-slate-955/90 border-emerald-500/40 text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
            tail: {
                above: 'border-t-slate-955/90',
                below: 'border-b-slate-955/90',
                left: 'border-l-slate-955/90',
                right: 'border-r-slate-955/90'
            },
            accent: 'border-emerald-400/50',
            cursor: 'bg-emerald-400'
        },
        love: {
            container: 'bg-slate-955/90 border-pink-500/40 text-pink-200 shadow-[0_0_25px_rgba(236,72,153,0.25)]',
            tail: {
                above: 'border-t-slate-955/90',
                below: 'border-b-slate-955/90',
                left: 'border-l-slate-955/90',
                right: 'border-r-slate-955/90'
            },
            accent: 'border-pink-400/50',
            cursor: 'bg-pink-400'
        }
    };

    // Calculate dynamically scaled offsets to ensure absolute contact proximity with visible avatar body
    const baseOffset = 40 * scale;   // horizontal margin beside model face (brought closer!)
    const verticalGap = 12 * scale;  // vertical margin above/below head/feet (tighter gap!)

    const placementStyles = {
        above: {
            style: {
                top: '-5%', // shifted above the canvas container border so it never overlaps the head
                left: '50%',
                transform: `translate(calc(-50% + ${screenShift.x}px), calc(-100% - ${verticalGap}px + ${screenShift.y}px))`,
            },
            tail: 'bottom-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent'
        },
        below: {
            style: {
                top: '92%', // feet height anchor
                left: '50%',
                transform: `translate(calc(-50% + ${screenShift.x}px), calc(${verticalGap}px + ${screenShift.y}px))`,
            },
            tail: 'top-[-6px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent'
        },
        left: {
            style: {
                top: '20%', // aligned beside character face
                left: '50%',
                transform: `translate(calc(-100% - ${baseOffset}px + ${screenShift.x}px), calc(-50% + ${screenShift.y}px))`,
            },
            tail: 'right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent'
        },
        right: {
            style: {
                top: '20%', // aligned beside character face
                left: '50%',
                transform: `translate(calc(${baseOffset}px + ${screenShift.x}px), calc(-50% + ${screenShift.y}px))`,
            },
            tail: 'left-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent'
        }
    };

    const activeTheme = themeVariants[variant] || themeVariants.default;
    const activeLayout = placementStyles[placement] || placementStyles.above;

    // Fluid Framer Motion animations
    const motionVariants = {
        initial: { opacity: 0, scale: 0.88 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.88, transition: { duration: 0.12 } }
    };

    return (
        <AnimatePresence>
            {isVisible && message && (
                <motion.div
                    ref={bubbleRef}
                    variants={motionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                    className="absolute z-50 pointer-events-none select-none"
                    style={{
                        width: 'max-content',
                        maxWidth: '260px',
                        ...activeLayout.style
                    }}
                >
                    <div className="bg-slate-950/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-cyan-500/30 text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.25)] text-xs font-semibold tracking-wide leading-relaxed relative pointer-events-auto">
                        {/* Sci-fi tech corner frames */}
                        <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${activeTheme.accent} rounded-tl-md`} />
                        <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${activeTheme.accent} rounded-tr-md`} />
                        <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${activeTheme.accent} rounded-bl-md`} />
                        <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${activeTheme.accent} rounded-br-md`} />

                        {/* Theme decorator icon */}
                        {variant === 'error' && <span className="mr-1.5 font-sans">⚠️</span>}
                        {variant === 'love' && <span className="mr-1.5 font-sans">💜</span>}
                        {variant === 'success' && <span className="mr-1.5 font-sans">✨</span>}

                        {displayedText}

                        {/* Sci-fi typing vertical block cursor */}
                        {isTyping && (
                            <motion.span
                                animate={{ opacity: [1, 0.2] }}
                                transition={{ repeat: Infinity, duration: 0.45 }}
                                className={`inline-block ml-1 w-[2px] h-3 ${activeTheme.cursor} align-middle`}
                            />
                        )}

                        {/* Interactive dismiss close action */}
                        <button
                            onClick={onClose}
                            className="absolute top-1 right-1.5 w-3 h-3 flex items-center justify-center text-[8px] text-cyan-400/40 hover:text-cyan-200 transition-colors pointer-events-auto cursor-pointer"
                            title="Dismiss dialog"
                        >
                            ✕
                        </button>

                        {/* Responsive tail pointer */}
                        <div className={`${activeLayout.tail} ${activeTheme.tail[placement]}`} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SpeechBubble;
