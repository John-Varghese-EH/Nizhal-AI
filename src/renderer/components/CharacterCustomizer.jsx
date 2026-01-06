import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CharacterCustomizer - Customization panel for avatar settings
 */
const CharacterCustomizer = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
    availableCharacters = []
}) => {
    const [activeTab, setActiveTab] = useState('character');

    const handleChange = useCallback((key, value) => {
        onSettingsChange({ ...settings, [key]: value });
    }, [settings, onSettingsChange]);

    const tabs = [
        { id: 'character', label: '🎭', title: 'Character' },
        { id: 'display', label: '🖥️', title: 'Display' },
        { id: 'behavior', label: '⚙️', title: 'Behavior' }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-gray-900/95 rounded-2xl shadow-2xl border border-white/10 w-80 max-h-96 overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-white font-semibold text-lg">Customize</h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`flex-1 py-3 text-center transition-colors ${activeTab === tab.id
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/50 hover:text-white/80'
                                    }`}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.title}
                            >
                                <span className="text-lg">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                        {activeTab === 'character' && (
                            <>
                                <div>
                                    <label className="text-white/70 text-sm mb-2 block">Character</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableCharacters.map((char) => (
                                            <button
                                                key={char.id}
                                                className={`p-2 rounded-lg text-center transition-all ${settings.character === char.id
                                                    ? 'bg-blue-500/30 border-2 border-blue-400'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                    }`}
                                                onClick={() => handleChange('character', char.id)}
                                            >
                                                <span className="text-white text-xs">{char.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'display' && (
                            <>
                                <SliderSetting
                                    label="Size"
                                    value={settings.scale || 1}
                                    min={0.5}
                                    max={2}
                                    step={0.1}
                                    onChange={(v) => handleChange('scale', v)}
                                />
                                <SliderSetting
                                    label="Opacity"
                                    value={settings.opacity || 1}
                                    min={0.3}
                                    max={1}
                                    step={0.1}
                                    onChange={(v) => handleChange('opacity', v)}
                                />
                                <div>
                                    <label className="text-white/70 text-sm mb-2 block">Quality</label>
                                    <div className="flex gap-2">
                                        {['low', 'medium', 'high'].map((q) => (
                                            <button
                                                key={q}
                                                className={`flex-1 py-2 rounded-lg text-xs capitalize ${settings.quality === q
                                                    ? 'bg-blue-500/30 text-white'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                    }`}
                                                onClick={() => handleChange('quality', q)}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-white/70 text-sm mb-2 block">Position</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'auto'].map((pos) => (
                                            <button
                                                key={pos}
                                                className={`py-2 px-1 rounded-lg text-xs ${settings.position === pos
                                                    ? 'bg-blue-500/30 text-white'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                    }`}
                                                onClick={() => handleChange('position', pos)}
                                            >
                                                {pos === 'auto' ? '🎯 Auto' : pos.replace('-', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'behavior' && (
                            <>
                                <ToggleSetting
                                    label="Always on Top"
                                    value={settings.alwaysOnTop ?? true}
                                    onChange={(v) => handleChange('alwaysOnTop', v)}
                                />
                                <ToggleSetting
                                    label="Enable Dance"
                                    value={settings.enableDance ?? true}
                                    onChange={(v) => handleChange('enableDance', v)}
                                />
                                <ToggleSetting
                                    label="Enable Gravity"
                                    value={settings.enableGravity ?? false}
                                    onChange={(v) => handleChange('enableGravity', v)}
                                />
                                <ToggleSetting
                                    label="Mouse Tracking"
                                    value={settings.mouseTracking ?? true}
                                    onChange={(v) => handleChange('mouseTracking', v)}
                                />
                                <ToggleSetting
                                    label="Auto Blink"
                                    value={settings.autoBlink ?? true}
                                    onChange={(v) => handleChange('autoBlink', v)}
                                />

                                <div className="pt-2 border-t border-white/10">
                                    <SliderSetting
                                        label="Personality Level"
                                        value={settings.personalityLevel ?? 2}
                                        min={0}
                                        max={3}
                                        step={1}
                                        onChange={(v) => handleChange('personalityLevel', v)}
                                    />
                                    <div className="text-xs text-center text-white/50 mt-1">
                                        {(() => {
                                            switch (settings.personalityLevel ?? 2) {
                                                case 0: return "Strict Assistant (No Emotions)";
                                                case 1: return "Professional (Polite)";
                                                case 2: return "Friendly (Reactive)";
                                                case 3: return "Emotional (Expressive)";
                                                default: return "Friendly";
                                            }
                                        })()}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                            onClick={onClose}
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Slider component
const SliderSetting = ({ label, value, min, max, step, onChange }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-white/70">{label}</span>
            <span className="text-white/50">{value.toFixed(1)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
    </div>
);

// Toggle component
const ToggleSetting = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm">{label}</span>
        <button
            className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-blue-500' : 'bg-white/10'
                }`}
            onClick={() => onChange(!value)}
        >
            <motion.div
                className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                animate={{ left: value ? '26px' : '2px' }}
                transition={{ type: 'spring', damping: 20 }}
            />
        </button>
    </div>
);

export default CharacterCustomizer;
