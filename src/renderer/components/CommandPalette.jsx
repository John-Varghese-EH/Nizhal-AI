import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Settings, MessageSquare, Calendar, Sun, Moon, Mic, Camera, X } from 'lucide-react';

/**
 * CommandPalette - Quick action search (Ctrl+K)
 * 
 * Provides spotlight-style command search for quick access
 * to features, settings, and actions.
 */
const CommandPalette = ({ isOpen, onClose, onAction }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Define available commands
    const commands = [
        // Navigation
        { id: 'nav_chat', label: 'Go to Chat', icon: MessageSquare, category: 'Navigation', shortcut: 'Ctrl+1' },
        { id: 'nav_life', label: 'Go to Life Dashboard', icon: Calendar, category: 'Navigation', shortcut: 'Ctrl+2' },
        { id: 'nav_settings', label: 'Open Settings', icon: Settings, category: 'Navigation', shortcut: 'Ctrl+,' },

        // Actions
        { id: 'toggle_voice', label: 'Toggle Voice Input', icon: Mic, category: 'Actions', shortcut: 'Ctrl+M' },
        { id: 'toggle_camera', label: 'Toggle Camera', icon: Camera, category: 'Actions' },
        { id: 'start_focus', label: 'Start Focus Mode', icon: Sun, category: 'Actions', shortcut: 'Ctrl+F' },

        // Quick Commands
        { id: 'cmd_weather', label: 'Get Weather', icon: Sun, category: 'Commands', action: '/weather' },
        { id: 'cmd_remind', label: 'Set Reminder', icon: Calendar, category: 'Commands', action: '/remind' },
        { id: 'cmd_note', label: 'Quick Note', icon: Command, category: 'Commands', action: '/note' },

        // Emotions
        { id: 'emotion_happy', label: 'Set Happy Emotion', icon: () => <span>😊</span>, category: 'Emotions' },
        { id: 'emotion_sad', label: 'Set Sad Emotion', icon: () => <span>😢</span>, category: 'Emotions' },
        { id: 'emotion_love', label: 'Set Love Emotion', icon: () => <span>🥰</span>, category: 'Emotions' },
        { id: 'emotion_excited', label: 'Set Excited Emotion', icon: () => <span>🤩</span>, category: 'Emotions' },

        // Settings
        { id: 'theme_dark', label: 'Dark Theme', icon: Moon, category: 'Themes' },
        { id: 'theme_midnight', label: 'Midnight Theme', icon: Moon, category: 'Themes' },
        { id: 'theme_amoled', label: 'AMOLED Theme', icon: Moon, category: 'Themes' }
    ];

    // Filter commands based on query
    const filteredCommands = query
        ? commands.filter(cmd =>
            cmd.label.toLowerCase().includes(query.toLowerCase()) ||
            cmd.category.toLowerCase().includes(query.toLowerCase())
        )
        : commands;

    // Group by category
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {});

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                executeCommand(filteredCommands[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [filteredCommands, selectedIndex, onClose]);

    const executeCommand = (command) => {
        onAction?.(command);
        onClose();
    };

    // Global keyboard shortcut
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                // Toggle palette - this would be handled by parent
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.15 }}
                    className="w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                    onKeyDown={handleKeyDown}
                >
                    {/* Search Input */}
                    <div className="p-4 border-b border-white/10 flex items-center gap-3">
                        <Search size={20} className="text-white/40" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            placeholder="Search commands..."
                            className="flex-1 bg-transparent text-white text-lg placeholder-white/30 focus:outline-none"
                        />
                        <div className="flex items-center gap-1 text-xs text-white/30">
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd>
                            <span>to close</span>
                        </div>
                    </div>

                    {/* Command List */}
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {Object.entries(groupedCommands).map(([category, cmds]) => (
                            <div key={category} className="mb-3">
                                <div className="px-3 py-1 text-xs text-white/40 uppercase tracking-wider">
                                    {category}
                                </div>
                                {cmds.map((cmd, idx) => {
                                    const Icon = cmd.icon;
                                    const globalIndex = filteredCommands.indexOf(cmd);
                                    const isSelected = globalIndex === selectedIndex;

                                    return (
                                        <motion.button
                                            key={cmd.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => executeCommand(cmd)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isSelected
                                                    ? 'bg-cyan-500/20 text-cyan-400'
                                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-cyan-500/20' : 'bg-white/5'
                                                }`}>
                                                {typeof Icon === 'function' ? <Icon size={16} /> : <Icon size={16} />}
                                            </div>
                                            <span className="flex-1 text-left">{cmd.label}</span>
                                            {cmd.shortcut && (
                                                <kbd className="px-2 py-0.5 text-xs bg-white/5 rounded text-white/40">
                                                    {cmd.shortcut}
                                                </kbd>
                                            )}
                                            <ArrowRight size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                                        </motion.button>
                                    );
                                })}
                            </div>
                        ))}

                        {filteredCommands.length === 0 && (
                            <div className="py-8 text-center text-white/30">
                                <Command size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No commands found for "{query}"</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-xs text-white/30">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 bg-white/10 rounded">↑↓</kbd> navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 bg-white/10 rounded">↵</kbd> select
                            </span>
                        </div>
                        <span>{filteredCommands.length} commands</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CommandPalette;
