import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff, Zap } from 'lucide-react';
import { LiveKitVoiceButton } from './LiveKitVoiceButton';
import { livekitVoiceService } from '../services/LiveKitVoiceService';

const MessageBubble = React.memo(({ message, persona, getMoodEmoji }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
        <div
            className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm ${message.role === 'user'
                ? 'bg-gradient-primary text-white rounded-br-sm'
                : message.isError
                    ? 'bg-red-500/10 text-red-200 border border-red-500/20 rounded-bl-sm backdrop-blur-sm'
                    : message.isCommand
                        ? 'bg-blue-500/10 text-blue-200 border border-blue-500/20 rounded-bl-sm font-mono text-sm'
                        : 'glass-panel text-white/90 rounded-bl-sm border-white/5'
                }`}
        >
            {message.role === 'assistant' && !message.isError && (
                <div className="flex items-center gap-2 mb-1.5 text-xs font-medium text-primary-glow">
                    <span className="text-sm">{getMoodEmoji()}</span>
                    <span className="opacity-70">{persona?.name || 'AI'}</span>
                </div>
            )}
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-light tracking-wide">
                {message.content}
            </p>
        </div>
    </motion.div>
));

const ChatView = ({ persona, personalityState }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('disconnected');
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [livekitRoom, setLivekitRoom] = useState(null);
    const [liveKitEmotion, setLiveKitEmotion] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Subscribe to real-time emotion updates from voice agent
    useEffect(() => {
        livekitVoiceService.onEmotion = (emotion) => {
            setLiveKitEmotion(emotion);
            setTimeout(() => setLiveKitEmotion(null), 5000);
        };

        return () => {
            livekitVoiceService.onEmotion = null;
        };
    }, []);

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
                const formattedHistory = history.map(entry => ({
                    role: entry.role === 'user' ? 'user' : 'assistant',
                    content: entry.content || '',
                    timestamp: entry.timestamp
                }));
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

        // Handle slash commands
        if (userMessage.startsWith('/')) {
            await handleCommand(userMessage);
            return;
        }

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
                    content: response.response || response.text,
                    timestamp: Date.now()
                }]);

                const prefs = await window.nizhal?.memory.getUserPreferences();
                if (prefs?.voiceEnabled) {
                    await window.nizhal?.voice.speak(response.response || response.text);
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

    const handleCommand = async (command) => {
        const [cmd, ...args] = command.slice(1).toLowerCase().split(' ');
        const arg = args.join(' ');

        let responseText = '';

        switch (cmd) {
            case 'voice':
                if (voiceStatus === 'connected') {
                    responseText = '🎤 Voice already connected!';
                } else {
                    responseText = '🎤 Connecting to voice... Click the "Connect Voice" button above.';
                }
                break;

            case 'camera':
                if (voiceStatus !== 'connected') {
                    responseText = '📹 Please connect to voice first to use camera.';
                } else {
                    setCameraEnabled(!cameraEnabled);
                    responseText = cameraEnabled ? '📹 Camera turned off' : '📹 Camera turned on';
                }
                break;

            case 'personality':
            case 'mode':
                const modes = {
                    'gf': 'Girlfriend',
                    'bf': 'Boyfriend',
                    'jarvis': 'JARVIS',
                    'lachu': 'Lakshmi (Lachu)'
                };
                if (arg && modes[arg]) {
                    await window.nizhal?.persona.setActive(arg);
                    responseText = `🎭 Switched to ${modes[arg]} personality`;
                } else {
                    responseText = `🎭 Available personalities:\n${Object.entries(modes).map(([k, v]) => `  /${cmd} ${k} - ${v}`).join('\n')}`;
                }
                break;

            case 'clear':
                setMessages([{
                    role: 'assistant',
                    content: getGreeting(),
                    timestamp: Date.now()
                }]);
                responseText = '🗑️ Chat history cleared';
                break;

            case 'help':
                responseText = `📋 **Available Commands:**
/voice - Connect to voice chat
/camera - Toggle camera (voice must be connected)
/personality [gf|bf|jarvis|lachu] - Switch personality
/clear - Clear chat history
/status - Show system status
/help - Show this help message

**Keyboard Shortcuts:**
Ctrl+1 - GF mode
Ctrl+2 - BF mode
Ctrl+3 - JARVIS mode
Ctrl+4 - Lachu mode`;
                break;

            case 'status':
                const lkStatus = await window.nizhal?.livekit?.getStatus();
                const voiceMode = lkStatus?.configured ? 'LiveKit configured' : 'Fallback mode';
                responseText = `📊 **System Status:**
🎤 Voice: ${voiceStatus}
🎥 Camera: ${cameraEnabled ? 'enabled' : 'disabled'}
🎭 Personality: ${persona?.name || 'Unknown'}
🔊 Voice System: ${voiceMode}
${voiceStatus === 'connected' ? '✅ LiveKit connected' : '⚠️ LiveKit not connected'}`;
                break;

            default:
                responseText = `❌ Unknown command: /${cmd}\nType /help for available commands.`;
        }

        // Add command and response to chat
        setMessages(prev => [
            ...prev,
            { role: 'user', content: command, timestamp: Date.now() },
            { role: 'assistant', content: responseText, timestamp: Date.now(), isCommand: true }
        ]);
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
        const activeMood = liveKitEmotion || personalityState?.mood || 'neutral';
        return moods[activeMood] || '🤖';
    };



    return (
        <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 flex items-center justify-center text-sm border border-white/10">
                        {getMoodEmoji()}
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white/90">{persona?.name || 'Nizhal AI'}</h2>
                        <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                            {voiceStatus === 'connected' ? '● Voice Active' : 'Text Mode'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${voiceStatus === 'connected' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)] animate-pulse' : 'bg-white/20'}`} />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm gap-2">
                        <span className="text-3xl">💬</span>
                        <span>Start a conversation</span>
                        <span className="text-xs text-white/20">Type a message or use /help for commands</span>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                        <MessageBubble
                            key={`${message.timestamp}-${index}`}
                            message={message}
                            persona={persona}
                            getMoodEmoji={getMoodEmoji}
                        />
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="glass-panel rounded-2xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-cyan-400 rounded-full"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            delay: i * 0.12
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Compact Voice Toolbar + LiveKit (hidden but functional) */}
            <div className="hidden">
                <LiveKitVoiceButton
                    userName={persona?.name || 'User'}
                    onStatusChange={(status) => setVoiceStatus(status)}
                    onRoomConnected={(room) => setLivekitRoom(room)}
                    cameraEnabled={cameraEnabled}
                    onCameraToggle={setCameraEnabled}
                />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={inputValue.startsWith('/') ? 'Type /help for commands' : `Message ${persona?.name || 'AI'}...`}
                                disabled={isLoading}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.07] transition-all disabled:opacity-50"
                            />
                        </div>

                        {/* Voice toggle inline */}
                        <button
                            type="button"
                            onClick={() => {
                                if (voiceStatus === 'connected') {
                                    // Already handled by LiveKitVoiceButton
                                } else {
                                    // Try connecting via the hidden LiveKit button
                                    const btn = document.querySelector('.livekit-voice-controls button');
                                    if (btn) btn.click();
                                }
                            }}
                            className={`p-3 rounded-2xl transition-all shrink-0 ${
                                voiceStatus === 'connected'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_12px_rgba(74,222,128,0.15)]'
                                    : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/70'
                            }`}
                            title={voiceStatus === 'connected' ? 'Voice Connected' : 'Connect Voice'}
                        >
                            {voiceStatus === 'connected' ? <Mic size={18} /> : <MicOff size={18} />}
                        </button>

                        <motion.button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            whileTap={{ scale: 0.93 }}
                            className="p-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:from-white/10 disabled:to-white/10 rounded-2xl transition-all disabled:cursor-not-allowed shrink-0 shadow-lg shadow-cyan-500/10 disabled:shadow-none"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        </motion.button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatView;
