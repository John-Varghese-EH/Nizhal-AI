import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Smartphone, Grid, Play, Square, Circle,
    Volume2, VolumeX, Home, ArrowLeft, Camera, Send,
    Battery, Wifi, Power, Layers, RefreshCw
} from 'lucide-react';

const AndroidControlPanel = () => {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'apps', 'terminal'
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [textInput, setTextInput] = useState('');

    // Terminal State (from old PentesterView)
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [terminalInput, setTerminalInput] = useState('');
    const [isLogcatActive, setIsLogcatActive] = useState(false);
    const logIntervalRef = useRef(null);
    const outputEndRef = useRef(null);

    useEffect(() => {
        refreshDeviceInfo();
        return () => stopLogcat();
    }, []);

    const refreshDeviceInfo = async () => {
        try {
            const info = await window.nizhal.adb.getDeviceInfo();
            if (info.success) setDeviceInfo(info);
        } catch (e) {
            console.error(e);
        }
    };

    // --- NAVIGATION & CONTROLS ---

    const sendKey = async (keycode) => {
        await window.nizhal.adb.keyEvent(keycode);
    };

    const handleTextType = async (e) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        await window.nizhal.adb.typeText(textInput);
        setTextInput('');
    };

    const launchApp = async (app) => {
        await window.nizhal.adb.launchApp(app);
    };

    // --- TERMINAL LOGIC ---

    const handleShellSubmit = async (e) => {
        e.preventDefault();
        if (!terminalInput.trim()) return;

        const cmd = terminalInput.trim();
        setTerminalInput('');
        addToOutput(`$ ${cmd}`, 'command');

        if (cmd === 'clear') {
            setTerminalOutput([]);
            return;
        }

        try {
            const result = await window.nizhal.adb.shell(cmd);
            addToOutput(result.success ? (result.output || 'Done') : (result.error || 'Failed'), result.success ? 'success' : 'error');
        } catch (error) {
            addToOutput(error.message, 'error');
        }
    };

    const startLogcat = () => {
        setIsLogcatActive(true);
        addToOutput('--- LOGCAT STARTED ---', 'system');
        logIntervalRef.current = setInterval(async () => {
            const result = await window.nizhal.adb.logcat(20);
            if (result.success && result.logs) {
                setTerminalOutput(prev => {
                    const newLogs = result.logs.split('\n').filter(l => l.trim()).map(l => ({ type: 'log', content: l }));
                    return [...prev, ...newLogs].slice(-200);
                });
                outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }, 2000);
    };

    const stopLogcat = () => {
        if (logIntervalRef.current) clearInterval(logIntervalRef.current);
        setIsLogcatActive(false);
        addToOutput('--- LOGCAT STOPPED ---', 'system');
    };

    const addToOutput = (content, type) => {
        setTerminalOutput(prev => [...prev, { content, type }]);
        setTimeout(() => outputEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    return (
        <div className="h-full flex flex-col bg-slate-900/90 backdrop-blur-xl text-white overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                    <div>
                        <h2 className="font-bold text-sm tracking-wide">ANDROID HUB</h2>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                            {deviceInfo ? (
                                <>
                                    <span>{deviceInfo.model}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/30" />
                                    <span className={deviceInfo.batteryLevel ? 'text-green-400' : ''}>{deviceInfo.batteryLevel}</span>
                                </>
                            ) : (
                                <span className="text-yellow-500 animate-pulse">Connecting...</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex bg-black/40 rounded-lg p-1 gap-1">
                    {['dashboard', 'apps', 'terminal'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {tab.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <AnimatePresence mode="wait">

                    {/* DASHBOARD TAB */}
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Navigation Keys */}
                            <section>
                                <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">Navigation</h3>
                                <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                                    <button onClick={() => sendKey(4)} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95 group">
                                        <ArrowLeft className="w-6 h-6 text-white/70 group-hover:text-white" />
                                    </button>
                                    <button onClick={() => sendKey(3)} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95 group">
                                        <Circle className="w-6 h-6 text-white/70 group-hover:text-white" />
                                    </button>
                                    <button onClick={() => sendKey(187)} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95 group">
                                        <Square className="w-5 h-5 text-white/70 group-hover:text-white" />
                                    </button>
                                </div>
                            </section>

                            {/* Media & Volume */}
                            <section>
                                <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">Media Control</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    <button onClick={() => sendKey(85)} className="col-span-2 p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg flex items-center justify-center gap-2 transition-all">
                                        <Play className="w-4 h-4" /> Play/Pause
                                    </button>
                                    <button onClick={() => sendKey(24)} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg flex justify-center"><Volume2 className="w-5 h-5" /></button>
                                    <button onClick={() => sendKey(25)} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg flex justify-center"><VolumeX className="w-5 h-5" /></button>
                                </div>
                            </section>

                            {/* Quick Type */}
                            <section>
                                <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">Quick Type</h3>
                                <form onSubmit={handleTextType} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Type on phone..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                                    />
                                    <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </section>

                            {/* System Actions */}
                            <section>
                                <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">System</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => window.nizhal.adb.screenshot()} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2 text-sm text-white/80">
                                        <Camera className="w-4 h-4" /> Screenshot
                                    </button>
                                    <button onClick={() => sendKey(26)} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2 text-sm">
                                        <Power className="w-4 h-4" /> Lock Screen
                                    </button>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {/* APPS TAB */}
                    {activeTab === 'apps' && (
                        <motion.div
                            key="apps"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { name: 'YouTube', id: 'youtube', color: 'bg-red-600' },
                                    { name: 'Chrome', id: 'chrome', color: 'bg-yellow-500' },
                                    { name: 'Instagram', id: 'instagram', color: 'bg-pink-600' },
                                    { name: 'WhatsApp', id: 'whatsapp', color: 'bg-green-500' },
                                    { name: 'Spotify', id: 'spotify', color: 'bg-green-600' },
                                    { name: 'TikTok', id: 'tiktok', color: 'bg-black border border-white/20' },
                                    { name: 'Twitter', id: 'twitter', color: 'bg-blue-400' },
                                    { name: 'Settings', id: 'settings', color: 'bg-gray-600' },
                                    { name: 'Play Store', id: 'play store', color: 'bg-teal-500' },
                                ].map(app => (
                                    <button
                                        key={app.id}
                                        onClick={() => launchApp(app.id)}
                                        className="aspect-square bg-white/5 hover:bg-white/10 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 group"
                                    >
                                        <div className={`w-10 h-10 rounded-full ${app.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                                            <span className="text-white font-bold text-lg">{app.name[0]}</span>
                                        </div>
                                        <span className="text-xs text-white/70">{app.name}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* TERMINAL TAB (Converted from PentesterView) */}
                    {activeTab === 'terminal' && (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col"
                        >
                            <div className="flex-1 bg-black/50 rounded-lg p-2 font-mono text-xs text-green-400 overflow-y-auto mb-3 border border-green-500/20 shadow-inner">
                                {terminalOutput.map((line, i) => (
                                    <div key={i} className={`mb-1 break-all ${line.type === 'error' ? 'text-red-400' : line.type === 'command' ? 'text-yellow-400 font-bold' : ''}`}>
                                        {line.type === 'command' && '$ '}
                                        {line.content}
                                    </div>
                                ))}
                                <div ref={outputEndRef} />
                            </div>

                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={isLogcatActive ? stopLogcat : startLogcat}
                                    className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${isLogcatActive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        }`}
                                >
                                    {isLogcatActive ? 'STOP LOGCAT' : 'START LOGCAT'}
                                </button>
                                <button
                                    onClick={() => { setTerminalOutput([]); window.nizhal.adb.clearLogcat(); }}
                                    className="px-3 bg-white/5 hover:bg-white/10 rounded text-xs text-white/70"
                                >
                                    CLR
                                </button>
                            </div>

                            <form onSubmit={handleShellSubmit} className="flex gap-2">
                                <span className="text-green-500 font-bold py-1.5">$</span>
                                <input
                                    type="text"
                                    value={terminalInput}
                                    onChange={(e) => setTerminalInput(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-800 text-sm font-mono"
                                    placeholder="adb shell..."
                                />
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AndroidControlPanel;
