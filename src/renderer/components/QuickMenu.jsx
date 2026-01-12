/**
 * QuickMenu - Context menu for character overlay
 * 
 * Accessible via:
 * - Right-click on avatar
 * - Ctrl+Q keyboard shortcut
 * 
 * Features:
 * - Personality mode switching (GF/BF/JARVIS)
 * - Emotion triggers
 * - Visibility controls
 * - Quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Personality modes
const PERSONALITY_MODES = [
    { id: 'gf', name: 'GF', icon: '💕', description: 'Affectionate & Caring' },
    { id: 'bf', name: 'BF', icon: '🛡️', description: 'Supportive & Protective' },
    { id: 'jarvis', name: 'JARVIS', icon: '🤖', description: 'Professional & Efficient' }
];

// Emotion triggers
const EMOTIONS = [
    { id: 'happy', icon: '😊', label: 'Happy' },
    { id: 'sad', icon: '😢', label: 'Sad' },
    { id: 'thinking', icon: '🤔', label: 'Thinking' },
    { id: 'excited', icon: '🎉', label: 'Excited' },
    { id: 'playful', icon: '😜', label: 'Playful' }
];

// Quick actions
const QUICK_ACTIONS = [
    { id: 'speak', icon: '🗣️', label: 'Speak' },
    { id: 'dance', icon: '💃', label: 'Dance' },
    { id: 'game', icon: '🎮', label: 'Play' },
    { id: 'focus', icon: '🎯', label: 'Focus' }
];

/**
 * QuickMenu Component
 */
const QuickMenu = ({
    isOpen,
    position,
    onClose,
    onPersonalityChange,
    onEmotionTrigger,
    onQuickAction,
    onSettingsOpen,
    currentPersonality = 'gf',
    currentEmotion = 'neutral',
    settings = {}
}) => {
    const [activeSection, setActiveSection] = useState(null);

    // Close menu on outside click
    useEffect(() => {
        if (isOpen) {
            const handleClick = (e) => {
                if (!e.target.closest('.quick-menu')) {
                    onClose?.();
                }
            };

            // Small delay to prevent immediate close
            const timer = setTimeout(() => {
                window.addEventListener('click', handleClick);
            }, 100);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('click', handleClick);
            };
        }
    }, [isOpen, onClose]);

    // Handle transparency change
    const handleTransparencyChange = useCallback(async (value) => {
        await window.nizhal?.state?.set?.('ui.transparency', value);
    }, []);

    // Handle always on top toggle
    const handleAlwaysOnTop = useCallback(async () => {
        const current = await window.nizhal?.state?.get?.('ui.alwaysOnTop');
        await window.nizhal?.state?.set?.('ui.alwaysOnTop', !current);
        await window.nizhal?.character?.toggleAlwaysOnTop?.();
    }, []);

    // Handle click-through toggle
    const handleClickThrough = useCallback(async () => {
        const current = await window.nizhal?.state?.get?.('ui.clickThrough');
        await window.nizhal?.state?.set?.('ui.clickThrough', !current);
        await window.nizhal?.character?.setClickThrough?.(!current);
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="quick-menu fixed z-[9999] bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 py-3 min-w-64 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                style={{
                    left: Math.max(10, Math.min(position.x, window.innerWidth - 280)),
                    top: Math.max(10, Math.min(position.y, window.innerHeight - 450))
                }}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
            >
                {/* Header */}
                <div className="px-4 pb-2 mb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">✨</span>
                        <span className="text-white font-medium">Nizhal AI</span>
                    </div>
                </div>

                {/* Personality Mode Section */}
                <MenuSection title="Personality" icon="🎭">
                    <div className="flex gap-2 px-2">
                        {PERSONALITY_MODES.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => onPersonalityChange?.(mode.id)}
                                className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all ${currentPersonality === mode.id
                                    ? 'bg-purple-500/30 border border-purple-400/50'
                                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                    }`}
                                title={mode.description}
                            >
                                <span className="text-xl">{mode.icon}</span>
                                <span className="text-xs text-white/80">{mode.name}</span>
                            </button>
                        ))}
                    </div>
                </MenuSection>

                {/* Emotions Section */}
                <MenuSection title="Emotions" icon="💕">
                    <div className="flex flex-wrap gap-2 px-2">
                        {EMOTIONS.map(emotion => (
                            <button
                                key={emotion.id}
                                onClick={() => onEmotionTrigger?.(emotion.id)}
                                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${currentEmotion === emotion.id
                                    ? 'bg-blue-500/30 border border-blue-400/50 scale-110'
                                    : 'bg-white/5 hover:bg-white/10 border border-transparent hover:scale-105'
                                    }`}
                                title={emotion.label}
                            >
                                <span className="text-xl">{emotion.icon}</span>
                            </button>
                        ))}
                    </div>
                </MenuSection>

                {/* Visibility Section */}
                <MenuSection title="Visibility" icon="👁️">
                    <div className="space-y-2 px-2">
                        {/* Always on Top Toggle */}
                        <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-white/80">Always on Top</span>
                            <Toggle
                                enabled={settings.alwaysOnTop ?? true}
                                onChange={handleAlwaysOnTop}
                            />
                        </div>

                        {/* Click Through Toggle */}
                        <div className="flex items-center justify-between py-1">
                            <span className="text-sm text-white/80">Click Through</span>
                            <Toggle
                                enabled={settings.clickThrough ?? true}
                                onChange={handleClickThrough}
                            />
                        </div>

                        {/* Transparency Slider */}
                        <div className="py-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-white/80">Transparency</span>
                                <span className="text-xs text-white/50">{Math.round((settings.transparency ?? 0.8) * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="30"
                                max="100"
                                value={(settings.transparency ?? 0.8) * 100}
                                onChange={(e) => handleTransparencyChange(e.target.value / 100)}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
                            />
                        </div>
                    </div>
                </MenuSection>

                {/* Quick Actions Section */}
                <MenuSection title="Quick Actions" icon="⚡">
                    <div className="flex gap-2 px-2">
                        {QUICK_ACTIONS.map(action => (
                            <button
                                key={action.id}
                                onClick={() => onQuickAction?.(action.id)}
                                className="flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all hover:scale-105"
                                title={action.label}
                            >
                                <span className="text-lg">{action.icon}</span>
                                <span className="text-xs text-white/60">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </MenuSection>

                {/* Footer Links */}
                <div className="mt-2 pt-2 border-t border-white/10 px-2">
                    <button
                        onClick={onSettingsOpen}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <span>⚙️</span>
                        <span className="text-sm text-white/80">Full Settings</span>
                        <span className="ml-auto text-xs text-white/40">→</span>
                    </button>
                </div>

                {/* Attribution */}
                <div className="mt-2 pt-2 border-t border-white/10 px-4">
                    <div className="text-center text-xs text-white/30">
                        Made with ❤️ by J0X
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

/**
 * Menu Section Component
 */
const MenuSection = ({ title, icon, children }) => (
    <div className="mb-3">
        <div className="px-4 py-1 text-xs text-white/40 uppercase tracking-wide flex items-center gap-2">
            <span>{icon}</span>
            <span>{title}</span>
        </div>
        <div className="mt-1">
            {children}
        </div>
    </div>
);

/**
 * Toggle Switch Component
 */
const Toggle = ({ enabled, onChange }) => (
    <button
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-purple-500' : 'bg-white/20'
            }`}
    >
        <motion.div
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
            animate={{ left: enabled ? '1.25rem' : '0.125rem' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
    </button>
);

export default QuickMenu;
