import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

/**
 * SettingsPanel - Unified Configuration Hub
 * 
 * Tabs:
 * - General: Layout, Display, Scale
 * - Personality: Mode, Character, Aggressiveness
 * - System: Voice, Hardware, Hotkeys
 * - About: Info & Reset
 */
const SettingsPanel = ({ isOpen, onClose, settings, onSettingsChange, availableCharacters, onShare }) => {
    const [activeTab, setActiveTab] = useState('general');

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', icon: '⚡', label: 'General' },
        { id: 'personality', icon: '🧠', label: 'Mind' },
        { id: 'system', icon: '⚙️', label: 'System' },
        { id: 'about', icon: 'ℹ️', label: 'About' }
    ];

    const updateSetting = (key, value) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[600px] h-[500px] nizhal-glass flex overflow-hidden shadow-2xl relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-50"
                >
                    ✕
                </button>

                {/* Sidebar */}
                <div className="w-1/4 bg-white/5 border-r border-white/10 flex flex-col pt-6">
                    <div className="px-6 mb-8">
                        <h2 className="text-xl font-bold tracking-wider text-white">NIZHAL</h2>
                        <p className="text-xs text-white/40">SETTINGS</p>
                    </div>

                    <div className="flex flex-col gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 text-left text-sm font-medium transition-all duration-200 flex items-center gap-3
                                    ${activeTab === tab.id
                                        ? 'bg-white/10 text-white border-l-4 border-[var(--color-primary)]'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white/90 border-l-4 border-transparent'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto p-4">
                        <button
                            onClick={onShare}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            ✨ Share Stats
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto nizhal-scroll relative">
                    <h2 className="text-2xl font-bold text-white mb-6 capitalize">{activeTab} Settings</h2>

                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <SettingSection title="Display">
                                <Toggle
                                    label="Always On Top"
                                    checked={settings.alwaysOnTop}
                                    onChange={(v) => updateSetting('alwaysOnTop', v)}
                                />
                                <Toggle
                                    label="Click Through Overlay"
                                    checked={settings.clickThrough}
                                    onChange={(v) => updateSetting('clickThrough', v)}
                                />
                            </SettingSection>

                            <SettingSection title="Appearance">
                                <Range
                                    label="Scale"
                                    value={settings.scale || 1}
                                    min={0.5} max={2} step={0.1}
                                    onChange={(v) => updateSetting('scale', v)}
                                />
                                <Range
                                    label="Opacity"
                                    value={settings.opacity || 1}
                                    min={0.2} max={1} step={0.1}
                                    onChange={(v) => updateSetting('opacity', v)}
                                />
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === 'personality' && (
                        <div className="space-y-6">
                            <SettingSection title="Core Personality">
                                <div className="grid grid-cols-3 gap-2">
                                    {['gf', 'bf', 'jarvis'].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => window.nizhal?.state?.setPersonalityMode?.(mode)} // Trigger global change
                                            className={`py-2 rounded-lg text-sm font-bold border ${settings.personalityMode === mode
                                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                                                : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                                                } transition-all uppercase`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-white/40 mt-2">
                                    Changing personality requires a module reload.
                                </p>
                            </SettingSection>

                            <SettingSection title="Avatar Model">
                                <select
                                    value={settings.character}
                                    onChange={(e) => updateSetting('character', e.target.value)}
                                    className="w-full bg-black/40 border border-white/20 rounded-lg p-2 text-white text-sm focus:border-[var(--color-primary)] outline-none"
                                >
                                    {availableCharacters.map(char => (
                                        <option key={char.id} value={char.id} className="bg-gray-900">
                                            {char.name} ({char.type})
                                        </option>
                                    ))}
                                </select>
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <SettingSection title="Interaction">
                                <Toggle
                                    label="Voice Response"
                                    checked={settings.voiceEnabled}
                                    onChange={(v) => updateSetting('voiceEnabled', v)}
                                />
                                <Toggle
                                    label="Microphone"
                                    checked={settings.micEnabled}
                                    onChange={(v) => updateSetting('micEnabled', v)}
                                />
                            </SettingSection>

                            <SettingSection title="Performance">
                                <label className="text-sm text-white/70 block mb-2">Graphics Quality</label>
                                <div className="flex bg-black/40 rounded-lg p-1">
                                    {['low', 'medium', 'high'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => updateSetting('quality', q)}
                                            className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${settings.quality === q ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'
                                                }`}
                                        >
                                            {q.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className="text-center pt-8">
                            <div className="w-20 h-20 bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent)] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3">
                                <span className="text-3xl">🧩</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Nizhal AI</h3>
                            <p className="text-white/50 text-sm mb-2">v2.0.0 (Antigravity Core)</p>
                            <p className="text-xs text-white/40 mb-6">by <span className="text-pink-400">@cyber__trinity</span></p>

                            <div className="flex justify-center gap-3 mb-6">
                                <a
                                    href="https://github.com/John-Varghese-EH"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all text-sm flex items-center gap-2"
                                >
                                    <span>📦</span> GitHub
                                </a>
                                <a
                                    href="https://instagram.com/cyber__trinity"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 hover:from-pink-500/30 hover:to-purple-500/30 transition-all text-sm flex items-center gap-2"
                                >
                                    <span>📷</span> Instagram
                                </a>
                            </div>

                            <button className="px-4 py-2 rounded border border-white/20 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm">
                                Check for Updates
                            </button>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <p className="text-xs text-white/30">
                                    Made with ❤️ by John Varghese
                                </p>
                                <p className="text-[10px] text-white/20 mt-1">
                                    nizhal.ai • #NizhalAI
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// --- Helper Components ---

const SettingSection = ({ title, children }) => (
    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">{title}</h3>
        {children}
    </div>
);

const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between mb-3 last:mb-0">
        <span className="text-sm text-white/80">{label}</span>
        <button
            onClick={() => onChange(!checked)}
            className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-[var(--color-primary)]' : 'bg-white/20'}`}
        >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-200 ${checked ? 'left-6' : 'left-1'}`} />
        </button>
    </div>
);

const Range = ({ label, value, min, max, step, onChange }) => (
    <div className="mb-4 last:mb-0">
        <div className="flex justify-between mb-2">
            <span className="text-sm text-white/80">{label}</span>
            <span className="text-xs text-white/50">{value}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-primary)]"
        />
    </div>
);

export default SettingsPanel;
