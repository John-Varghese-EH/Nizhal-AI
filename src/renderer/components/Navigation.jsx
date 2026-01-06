import React from 'react';
import { motion } from 'framer-motion';

const Navigation = ({ currentView, onViewChange }) => {
    const navItems = [
        { id: 'chat', icon: 'chat', label: 'Chat' },
        { id: 'journal', icon: 'journal', label: 'Journal' },
        { id: 'marketplace', icon: 'shop', label: 'Store' },
        { id: 'settings', icon: 'settings', label: 'Settings' }
    ];

    const icons = {
        chat: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
        ),
        journal: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
        ),
        shop: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
        ),
        settings: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
        )
    };

    return (
        <div className="h-14 flex items-center justify-around px-4 bg-black/20 border-t border-white/5">
            {navItems.map((item) => (
                <motion.button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === item.id
                        ? 'text-indigo-400'
                        : 'text-white/50 hover:text-white/80'
                        }`}
                >
                    <div className="relative">
                        {currentView === item.id && (
                            <motion.div
                                layoutId="nav-indicator"
                                className="absolute inset-0 bg-indigo-500/20 rounded-lg"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                        <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {icons[item.icon]}
                            {item.icon === 'settings' && (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            )}
                        </svg>
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                </motion.button>
            ))}
        </div>
    );
};

export default Navigation;
