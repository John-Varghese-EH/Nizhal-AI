import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw, Cpu, Activity, Camera, Mic, Volume2 } from 'lucide-react';
import PermissionService from '../../services/PermissionService';

const HardwareDiagnostic = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [stats, setStats] = useState({
        audioServer: 'scanning', // 'ok' | 'fail' | 'scanning'
        camera: 'scanning',
        microphone: 'scanning',
        portal: 'scanning'
    });
    const [hasRan, setHasRan] = useState(false);

    const runProbe = async () => {
        setIsScanning(true);
        setStats({
            audioServer: 'scanning',
            camera: 'scanning',
            microphone: 'scanning',
            portal: 'scanning'
        });

        // 1. Run DBus XDG Portal verify (Linux-only, true on others)
        let portalActive = true;
        try {
            portalActive = await PermissionService.checkXdgPortal();
        } catch (e) {
            console.error('Portal probe failed:', e);
        }

        // 2. Run PipeWire / Host Audio Server verification
        let audioServerOk = false;
        try {
            if (window.nizhal?.invoke) {
                audioServerOk = await window.nizhal.invoke('check_pipewire_status');
            } else {
                audioServerOk = true; // Fallback in non-tauri development environment
            }
        } catch (e) {
            console.error('Audio server probe failed:', e);
        }

        // 3. Camera Detection (Hardware presence check)
        const cameraVisible = await PermissionService.isHardwareVisible('videoinput');

        // 4. Microphone Detection (Hardware presence check)
        const micVisible = await PermissionService.isHardwareVisible('audioinput');

        setStats({
            audioServer: audioServerOk ? 'ok' : 'fail',
            camera: cameraVisible ? 'ok' : 'fail',
            microphone: micVisible ? 'ok' : 'fail',
            portal: portalActive ? 'ok' : 'fail'
        });

        setIsScanning(false);
        setHasRan(true);
    };

    useEffect(() => {
        // Run on startup
        runProbe();

        // Auto-close after 8 seconds of success to keep dashboard clean
        const timer = setTimeout(() => {
            if (stats.audioServer === 'ok' && stats.camera === 'ok' && stats.microphone === 'ok') {
                setIsVisible(false);
            }
        }, 8000);

        return () => clearTimeout(timer);
    }, [hasRan]);

    if (!isVisible) {
        // Return a tiny hoverable floating pill in the corner to bring diagnostics back
        return (
            <div className="fixed bottom-4 left-4 z-[999] select-none">
                <button
                    onClick={() => setIsVisible(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 border border-white/10 hover:border-cyan-500/30 rounded-full text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-all shadow-lg backdrop-blur-md"
                >
                    <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span>SYS HEALTH</span>
                </button>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: -50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                className="fixed bottom-4 left-4 z-[999] w-72 rounded-2xl bg-[#090D1A]/95 border border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-md overflow-hidden font-mono select-none"
            >
                {/* Header */}
                <div className="p-3 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-300 tracking-wider">HARDWARE DIAGNOSTICS</span>
                    </div>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="text-[9px] text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-white/5"
                    >
                        Hide
                    </button>
                </div>

                {/* Body checklist */}
                <div className="p-4 space-y-3">
                    {/* Item: Audio Server / PipeWire */}
                    <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Volume2 className="w-3.5 h-3.5 text-indigo-400/80" />
                            <span>PipeWire/Audio Server</span>
                        </div>
                        {stats.audioServer === 'scanning' ? (
                            <span className="text-[9px] text-indigo-400 animate-pulse">PROBING...</span>
                        ) : stats.audioServer === 'ok' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE</span>
                        ) : (
                            <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> INACTIVE</span>
                        )}
                    </div>

                    {/* Item: Portal D-Bus */}
                    <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400/80" />
                            <span>XDG Desktop Portal</span>
                        </div>
                        {stats.portal === 'scanning' ? (
                            <span className="text-[9px] text-indigo-400 animate-pulse">PROBING...</span>
                        ) : stats.portal === 'ok' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE</span>
                        ) : (
                            <span className="text-amber-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> MISSING</span>
                        )}
                    </div>

                    {/* Item: Camera */}
                    <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Camera className="w-3.5 h-3.5 text-cyan-400/80" />
                            <span>Camera Device</span>
                        </div>
                        {stats.camera === 'scanning' ? (
                            <span className="text-[9px] text-cyan-400 animate-pulse">PROBING...</span>
                        ) : stats.camera === 'ok' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> DETECTED</span>
                        ) : (
                            <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> OFFLINE</span>
                        )}
                    </div>

                    {/* Item: Microphone */}
                    <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Mic className="w-3.5 h-3.5 text-cyan-400/80" />
                            <span>Microphone Device</span>
                        </div>
                        {stats.microphone === 'scanning' ? (
                            <span className="text-[9px] text-cyan-400 animate-pulse">PROBING...</span>
                        ) : stats.microphone === 'ok' ? (
                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> DETECTED</span>
                        ) : (
                            <span className="text-rose-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> OFFLINE</span>
                        )}
                    </div>
                </div>

                {/* Footer trigger */}
                <div className="p-2 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest pl-1">
                        {isScanning ? 'Syncing...' : 'Diagnostics Good'}
                    </span>
                    <button
                        onClick={runProbe}
                        disabled={isScanning}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-[9px] font-bold text-white rounded-lg transition-all"
                    >
                        <RefreshCw className={`w-2.5 h-2.5 ${isScanning ? 'animate-spin' : ''}`} />
                        Scan
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default HardwareDiagnostic;
