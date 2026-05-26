import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Phone, PhoneOff, Video, VideoOff, Zap,
    Maximize2, Minimize2, Copy, Check
} from 'lucide-react';
import { LiveKitVoiceButton } from './LiveKitVoiceButton';
import { livekitVoiceService } from '../services/LiveKitVoiceService';

// Premium syntax-highlighted code block component
const CodeBlock = ({ code, language }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    return (
        <div className="my-3.5 rounded-xl border border-white/10 overflow-hidden bg-black/60 shadow-lg font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] text-white/50 tracking-wider uppercase font-sans select-none">
                <span>{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 hover:text-cyan-400 text-white/40 transition-all py-0.5 px-2 rounded bg-white/5 active:scale-95"
                >
                    {copied ? (
                        <>
                            <Check size={11} className="text-green-400" />
                            <span className="text-green-400">Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy size={11} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-cyan-100/90 leading-relaxed max-w-full font-mono">
                <code>{code}</code>
            </pre>
        </div>
    );
};

// Lightweight premium Markdown parser
const RichContent = ({ content }) => {
    if (!content) return null;

    // Split content into code blocks and normal text blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
            const lines = part.slice(3, -3).trim().split('\n');
            const firstLine = lines[0].trim();
            const hasLanguage = !firstLine.includes(' ') && firstLine.length > 0 && firstLine.length < 15;
            const language = hasLanguage ? firstLine : '';
            const code = hasLanguage ? lines.slice(1).join('\n') : lines.join('\n');

            return <CodeBlock key={`code-${index}`} code={code} language={language} />;
        }

        const lines = part.split('\n');
        return (
            <div key={`text-${index}`} className="space-y-1.5">
                {lines.map((line, lineIdx) => {
                    let renderedLine = line;

                    // Bulleted lists
                    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
                    if (isBullet) {
                        renderedLine = line.trim().substring(2);
                    }

                    // Bold formatting (**text**) and inline code (`code`)
                    const elements = [];
                    let lastIdx = 0;
                    const regex = /(\*\*.*?\*\*|`.*?`)/g;
                    let match;
                    let matchIdx = 0;

                    while ((match = regex.exec(renderedLine)) !== null) {
                        const plainText = renderedLine.substring(lastIdx, match.index);
                        if (plainText) {
                            elements.push(<span key={`plain-${matchIdx}`}>{plainText}</span>);
                        }

                        const matchedStr = match[0];
                        if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
                            elements.push(
                                <strong key={`bold-${matchIdx}`} className="font-semibold text-cyan-300">
                                    {matchedStr.slice(2, -2)}
                                </strong>
                            );
                        } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
                            elements.push(
                                <code key={`inline-${matchIdx}`} className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-200 font-mono text-[13px] border border-white/5">
                                    {matchedStr.slice(1, -1)}
                                </code>
                            );
                        }

                        lastIdx = regex.lastIndex;
                        matchIdx++;
                    }

                    const remainingText = renderedLine.substring(lastIdx);
                    if (remainingText) {
                        elements.push(<span key="remaining">{remainingText}</span>);
                    }

                    if (isBullet) {
                        return (
                            <div key={lineIdx} className="flex gap-2 items-start pl-2 text-[15px] leading-relaxed font-light tracking-wide text-white/95">
                                <span className="text-cyan-400/80 mt-1.5 text-sm select-none">•</span>
                                <span className="flex-1">{elements.length > 0 ? elements : line.trim().substring(2)}</span>
                            </div>
                        );
                    }

                    return (
                        <p key={lineIdx} className="text-[15px] leading-relaxed font-light tracking-wide text-white/95 min-h-[1.25rem]">
                            {elements.length > 0 ? elements : line}
                        </p>
                    );
                })}
            </div>
        );
    });
};

const MessageBubble = React.memo(({ message, persona, getMoodEmoji }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
        <div
            className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-xl border transition-all relative ${message.role === 'user'
                ? 'bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 text-white border-indigo-500/20 rounded-br-none shadow-[0_0_25px_rgba(99,102,241,0.08)]'
                : message.isError
                    ? 'bg-red-500/10 text-red-200 border-red-500/20 rounded-bl-none backdrop-blur-md shadow-[0_0_25px_rgba(239,68,68,0.08)]'
                    : message.isCommand
                        ? 'bg-blue-500/10 text-blue-200 border-blue-500/20 rounded-bl-none font-mono text-sm shadow-[0_0_25px_rgba(59,130,246,0.08)]'
                        : 'bg-slate-955/75 backdrop-blur-2xl text-white/95 rounded-bl-none border-cyan-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            }`}
        >
            {/* High-tech corner frames for Assistant messages */}
            {message.role === 'assistant' && !message.isError && (
                <>
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-400/40 rounded-tl-2xl pointer-events-none" />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-400/40 rounded-tr-2xl pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-cyan-400/40 rounded-br-2xl pointer-events-none" />
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-cyan-400/80 select-none">
                        <span className="text-sm">{getMoodEmoji()}</span>
                        <span className="opacity-90 tracking-widest uppercase text-[9px] font-mono">{persona?.name || 'NIZHAL'}</span>
                    </div>
                </>
            )}
            
            {message.role === 'user' && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-indigo-400/40 rounded-tr-2xl pointer-events-none" />
            )}

            <RichContent content={message.content} />
        </div>
    </motion.div>
));

const ChatView = ({
    persona,
    personalityState,
    onListeningChange,
    onThinkingChange,
    onSpeakingChange,
    isAvatarFocused,
    setIsAvatarFocused
}) => {
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

    // Auto-adjust textarea height dynamically
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
        }
    }, [inputValue]);

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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
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
        <div className="h-full flex flex-col relative">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl relative z-10 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center text-sm border border-cyan-500/20 shadow-inner relative">
                        <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-pulse" />
                        {getMoodEmoji()}
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold tracking-wide text-white/90">{persona?.name || 'Nizhal AI'}</h2>
                        <span className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-widest block mt-0.5 font-semibold">
                            {voiceStatus === 'connected' ? 'Neural Sync Active' : 'Text Matrix Link'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Premium Focus Mode Toggle */}
                    {setIsAvatarFocused && (
                        <button
                            type="button"
                            onClick={() => setIsAvatarFocused(!isAvatarFocused)}
                            className={`p-1.5 rounded-lg border text-slate-400 hover:text-cyan-400 transition-all duration-300 active:scale-95 ${
                                isAvatarFocused 
                                    ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                                    : 'bg-white/5 border-transparent hover:bg-white/10'
                            }`}
                            title={isAvatarFocused ? "Exit Avatar Focus Mode" : "Focus Avatar (Full Screen)"}
                        >
                            {isAvatarFocused ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                    )}
                    
                    {/* Link Pulse Indicator */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        <div className={`w-1.5 h-1.5 rounded-full ${voiceStatus === 'connected' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.7)] animate-pulse' : 'bg-cyan-400 animate-pulse'}`} />
                        <span className="text-[9px] text-white/50 font-mono tracking-widest uppercase font-semibold">
                            {voiceStatus === 'connected' ? 'Live Link' : 'Secure'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages stage */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative overflow-x-hidden">
                {/* Dynamic Premium Backdrop Auras */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
                    <div className="aura-blob aura-cyan opacity-40" />
                    <div className="aura-blob aura-purple opacity-30" />
                    <div className="aura-blob aura-center opacity-20" />
                </div>

                <div className="relative z-10 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[300px] text-white/30 text-sm gap-2 select-none">
                            <span className="text-3xl animate-float">💬</span>
                            <span className="font-light">Start a conversation</span>
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

                    {/* Shimmering Skeleton Screen typing visualizer */}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-start w-full max-w-[80%]"
                        >
                            <div className="glass-panel w-full rounded-2xl rounded-bl-sm p-4 border-white/5 space-y-3 shadow-lg select-none">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-white/10 loading-shimmer" />
                                    <div className="w-16 h-3 rounded bg-white/10 loading-shimmer" />
                                </div>
                                <div className="space-y-2">
                                    <div className="w-[90%] h-4 rounded bg-white/10 loading-shimmer" />
                                    <div className="w-[75%] h-4 rounded bg-white/10 loading-shimmer" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
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

            {/* Premium Redesigned Input Panel */}
            <div className="p-4 border-t border-white/5 bg-slate-950/40 backdrop-blur-xl relative z-10">
                <form onSubmit={handleSubmit}>
                    <div className="relative flex items-center gap-2 p-1.5 bg-black/40 border border-white/10 rounded-2xl focus-within:border-cyan-500/35 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.12)] transition-all">
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={inputValue.startsWith('/') ? 'Type /help for commands' : `Message ${persona?.name || 'AI'}...`}
                            disabled={isLoading}
                            rows={1}
                            className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all disabled:opacity-50 resize-none max-h-32 min-h-[46px] leading-relaxed"
                        />

                        {/* Inline Voice connection button */}
                        <button
                            type="button"
                            onClick={() => {
                                const btn = document.querySelector('.livekit-voice-controls button');
                                if (btn) btn.click();
                            }}
                            className={`p-3 rounded-xl transition-all duration-300 active:scale-90 ${
                                voiceStatus === 'connected'
                                    ? 'bg-green-500/15 text-green-400 border border-green-500/25 shadow-[0_0_12px_rgba(74,222,128,0.15)] animate-pulse'
                                    : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                            }`}
                            title={voiceStatus === 'connected' ? 'Voice Active' : 'Start Voice Session'}
                        >
                            {voiceStatus === 'connected' ? <Mic size={16} /> : <MicOff size={16} />}
                        </button>

                        {/* Submit button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            whileTap={{ scale: 0.93 }}
                            className="p-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:from-white/5 disabled:to-white/5 rounded-xl transition-all disabled:cursor-not-allowed shrink-0 shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        </motion.button>
                    </div>

                    {/* Premium shortcut instruction text */}
                    <div className="flex items-center justify-between mt-2 px-1 text-[9px] text-white/20 select-none font-mono tracking-wider uppercase">
                        <span>Enter to send • Shift+Enter for new line</span>
                        <span>Type / for actions</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatView;
