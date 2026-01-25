import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Activity, Settings, Layout,
    Wifi, Shield, ShieldOff, Mic, MicOff,
    Video, VideoOff, Power, Menu, X, Phone
} from 'lucide-react';
import WindowControls from '../WindowControls';
import CameraFeed from '../CameraFeed';
import AnimatedAura from '../effects/AnimatedAura';

/**
 * AppLayout - Unified Responsive Layout
 * Handles switching between Desktop (Sidebar) and Mobile (Bottom Bar) navigation.
 * Provides a consistent shell for all views.
 */
const AppLayout = ({
    children,
    activeTab,
    onTabChange,
    persona,
    isConnected,
    isListening,
    onMicToggle,
    isCameraEnabled,
    onCameraToggle,
    onConnect,
    onDisconnect,
    privacyMode,
    onPrivacyToggle,
    onMirrorToggle,
    windowMode = 'compact' // 'full' | 'compact'
}) => {
    // Navigation Items
    const navItems = [
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'life', label: 'Life', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // Mobile Header
    const MobileHeader = () => (
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-lg drag-region relative z-30">
            <div className="flex items-center gap-3 no-drag">
                <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] ${isConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="font-semibold tracking-widest text-xs uppercase text-white/90">{persona?.displayName || 'NIZHAL'}</span>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2 no-drag">
                <button
                    onClick={onMirrorToggle}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-all active:scale-95"
                    title="Mirror Android"
                >
                    <Phone size={16} />
                </button>

                {/* Camera Toggle */}
                <button
                    onClick={onCameraToggle}
                    className={`p-2 rounded-xl transition-all active:scale-95 ${isCameraEnabled ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:bg-white/5'}`}
                    title="Toggle Camera"
                >
                    {isCameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                </button>

                {/* Privacy Toggle */}
                <button
                    onClick={onPrivacyToggle}
                    className={`p-2 rounded-xl transition-all active:scale-95 ${privacyMode ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                    title="Privacy Mode"
                >
                    {privacyMode ? <Shield size={16} /> : <ShieldOff size={16} />}
                </button>

                {/* Window Controls embedded in header */}
                <div className="pl-2 border-l border-white/10">
                    <WindowControls theme="dark" relative={true} />
                </div>
            </div>
        </div>
    );

    // Desktop Sidebar
    const Sidebar = () => (
        <div className="w-64 h-full flex flex-col bg-black/60 backdrop-blur-[40px] border-r border-white/5 pt-8 relative z-30 shadow-2xl">
            <div className="px-8 mb-10">
                <h1 className="text-3xl font-thin tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-purple-400 drop-shadow-sm">
                    NIZHAL
                </h1>
                <div className="flex items-center gap-2 mt-3 pl-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                        {isConnected ? 'Link Active' : 'Offline'}
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === item.id
                            ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]'
                            : 'text-slate-500 hover:bg-white/5 hover:text-white/90 hover:translate-x-1'
                            }`}
                    >
                        <item.icon size={20} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="font-medium tracking-wide">{item.label}</span>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="active-pill"
                                className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                            />
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={onMirrorToggle}
                        className="p-3.5 rounded-2xl flex items-center justify-center transition-all bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10"
                        title="Mirror Android"
                    >
                        <Phone size={18} />
                    </button>
                    <button
                        onClick={onCameraToggle}
                        className={`p-3.5 rounded-2xl flex items-center justify-center transition-all ${isCameraEnabled ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
                        title="Toggle Camera"
                    >
                        {isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                    </button>
                    <button
                        onClick={onMicToggle}
                        className={`p-3.5 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 animate-pulse' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
                        title="Toggle Mic"
                    >
                        {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    <button
                        onClick={onPrivacyToggle}
                        className={`p-3.5 rounded-2xl flex items-center justify-center transition-all ${privacyMode ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}`}
                        title="Privacy Mode"
                    >
                        {privacyMode ? <Shield size={18} /> : <ShieldOff size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );

    // Bottom Navigation (Mobile/Compact)
    const BottomNav = () => (
        <div className="h-20 bg-black/60 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-4 pb-safe relative z-30">
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex flex-col items-center justify-center w-20 h-full gap-1.5 transition-all ${activeTab === item.id ? 'text-cyan-400 scale-105' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <div className={`p-2.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'hover:bg-white/5'}`}>
                        <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide">{item.label}</span>
                </button>
            ))}

            <button
                onClick={onMicToggle}
                className={`flex flex-col items-center justify-center w-20 h-full gap-1.5 transition-all ${isListening ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
                    }`}
            >
                <div className={`p-2.5 rounded-2xl transition-all ${isListening ? 'bg-indigo-500/15 ring-2 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-pulse' : 'hover:bg-white/5'}`}>
                    {isListening ? <Mic size={22} strokeWidth={2.5} /> : <MicOff size={22} />}
                </div>
                <span className="text-[11px] font-semibold tracking-wide">{isListening ? 'Active' : 'Muted'}</span>
            </button>
        </div>
    );

    const isCompact = windowMode === 'compact';

    return (
        <div className="h-full w-full flex bg-[#030711] text-slate-100 overflow-hidden font-sans selection:bg-cyan-500/30 relative">
            {/* Ambient Animated Background */}
            <AnimatedAura />

            {/* Desktop: Sidebar */}
            {!isCompact && (
                <>
                    <Sidebar />
                    {/* Desktop Window Controls - Absolute Top Right */}
                    <div className="absolute top-0 right-0 z-[60] p-3">
                        <WindowControls theme="dark" />
                    </div>
                </>
            )}

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile: Top Header */}
                {isCompact && <MobileHeader />}

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden relative z-10 p-0">
                    {children}
                </main>

                {/* Mobile: Bottom Navigation */}
                {isCompact && <BottomNav />}
            </div>

            {/* Camera Overlay Window */}
            <AnimatePresence>
                {isCameraEnabled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className={`absolute z-[100] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-black/80 backdrop-blur-xl ${isCompact ? 'bottom-24 right-4 w-36 h-52' : 'bottom-8 right-8 w-72 h-52'
                            }`}
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragMomentum={false}
                    >
                        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
                        <CameraFeed
                            enabled={true}
                            onToggle={onCameraToggle}
                            showControls={false}
                            className="w-full h-full"
                        />
                        {/* Overlay Close Button */}
                        <button
                            onClick={onCameraToggle}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white/50 hover:text-white hover:bg-red-500/80 transition-all z-20 backdrop-blur-md"
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppLayout;
