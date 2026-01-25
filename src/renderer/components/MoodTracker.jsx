import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { moodTrackerService } from '../../services/MoodTrackerService';
import { unifiedEmotionService } from '../../services/UnifiedEmotionService';

/**
 * MoodTracker - Daily mood logging with visualization
 * Integrated with UnifiedEmotionService for VRM avatar sync
 */
const MoodTracker = () => {
    const [moods, setMoods] = useState([]);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [selectedMood, setSelectedMood] = useState(null);
    const [currentAvatarEmotion, setCurrentAvatarEmotion] = useState('neutral');

    const moodOptions = [
        { id: 'happy', emoji: '😊', label: 'Happy', color: '#22c55e' },
        { id: 'excited', emoji: '🤩', label: 'Excited', color: '#f59e0b' },
        { id: 'calm', emoji: '😌', label: 'Calm', color: '#06b6d4' },
        { id: 'neutral', emoji: '😐', label: 'Neutral', color: '#6b7280' },
        { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#f97316' },
        { id: 'sad', emoji: '😢', label: 'Sad', color: '#3b82f6' }
    ];

    useEffect(() => {
        loadData();

        // Subscribe to emotion changes from other sources (QuickMenu, camera)
        const unsubscribe = unifiedEmotionService.subscribe((emotion, source) => {
            setCurrentAvatarEmotion(emotion);
            if (source !== 'moodtracker') {
                loadData(); // Refresh if changed from elsewhere
            }
        });

        // Set initial emotion
        setCurrentAvatarEmotion(unifiedEmotionService.getEmotion());

        return () => unsubscribe();
    }, []);

    const loadData = async () => {
        await moodTrackerService.initialize();
        setMoods(moodTrackerService.getTodayMoods());
        setStats(moodTrackerService.getStats(7));
        setChartData(moodTrackerService.getChartData(7));
    };

    const handleLogMood = async (mood) => {
        // Use unified service to sync emotion to VRM avatar and log to MoodTracker
        await unifiedEmotionService.setEmotion(mood, 'moodtracker');
        setSelectedMood(mood);
        loadData();

        // Reset selection after animation
        setTimeout(() => setSelectedMood(null), 1500);
    };

    const getMoodColor = (moodId) => {
        return moodOptions.find(m => m.id === moodId)?.color || '#6b7280';
    };

    return (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-white/0 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2 text-white">
                    <span className="text-indigo-400">💭</span> Mood Tracker
                </h3>
                {/* Current Avatar Emotion */}
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
                    <span className="text-xs text-white/40">Avatar:</span>
                    <span className="text-lg">{moodOptions.find(m => m.id === currentAvatarEmotion)?.emoji || '😐'}</span>
                    <span className="text-xs text-white/60 capitalize">{currentAvatarEmotion}</span>
                </div>
            </div>

            {/* Quick Mood Select */}
            <div className="mb-6">
                <p className="text-xs text-white/40 mb-3">How are you feeling?</p>
                <div className="flex flex-wrap gap-2">
                    {moodOptions.map(mood => (
                        <motion.button
                            key={mood.id}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleLogMood(mood.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${selectedMood === mood.id
                                ? 'bg-indigo-500/40 border-indigo-500'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                } border`}
                        >
                            <span className="text-xl">{mood.emoji}</span>
                            <span className="text-xs text-white/70">{mood.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Weekly Chart */}
            {chartData.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-white/40 mb-3">Last 7 Days</p>
                    <div className="flex items-end justify-between gap-2 h-24">
                        {chartData.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: day.value ? `${(day.value / 5) * 100}%` : '10%' }}
                                    className={`w-full rounded-t-lg ${day.value ? 'bg-indigo-500/60' : 'bg-white/10'
                                        }`}
                                    style={{ minHeight: '8px' }}
                                />
                                <span className="text-[10px] text-white/40 mt-1">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                        <span className="text-xs text-white/40">Dominant mood:</span>
                        <span className="text-sm text-white ml-2">
                            {moodOptions.find(m => m.id === stats.dominant)?.emoji} {stats.dominant}
                        </span>
                    </div>
                    <div className="text-xs text-white/40">
                        {stats.total} entries this week
                    </div>
                </div>
            )}

            {/* Today's Moods */}
            {moods.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-white/40 mb-2">Today's moods:</p>
                    <div className="flex gap-1">
                        {moods.slice(0, 8).map((m, i) => (
                            <span key={i} className="text-lg" title={new Date(m.timestamp).toLocaleTimeString()}>
                                {moodOptions.find(opt => opt.id === m.mood)?.emoji || '😐'}
                            </span>
                        ))}
                        {moods.length > 8 && (
                            <span className="text-xs text-white/30 self-center">+{moods.length - 8}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoodTracker;
