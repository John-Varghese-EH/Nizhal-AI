import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff, Power,
    Settings, Minimize2, Copy, Cpu, Activity,
    Wifi, Camera, MessageSquare, Phone,
    Shield, ShieldOff
} from 'lucide-react';
import ParticleSphereVisualizer from './ParticleSphereVisualizer';
import ChatView from './ChatView';
import CameraFeed from './CameraFeed';
import SettingsView from './SettingsView';

/**
 * FullDashboard - Full-screen Kreo 2.0 style dashboard
 * Used when window is maximized
 */
const FullDashboard = ({
    persona,
    personalityState,
    isConnected,
    isListening,
    isSpeaking,
    isUserSpeaking,
    isCameraEnabled,
    privacyMode,
    analyserIn,
    analyserOut,
    onConnect,
    onDisconnect,
    onMicToggle,
    onCameraToggle,
    onPrivacyToggle,
    onRestore,
    onSettingsOpen
}) => {
    const [activeTab, setActiveTab] = useState('chat');
    const [systemInfo, setSystemInfo] = useState({
        cpu: '0%',
        memory: '0%',
        connection: 'Offline'
    });

    useEffect(() => {
        loadSystemInfo();
        const interval = setInterval(loadSystemInfo, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadSystemInfo = async () => {
        try {
            const info = await window.nizhal?.system?.getSystemInfo?.();
            if (info) {
                setSystemInfo({
                    cpu: `${info.cpu || 0}%`,
                    memory: `${info.memory || 0}%`,
                    connection: 'Online'
                });
            }
        } catch (error) {
            // Silent fail for system info
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-slate-950 text-white overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-lg font-light tracking-wider">{persona?.displayName || 'NIZHAL AI'}</span>
                    </div>

                    {/* Privacy Mode Indicator */}
                    {privacyMode && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                            <Shield size={12} className="text-green-400" />
                            <span className="text-[10px] text-green-400 font-mono">LOCAL MODE</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* System Status */}
                    <div className="hidden md:flex items-center gap-4 mr-4 text-xs text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                            <Cpu size={12} /> {systemInfo.cpu}
                        </span>
                        <span className="flex items-center gap-1">
                            <Activity size={12} /> {systemInfo.memory}
                        </span>
                        <span className="flex items-center gap-1">
                            <Wifi size={12} className={isConnected ? 'text-cyan-400' : ''} /> {systemInfo.connection}
                        </span>
                    </div>

                    {/* Control Buttons */}
                    <button
                        onClick={onPrivacyToggle}
                        className={`p-2 rounded-lg transition-colors ${privacyMode
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                        title={privacyMode ? 'Privacy Mode: ON (Local Only)' : 'Privacy Mode: OFF (Cloud AI)'}
                    >
                        {privacyMode ? <Shield size={18} /> : <ShieldOff size={18} />}
                    </button>

                    <button
                        onClick={onSettingsOpen}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Settings"
                    >
                        <Settings size={18} className="text-slate-400" />
                    </button>

                    <button
                        onClick={onRestore}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Restore to compact mode"
                    >
                        <Copy size={18} className="text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Visualizer */}
                <div className="w-1/3 min-w-[300px] flex flex-col border-r border-white/5">
                    <div className="flex-1 p-4">
                        <ParticleSphereVisualizer
                            isActive={isConnected && (isListening || isSpeaking)}
                            analyserOut={analyserOut}
                            analyserIn={analyserIn}
                            isUserSpeaking={isUserSpeaking}
                        />
                    </div>

                    {/* Camera Preview */}
                    <div className="p-4 pt-0">
                        <CameraFeed
                            enabled={isCameraEnabled}
                            onToggle={onCameraToggle}
                            privacyMode={privacyMode}
                            showControls={true}
                            className="aspect-video"
                        />
                    </div>

                    {/* Control Bar */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center justify-center gap-3">
                            {/* Mic Toggle */}
                            <motion.button
                                onClick={onMicToggle}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-4 rounded-full transition-all ${isListening
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                                    : 'bg-white/10 text-slate-400 hover:bg-white/20'
                                    }`}
                            >
                                {isListening ? <Mic size={24} /> : <MicOff size={24} />}
                            </motion.button>

                            {/* Camera Toggle */}
                            <motion.button
                                onClick={onCameraToggle}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-4 rounded-full transition-all ${isCameraEnabled
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-white/10 text-slate-400 hover:bg-white/20'
                                    }`}
                            >
                                {isCameraEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                            </motion.button>

                            {/* Connect/Disconnect */}
                            <motion.button
                                onClick={isConnected ? onDisconnect : onConnect}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-4 rounded-full transition-all ${isConnected
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}
                            >
                                <Power size={24} />
                            </motion.button>
                        </div>

                        <p className="text-center text-xs text-slate-500 mt-3 font-mono">
                            {isConnected
                                ? isListening
                                    ? 'Listening...'
                                    : isSpeaking
                                        ? 'Speaking...'
                                        : 'Connected'
                                : 'Tap to connect'}
                        </p>
                    </div>
                </div>

                {/* Right Panel - Chat */}
                <div className="flex-1 flex flex-col">
                    {/* Tab Bar */}
                    <div className="flex items-center gap-1 px-4 pt-4">
                        {['chat', 'notes', 'tasks', 'settings'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                    : 'text-slate-400 hover:bg-white/5'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {activeTab === 'chat' && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full"
                                >
                                    <ChatView
                                        persona={persona}
                                        personalityState={personalityState}
                                    />
                                </motion.div>
                            )}
                            {activeTab === 'notes' && (
                                <motion.div
                                    key="notes"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full p-4"
                                >
                                    <div className="flex items-center justify-center h-full text-slate-500">
                                        <p>Notes feature coming soon...</p>
                                    </div>
                                </motion.div>
                            )}
                            {activeTab === 'tasks' && (
                                <motion.div
                                    key="tasks"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full p-4"
                                >
                                    <div className="flex items-center justify-center h-full text-slate-500">
                                        <p>Tasks feature coming soon...</p>
                                    </div>
                                </motion.div>
                            )}
                            {activeTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <SettingsView
                                        onBack={() => setActiveTab('chat')}
                                        onPersonaChange={() => { }}
                                        privacyMode={privacyMode}
                                        onPrivacyToggle={onPrivacyToggle}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullDashboard;
