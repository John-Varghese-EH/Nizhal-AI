import React from 'react';
import { motion } from 'framer-motion';

const TitleBar = ({ personaName, clickThrough, onClickThroughToggle }) => {
    const handleMinimize = () => window.nizhal?.window.minimize();
    const handleMaximize = () => window.nizhal?.window.maximize();
    const handleClose = () => window.nizhal?.window.close();

    return (
        <div className="h-10 flex items-center justify-between px-3 drag-region bg-black/20 border-b border-white/5">
            <div className="flex items-center gap-2 no-drag">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
                <span className="text-sm font-medium text-white/90">{personaName}</span>
            </div>

            <div className="flex items-center gap-1 no-drag">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClickThroughToggle}
                    className={`p-1.5 rounded-md transition-colors ${clickThrough
                            ? 'bg-indigo-500/30 text-indigo-300'
                            : 'hover:bg-white/10 text-white/60'
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
                    className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMaximize}
                    className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="p-1.5 rounded-md hover:bg-red-500/20 text-white/60 hover:text-red-400"
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
