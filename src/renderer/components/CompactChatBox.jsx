import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Maximize2, X, Settings } from 'lucide-react';

/**
 * CompactChatBox - Minimal floating chat UI for minimized window state
 * Inspired by Kreo 2.0's compact mode
 */
const CompactChatBox = ({
    persona,
    onExpand,
    onClose,
    isListening,
    onVoiceToggle,
    privacyMode = false
}) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showMessages, setShowMessages] = useState(true);
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadRecentMessages();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadRecentMessages = async () => {
        try {
            const history = await window.nizhal?.memory.getHistory(5);
            if (history && history.length > 0) {
                const formatted = history.flatMap(entry => [
                    { role: 'user', content: entry.userMessage },
                    { role: 'assistant', content: entry.aiResponse }
                ]).slice(-6); // Last 6 messages only
                setMessages(formatted);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }].slice(-6));

        // Game Triggers
        const lowerMsg = userMessage.toLowerCase();
        if (lowerMsg.includes('play tic tac toe') || lowerMsg.includes('start tic tac toe')) {
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'assistant', content: "Initializing Tic-Tac-Toe protocol... Let's play! 🎮" }].slice(-6));
                window.nizhal?.character.toggleGame(true);
            }, 600);
            return;
        }

        setIsLoading(true);

        try {
            const response = await window.nizhal?.ai.chat(userMessage);

            if (response?.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.response }].slice(-6));
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: response?.error || 'Error occurred', isError: true }].slice(-6));
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error', isError: true }].slice(-6));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 right-4 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-cyan-400 animate-pulse' : 'bg-green-400'}`} />
                    <span className="text-sm font-medium text-white">{persona?.displayName || 'Nizhal AI'}</span>
                    {privacyMode && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">LOCAL</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowMessages(!showMessages)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Toggle messages"
                    >
                        <motion.div animate={{ rotate: showMessages ? 0 : 180 }}>
                            <X size={14} className="text-slate-400" />
                        </motion.div>
                    </button>
                    <button
                        onClick={onExpand}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Expand to full view"
                    >
                        <Maximize2 size={14} className="text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Messages (collapsible) */}
            <AnimatePresence>
                {showMessages && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${msg.role === 'user'
                                        ? 'bg-cyan-600 text-white'
                                        : msg.isError
                                            ? 'bg-red-500/20 text-red-300'
                                            : 'bg-white/10 text-white/90'
                                        }`}>
                                        {msg.content.length > 150 ? msg.content.slice(0, 150) + '...' : msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 rounded-xl px-3 py-2">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                                                    animate={{ y: [0, -4, 0] }}
                                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-white/5">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onVoiceToggle}
                        className={`p-2 rounded-lg transition-colors ${isListening
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                    </button>

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Message..."
                        disabled={isLoading}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-white/10 rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default CompactChatBox;
