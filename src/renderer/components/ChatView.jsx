import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatView = ({ persona, personalityState }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadHistory = async () => {
        try {
            const history = await window.nizhal?.memory.getHistory(20);
            if (history && history.length > 0) {
                const formattedHistory = history.flatMap(entry => [
                    { role: 'user', content: entry.userMessage, timestamp: entry.timestamp },
                    { role: 'assistant', content: entry.aiResponse, timestamp: entry.timestamp }
                ]);
                setMessages(formattedHistory);
            } else {
                setMessages([{
                    role: 'assistant',
                    content: getGreeting(),
                    timestamp: Date.now()
                }]);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const getGreeting = () => {
        const greetings = {
            jarvis: "Good day. I am at your service. How may I assist you?",
            bestie: "Hey! How are you doing? I'm here for you, let's chat! ❤️",
            buddy: "Hey bro! What's up? I'm ready to help!"
        };
        return greetings[persona?.id] || "Hello! I'm Nizhal AI. How can I help you today?";
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
        }]);

        setIsLoading(true);
        setIsTyping(true);

        try {
            const response = await window.nizhal?.ai.chat(userMessage);

            if (response?.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.response,
                    timestamp: Date.now()
                }]);

                const prefs = await window.nizhal?.memory.getUserPreferences();
                if (prefs?.voiceEnabled) {
                    await window.nizhal?.voice.speak(response.response);
                }
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response?.error || 'I encountered an issue. Please try again.',
                    timestamp: Date.now(),
                    isError: true
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Connection error. Please check your AI provider settings.',
                timestamp: Date.now(),
                isError: true
            }]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const getMoodEmoji = () => {
        const moods = {
            happy: '😊',
            neutral: '🤖',
            concerned: '😟',
            protective: '🛡️',
            playful: '😄',
            thoughtful: '🤔'
        };
        return moods[personalityState?.mood] || '🤖';
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : message.isError
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30 rounded-bl-sm'
                                        : 'bg-white/10 text-white/90 rounded-bl-sm'
                                    }`}
                            >
                                {message.role === 'assistant' && !message.isError && (
                                    <div className="flex items-center gap-2 mb-1 text-xs text-white/50">
                                        <span>{getMoodEmoji()}</span>
                                        <span>{persona?.name || 'AI'}</span>
                                    </div>
                                )}
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.1
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={`Message ${persona?.name || 'AI'}...`}
                        disabled={isLoading}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
                    />
                    <motion.button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-white/10 rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default ChatView;
