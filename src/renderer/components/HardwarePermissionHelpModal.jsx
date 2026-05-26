import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Monitor, Laptop, HelpCircle, X, ShieldCheck, RefreshCw } from 'lucide-react';
import PermissionService from '../../services/PermissionService';

const HardwarePermissionHelpModal = ({ isOpen, onClose, data }) => {
    const [activeTab, setActiveTab] = useState(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        if (ua.includes('mac')) return 'mac';
        if (ua.includes('linux')) return 'linux';
        return 'win';
    });

    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);

    const handleRetry = async () => {
        setIsScanning(true);
        setScanResult(null);
        try {
            const result = await PermissionService.request(data.type);
            if (result === 'granted') {
                setScanResult('success');
                setTimeout(() => {
                    onClose();
                }, 1000);
            } else {
                setScanResult('failed');
            }
        } catch (e) {
            console.error('Scan retry failed:', e);
            setScanResult('failed');
        } finally {
            setIsScanning(false);
        }
    };

    const handleOpenSettings = async () => {
        try {
            if (window.nizhal?.invoke) {
                await window.nizhal.invoke('open_system_permission_settings', { permissionType: data.type });
            }
        } catch (err) {
            console.error('Failed to open system settings natively:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 select-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-[550px] rounded-[24px] bg-[#0E152D]/95 border border-white/[0.08] shadow-[0_24px_50px_rgba(0,0,0,0.7),inset_0_0_20px_rgba(255,255,255,0.02)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/[0.06] flex items-start justify-between relative bg-gradient-to-r from-red-500/10 to-transparent">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-red-400">
                                <AlertTriangle className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-md font-extrabold text-white uppercase tracking-wider">
                                    Hardware Authorization Gated
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                                    Nizhal AI requires system access to your <span className="text-pink-400 font-bold capitalize">{data.type}</span>.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all outline-none"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                        {/* Error details */}
                        <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/15 font-mono text-[10px] text-red-300/90 leading-relaxed">
                            <span className="font-extrabold uppercase text-[8px] tracking-wider block text-red-400 mb-1">Diagnostics message</span>
                            {data.message}
                        </div>

                        {/* OS Selection tabs */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose Operating System</span>
                            <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                                {[
                                    { id: 'mac', label: 'macOS', icon: Laptop },
                                    { id: 'win', label: 'Windows', icon: Monitor },
                                    { id: 'linux', label: 'Linux', icon: HelpCircle }
                                ].map(tab => {
                                    const TabIcon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setScanResult(null);
                                            }}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                activeTab === tab.id 
                                                ? 'bg-indigo-600 text-white shadow-md' 
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <TabIcon className="w-3.5 h-3.5" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Instruction List */}
                        <div className="p-4 rounded-xl bg-black/35 border border-white/[0.04] space-y-3 min-h-[140px] flex flex-col justify-center">
                            {activeTab === 'mac' && (
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    <li className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold mt-0.5">1</span>
                                        <span>Open <strong>System Settings</strong> ⚙️ from the Apple menu.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold mt-0.5">2</span>
                                        <span>Navigate to <strong>Privacy & Security</strong> 🔒 in the sidebar.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold mt-0.5">3</span>
                                        <span>Click on <strong className="capitalize">{data.type}</strong> and check the toggle next to <strong>Nizhal AI</strong>.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold mt-0.5">4</span>
                                        <span className="text-[11px] text-slate-400 italic">Restart the application once permissions are toggled.</span>
                                    </li>
                                </ul>
                            )}

                            {activeTab === 'win' && (
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    <li className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold mt-0.5">1</span>
                                        <span>Open the Windows <strong>Settings</strong> panel ⚙️ (press <kbd className="bg-white/10 px-1 rounded text-[10px]">Win + I</kbd>).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold mt-0.5">2</span>
                                        <span>Go to <strong>Privacy & security</strong> 🛡️ in the sidebar.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold mt-0.5">3</span>
                                        <span>Scroll down to <strong>App permissions</strong> and select <strong className="capitalize">{data.type}</strong>.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[9px] font-bold mt-0.5">4</span>
                                        <span>Enable <strong>Camera/Mic access</strong> and ensure <strong>Let desktop apps access your camera/mic</strong> is turned on.</span>
                                    </li>
                                </ul>
                            )}

                            {activeTab === 'linux' && (
                                <div className="space-y-3.5 text-xs text-slate-300">
                                    <p className="leading-relaxed">
                                        Ensure your Linux user belongs to the standard audio and video hardware interface control groups:
                                    </p>
                                    <div className="p-3 bg-[#020716] border border-white/[0.06] rounded-lg font-mono text-[10px] text-cyan-400 flex items-center justify-between">
                                        <span>sudo usermod -aG video,audio $USER</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText('sudo usermod -aG video,audio $USER')}
                                            className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded text-[8px] transition-all"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">
                                        Apply group definitions immediately via <code>newgrp video && newgrp audio</code>, or perform a system logout/login.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleOpenSettings}
                                className="w-full mt-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-200 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                            >
                                ⚙️ Open {activeTab === 'linux' ? 'Wayland Control Center' : 'System Settings'}
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/[0.06] flex items-center justify-between bg-black/25">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold transition-all"
                        >
                            Dismiss
                        </button>
                        
                        <div className="flex items-center gap-2">
                            {scanResult === 'success' && (
                                <span className="text-xs text-green-400 font-bold flex items-center gap-1.5 animate-pulse">
                                    <ShieldCheck className="w-4 h-4" /> Scanner Verified
                                </span>
                            )}
                            {scanResult === 'failed' && (
                                <span className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                                    ✗ Authorization Locked
                                </span>
                            )}
                            <button
                                onClick={handleRetry}
                                disabled={isScanning}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-[0_4px_15px_rgba(236,72,153,0.2)] disabled:opacity-40"
                            >
                                {isScanning ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                Re-Scan Hardware
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default HardwarePermissionHelpModal;
