import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveKitVoiceButton } from './LiveKitVoiceButton';
import { LiveKitVideoPreview } from './LiveKitVideoPreview';

const ChatView = ({ persona, personalityState }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('disconnected');
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [livekitRoom, setLivekitRoom] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Sync LiveKit voice status with global system
    useEffect(() => {
        // When voice status changes, notify the system
        if (window.nizhalAI?.voiceManager) {
            const connected = (voiceStatus === 'connected');
            window.nizhalAI.voiceManager.setLivekitStatus(connected);
            console.log('[ChatView] LiveKit status synced:', connected);
        }
    }, [voiceStatus]);

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

            {/* Voice & Camera Controls */}
            <div className="mx-4 mt-2 p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Voice & Camera</span>
                    {/* Connection Status Indicator */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${voiceStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500/50'}`} />
                        <span className="text-xs text-white/40">{voiceStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </div>

                <LiveKitVoiceButton
                    userName={persona?.name || 'User'}
                    onStatusChange={(status) => setVoiceStatus(status)}
                    onRoomConnected={(room) => setLivekitRoom(room)}
                    cameraEnabled={cameraEnabled}
                    onCameraToggle={setCameraEnabled}
                />

                {/* Camera Preview (only when voice connected) */}
                {voiceStatus === 'connected' && livekitRoom && (
                    <LiveKitVideoPreview
                        room={livekitRoom}
                        enabled={cameraEnabled}
                        onToggle={(enabled) => setCameraEnabled(enabled)}
                        hideControls={true}
                    />
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={inputValue.startsWith('/') ? 'Type /help for commands' : `Message ${persona?.name || 'AI'}...`}
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
