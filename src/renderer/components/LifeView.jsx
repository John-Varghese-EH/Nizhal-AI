import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { calendarManager } from '../../assistant/life-manager/Calendar';
import { weatherService } from '../../assistant/life-manager/Weather';

const LifeView = () => {
    const [lifeData, setLifeData] = useState({ weather: null, events: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLifeData();
    }, []);

    const loadLifeData = async () => {
        try {
            const weather = await weatherService.getWeather();
            const events = await calendarManager.getUpcomingEvents();
            setLifeData({ weather, events });
        } catch (error) {
            console.error('Failed to load life data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-slate-500">Loading your personal dashboard...</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full p-6 overflow-y-auto"
        >
            <h2 className="text-2xl font-light mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">
                Personal Dashboard
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weather Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-xl group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                {lifeData.weather?.temp ?? '--'}°C
                            </h3>
                            <p className="text-cyan-400 font-medium capitalize mt-1">
                                {lifeData.weather?.description ?? 'Clear Sky'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-medium text-white">{lifeData.weather?.city ?? 'Local'}</p>
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                Updated Now
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Humidity</span>
                            <span className="text-lg text-white font-light">{lifeData.weather?.humidity ?? 0}%</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 uppercase tracking-wider">Wind</span>
                            <span className="text-lg text-white font-light">{lifeData.weather?.wind ?? 0} km/h</span>
                        </div>
                    </div>
                </div>

                {/* Calendar Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-purple-500/30 transition-all duration-300 shadow-xl">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                        <span className="text-purple-400">📅</span> Upcoming Events
                    </h3>
                    <div className="space-y-3">
                        {lifeData.events.length > 0 ? (
                            lifeData.events.map((event, i) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group"
                                >
                                    <div className={`w-1.5 h-10 rounded-full shadow-[0_0_10px_currentColor] ${event.type === 'work' ? 'bg-cyan-400 text-cyan-400' :
                                            event.type === 'personal' ? 'bg-purple-400 text-purple-400' : 'bg-green-400 text-green-400'
                                        }`} />
                                    <div className="flex-1">
                                        <p className="font-medium text-white group-hover:text-cyan-200 transition-colors">{event.title}</p>
                                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                            {new Date(event.time).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                                No upcoming events today.
                            </div>
                        )}
                    </div>
                </div>

                {/* Coming Soon Widgets */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 opacity-50">
                    <h3 className="text-lg font-medium mb-2 text-slate-400">Notes & Tasks</h3>
                    <p className="text-sm text-slate-600">Coming soon in Phase 4...</p>
                </div>
            </div>
        </motion.div>
    );
};

export default LifeView;
