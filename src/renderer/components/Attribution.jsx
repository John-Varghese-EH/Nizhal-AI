/**
 * Attribution Component
 * 
 * Creator branding for Nizhal AI
 * Displays in Settings footer and all window bottom bars
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Main Attribution Component
 * @param {object} props
 * @param {'full' | 'compact' | 'minimal'} props.variant - Display variant
 * @param {string} props.className - Additional CSS classes
 */
const Attribution = ({ variant = 'full', className = '' }) => {
    const handleOpenLink = (url) => {
        window.nizhal?.app?.openExternal?.(url);
    };

    // Minimal variant - just the heart line
    if (variant === 'minimal') {
        return (
            <div className={`text-center text-xs text-white/30 py-1 ${className}`}>
                Made with ❤️ by J0X
            </div>
        );
    }

    // Compact variant - single line with links
    if (variant === 'compact') {
        return (
            <div className={`flex items-center justify-center gap-3 text-xs text-white/40 py-2 ${className}`}>
                <span>Made with ❤️ by J0X</span>
                <span className="text-white/20">|</span>
                <button
                    onClick={() => handleOpenLink('https://github.com/John-Varghese-EH')}
                    className="hover:text-white/60 transition-colors flex items-center gap-1"
                >
                    <GithubIcon className="w-3 h-3" />
                    <span>GitHub</span>
                </button>
                <button
                    onClick={() => handleOpenLink('https://instagram.com/cyber__trinity')}
                    className="hover:text-white/60 transition-colors flex items-center gap-1"
                >
                    <InstagramIcon className="w-3 h-3" />
                    <span>Instagram</span>
                </button>
            </div>
        );
    }

    // Full variant - styled card
    return (
        <motion.div
            className={`attribution bg-white/5 rounded-xl p-4 border border-white/10 ${className}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="text-center space-y-3">
                {/* Main Attribution */}
                <div className="flex items-center justify-center gap-2 text-white/70">
                    <HeartIcon className="w-4 h-4 text-pink-400" />
                    <span className="text-sm">Made with love by</span>
                    <span className="font-semibold text-white">J0X</span>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-4">
                    <SocialButton
                        icon={<GithubIcon className="w-4 h-4" />}
                        label="John-Varghese-EH"
                        onClick={() => handleOpenLink('https://github.com/John-Varghese-EH')}
                        color="hover:bg-gray-500/20 hover:text-white"
                    />
                    <SocialButton
                        icon={<InstagramIcon className="w-4 h-4" />}
                        label="@cyber__trinity"
                        onClick={() => handleOpenLink('https://instagram.com/cyber__trinity')}
                        color="hover:bg-pink-500/20 hover:text-pink-400"
                    />
                </div>

                {/* Version */}
                <VersionDisplay />
            </div>
        </motion.div>
    );
};

/**
 * Social Button Component
 */
const SocialButton = ({ icon, label, onClick, color }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 transition-all ${color}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

/**
 * Version Display Component
 */
const VersionDisplay = () => {
    const [version, setVersion] = React.useState('');

    React.useEffect(() => {
        window.nizhal?.app?.getVersion?.().then(v => setVersion(v || '1.0.0'));
    }, []);

    return (
        <div className="text-xs text-white/30">
            Nizhal AI v{version}
        </div>
    );
};

/**
 * Heart Icon
 */
const HeartIcon = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

/**
 * Github Icon
 */
const GithubIcon = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

/**
 * Instagram Icon
 */
const InstagramIcon = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
);

export default Attribution;
