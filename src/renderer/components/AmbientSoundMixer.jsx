import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { ambientSoundService } from '../../services/AmbientSoundService';

/**
 * AmbientSoundMixer - Focus Soundscapes UI
 */
const AmbientSoundMixer = ({ isOpen, onClose }) => {
    const [state, setState] = useState({
        isPlaying: false,
        currentPreset: null,
        activeSounds: {},
        masterVolume: 0.5
    });
    const [activeTab, setActiveTab] = useState('sounds');

    const sounds = ambientSoundService.getSounds();
    const presets = ambientSoundService.getPresets();

    useEffect(() => {
        if (isOpen) {
            ambientSoundService.initialize();
            updateState();
        }
    }, [isOpen]);

    const updateState = () => {
        setState(ambientSoundService.getState());
    };

    const handleToggleSound = async (soundId) => {
        await ambientSoundService.toggleSound(soundId, 0.5);
        updateState();
    };

    const handleVolumeChange = (soundId, volume) => {
        ambientSoundService.setVolume(soundId, volume);
        updateState();
    };

    const handleMasterVolumeChange = (volume) => {
        ambientSoundService.setMasterVolume(volume);
        updateState();
    };

    const handlePlayPreset = async (presetId) => {
        await ambientSoundService.playPreset(presetId);
        updateState();
    };

    const handleStopAll = () => {
        ambientSoundService.stopAll();
        updateState();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                                🎧
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Focus Sounds</h2>
                                <p className="text-xs text-white/50">Ambient soundscapes</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-white/50" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('sounds')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'sounds'
                                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-white/50'
                                }`}
                        >
                            Sounds
                        </button>
                        <button
                            onClick={() => setActiveTab('presets')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'presets'
                                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                                    : 'text-white/50'
                                }`}
                        >
                            Presets
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        {activeTab === 'sounds' && (
                            <div className="space-y-3">
                                {sounds.map(sound => {
                                    const isActive = state.activeSounds[sound.id] !== undefined;
                                    const volume = state.activeSounds[sound.id] || 0.5;

                                    return (
                                        <div
                                            key={sound.id}
                                            className={`p-3 rounded-xl transition-colors ${isActive ? 'bg-cyan-500/20' : 'bg-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggleSound(sound.id)}
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isActive
                                                            ? 'bg-cyan-500 text-white'
                                                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                                                        }`}
                                                >
                                                    <span className="text-2xl">{sound.icon}</span>
                                                </button>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-white">
                                                            {sound.name}
                                                        </span>
                                                        {isActive && (
                                                            <span className="text-xs text-cyan-400">
                                                                {Math.round(volume * 100)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-white/40">{sound.description}</p>
                                                    {isActive && (
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.01"
                                                            value={volume}
                                                            onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                                                            className="w-full h-1 mt-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'presets' && (
                            <div className="grid grid-cols-2 gap-3">
                                {presets.map(preset => (
                                    <motion.button
                                        key={preset.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handlePlayPreset(preset.id)}
                                        className={`p-4 rounded-xl text-left transition-colors ${state.currentPreset === preset.id
                                                ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-500/50'
                                                : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-3xl">{preset.icon}</span>
                                        <h3 className="text-sm font-medium text-white mt-2">{preset.name}</h3>
                                        <p className="text-xs text-white/40">
                                            {Object.keys(preset.sounds).length} sounds
                                        </p>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 space-y-3">
                        {/* Master Volume */}
                        <div className="flex items-center gap-3">
                            <VolumeX size={18} className="text-white/40" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={state.masterVolume}
                                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            />
                            <Volume2 size={18} className="text-white/40" />
                        </div>

                        {/* Controls */}
                        <div className="flex gap-2">
                            {state.isPlaying ? (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleStopAll}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium"
                                >
                                    <Pause size={18} />
                                    Stop All
                                </motion.button>
                            ) : (
                                <div className="flex-1 text-center py-3 text-white/30 text-sm">
                                    Select sounds to play
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AmbientSoundMixer;
