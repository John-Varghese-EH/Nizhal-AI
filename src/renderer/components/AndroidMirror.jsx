import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdbManager } from '../../assistant/android/AdbManager';
import AndroidControlPanel from './AndroidControlPanel';

const adbManager = new AdbManager();

const AndroidMirror = ({ onClose }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        startMirroring();
        return () => {
            adbManager.stopMirror();
        };
    }, []);

    const startMirroring = async () => {
        setIsLoading(true);
        const connected = await adbManager.connect(); // Auto-connect
        setIsConnected(connected);

        if (connected) {
            // Fetch device info
            const info = await window.nizhal?.adb?.info();
            if (info?.success) setDeviceInfo(info);

            // Start stream
            adbManager.startMirror((url) => {
                setImageSrc(url);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    };

    const handleControl = async (action) => {
        switch (action) {
            case 'home': await window.nizhal?.adb?.home(); break;
            case 'back': await window.nizhal?.adb?.back(); break;
            case 'recents': await window.nizhal?.adb?.key(187); break; // APP_SWITCH
            case 'power': await window.nizhal?.adb?.key(26); break;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
        >
            <div className="flex gap-6 h-[750px]">

                {/* PHONE MIRROR */}
                <div className="relative w-[360px] h-full bg-black rounded-[3rem] border-4 border-stone-800 shadow-2xl overflow-hidden glass-panel shrink-0">
                    {/* Status Bar Mock */}
                    <div className="absolute top-0 w-full h-8 bg-black/20 z-10 flex justify-between px-6 items-center">
                        <span className="text-[10px] font-mono text-white/50">
                            {deviceInfo?.model || 'Android Device'}
                        </span>
                        <div className="flex gap-1">
                            <div className="w-10 h-1 bg-white/20 rounded-full"></div>
                        </div>
                    </div>

                    {/* Screen Content */}
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative group">
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                alt="Android Screen"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-white/30">
                                {isLoading ? (
                                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-4xl">📱</span>
                                        <span>Device Disconnected</span>
                                        <button
                                            onClick={startMirroring}
                                            className="text-xs px-3 py-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                        >
                                            Reconnect
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Overlay Controls (Hover) */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
                            {/* Controls moved to panel, but overlay kept for visual feedback if needed */}
                        </div>
                    </div>

                    {/* Bottom Chin */}
                    <div className="absolute bottom-4 w-full flex justify-center pb-2">
                        <div className="w-32 h-1 bg-white/20 rounded-full"></div>
                    </div>
                </div>

                {/* CONTROL PANEL */}
                <div className="w-[400px] h-full flex flex-col pt-4 pb-4">
                    <AndroidControlPanel />

                    <button
                        onClick={onClose}
                        className="mt-4 w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        Close Controller
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const ControlButton = ({ icon, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-xl hover:bg-primary hover:text-white transition-colors border border-white/10"
    >
        {icon}
    </motion.button>
);

export default AndroidMirror;
