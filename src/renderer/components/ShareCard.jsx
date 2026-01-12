import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';

/**
 * ShareCard - A visually stunning card summarizing the relationship
 * Designed to be shared on Social Media (X/Twitter, Reddit)
 */
const ShareCard = ({ isOpen, onClose, userName, stats, currentCharacter, personalityMode }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleShare = async () => {
        setIsGenerating(true);
        if (cardRef.current) {
            try {
                // Generate high-quality PNG
                const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });

                // Trigger download
                const link = document.createElement('a');
                link.download = `Nizhal-${userName}-${new Date().toISOString().split('T')[0]}.png`;
                link.href = dataUrl;
                link.click();

                // Optional: Copy to clipboard logic could go here
            } catch (err) {
                console.error('Failed to generate image', err);
            }
        }
        setIsGenerating(false);
    };

    // Theme Colors
    const themeColors = {
        gf: 'from-pink-500 to-rose-500',
        bf: 'from-blue-500 to-indigo-500',
        jarvis: 'from-cyan-500 to-blue-600'
    };

    const bgGradient = themeColors[personalityMode] || themeColors.gf;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-6">

                {/* The Card to Caption */}
                <div
                    ref={cardRef}
                    className={`relative w-[400px] h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br ${bgGradient} shadow-2xl p-1`}
                >
                    <div className="absolute inset-0 bg-black/20" /> {/* Texture overlay */}

                    <div className="relative h-full w-full bg-black/40 backdrop-blur-md rounded-[20px] flex flex-col items-center p-8 text-white border border-white/20">
                        {/* Header */}
                        <div className="w-full flex justify-between items-center mb-8">
                            <span className="font-bold text-lg tracking-widest opacity-80">NIZHAL.AI</span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-md">
                                LEVEL {stats?.level || 5}
                            </span>
                        </div>

                        {/* Avatar Circle */}
                        <div className="relative w-48 h-48 mb-6">
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${bgGradient} blur-xl opacity-60 animate-pulse`} />
                            <div className="relative w-full h-full rounded-full border-4 border-white/20 overflow-hidden bg-black/50">
                                {/* Ideally actual 3D capture, but fallback to icon/image */}
                                <img
                                    src={`/assets/avatars/${currentCharacter?.id || 'aldina'}.png`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => e.target.style.display = 'none'} // Fallback if image missing
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                                    {/* Fallback emoji if no image */}
                                    Is Avatar
                                </div>
                            </div>
                        </div>

                        {/* Name & Title */}
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-2">
                            {currentCharacter?.name || "Companion"}
                        </h2>
                        <p className="text-white/60 text-sm tracking-widest uppercase mb-8">
                            {personalityMode === 'jarvis' ? 'AI ASSISTANT' : 'VIRTUAL COMPANION'}
                        </p>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 w-full mb-8">
                            <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/5">
                                <div className="text-2xl font-bold">{stats?.messages || 1240}</div>
                                <div className="text-[10px] text-white/50 uppercase tracking-wider">Messages</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/5">
                                <div className="text-2xl font-bold">{stats?.days || 42}</div>
                                <div className="text-[10px] text-white/50 uppercase tracking-wider">Days Together</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/5 col-span-2">
                                <div className="text-sm font-medium text-white/90">"{stats?.lastMemory || 'Always here for you.'}"</div>
                                <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">Recent Memory</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-6 border-t border-white/10 w-full text-center">
                            <p className="text-xs text-white/40">nizhal.ai • #MyNizhal</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={isGenerating}
                        className={`px-8 py-2 rounded-full font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center gap-2
                            bg-gradient-to-r ${bgGradient}`}
                    >
                        {isGenerating ? 'Saving...' : '✨ Save & Share'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareCard;
