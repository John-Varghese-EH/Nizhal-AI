import React, { useState } from 'react';
import { motion } from 'framer-motion';

const JournalView = ({ onBack }) => {
    const [entry, setEntry] = useState('');
    const [mood, setMood] = useState('neutral');

    const handleSave = () => {
        // Save logic would go here
        console.log('Saving journal:', { entry, mood });
        onBack();
    };

    return (
        <div className="flex flex-col h-full p-6 text-white overflow-y-auto">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="mr-4 text-white/60 hover:text-white">
                    ← Back
                </button>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    Daily Journal
                </h2>
            </div>

            <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">How are you feeling?</label>
                <div className="flex gap-4">
                    {['😊', '😐', '😔', '😤', '🤔'].map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => setMood(emoji)}
                            className={`text-2xl p-2 rounded-full transition-all ${mood === emoji ? 'bg-white/20 scale-110' : 'hover:bg-white/10'
                                }`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            <textarea
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="Write your thoughts... or use voice input to narrate your day."
                className="flex-1 bg-black/20 rounded-xl p-4 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 mb-6"
            />

            <button
                onClick={handleSave}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:opacity-90 transition-opacity"
            >
                Save Entry
            </button>
        </div>
    );
};

export default JournalView;
