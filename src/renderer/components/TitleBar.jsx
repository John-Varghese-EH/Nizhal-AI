import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const TitleBar = ({ personaName, clickThrough, onClickThroughToggle, onMaximize, privacyMode }) => {
    const handleMinimize = () => window.nizhal?.window.minimize();
    const handleMaximizeClick = () => {
        if (onMaximize) {
            onMaximize();
        } else {
            window.nizhal?.window.maximize();
        }
    };
    const handleClose = () => window.nizhal?.window.close();

    return (
        <div className="h-12 flex items-center justify-between px-4 drag-region bg-slate-900/50 border-b border-white/5">
            <div className="flex items-center gap-3 no-drag">
                <div className={`w-2 h-2 rounded-full ${privacyMode ? 'bg-green-400' : 'bg-cyan-400'} animate-pulse`} />
                <span className="text-sm font-light tracking-wider text-white">{personaName}</span>

                {/* Privacy Mode Indicator */}
                {privacyMode && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-full">
                        <Shield size={10} className="text-green-400" />
                        <span className="text-[9px] text-green-400 font-mono">LOCAL</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1 no-drag">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClickThroughToggle}
                    className={`p-1.5 rounded-lg transition-colors ${clickThrough
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'hover:bg-white/10 text-slate-400'
                        }`}
                    title={clickThrough ? 'Disable Click-Through' : 'Enable Click-Through'}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={clickThrough
                                ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"
                            }
                        />
                    </svg>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMinimize}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Minimize"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMaximizeClick}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Maximize to full dashboard"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                    title="Close"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>
            </div>
        </div>
    );
};

export default TitleBar;

