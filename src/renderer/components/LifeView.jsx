import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lifeService } from '../../services/LifeService';
import { weatherService } from '../../assistant/life-manager/Weather';
import { calendarManager } from '../../assistant/life-manager/Calendar';
import { familyService } from '../../assistant/family/FamilyService';
import { fitnessService } from '../../services/FitnessService';
import { visionManager } from '../../services/VisionEmotionManager';
import SystemInfoPanel from './SystemInfoPanel';
import TaskBoard from './TaskBoard';
import MobilePanel from './MobilePanel';
import MoodTracker from './MoodTracker';
import VoiceNotes from './VoiceNotes';
import ScreenCaptures from './ScreenCaptures';

const LifeView = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    // Data State
    const [lifeData, setLifeData] = useState({
        weather: null,
        events: [],
        memories: [],
        artifacts: [],
        routine: null,
        fitness: null
    });
    const [familyMembers, setFamilyMembers] = useState([]);
    const [userProfileState, setUserProfileState] = useState({ name: 'User', vibe: 50, relationship: 'friend' });
    const [tempUnit, setTempUnit] = useState('C');

    useEffect(() => {
        loadAllData();
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        const profile = await window.nizhal?.state?.get?.('user.profile');
        if (profile) setUserProfileState(profile);
    };

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Fetch preferences for weather location
            const prefs = await window.nizhal?.memory?.getUserPreferences?.() || {};
            setTempUnit(prefs.tempUnit || 'C');
            const loc = prefs.weatherLocation;

            // Load everything in parallel
            const [weather, events, memories, artifacts, routine, fitness, members] = await Promise.all([
                loc ? weatherService.getWeather(loc.lat, loc.lon, loc.name) : weatherService.getWeather(),
                calendarManager.getUpcomingEvents(),
                lifeService.getMemories(),
                lifeService.getArtifacts(),
                lifeService.getRoutine(),
                fitnessService.getDailyStats(),
                familyService.getMembers()
            ]);

            setLifeData({ weather, events, memories, artifacts, routine, fitness });
            setFamilyMembers(members || []);
        } catch (error) {
            console.error('Failed to load life data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVisionToggle = async (enabled) => {
        if (enabled) {
            await visionManager.startMonitoring(async (emotion) => {
                console.log('Vision Emotion:', emotion);
                if (window.nizhal?.state?.set) {
                    await window.nizhal.state.set('ai.emotion', emotion);
                }
            });
        } else {
            visionManager.stopMonitoring();
        }
    };

    const handleProfileChange = async (newProfile) => {
        setUserProfileState(newProfile);
        await window.nizhal?.state?.set?.('user.profile', newProfile);
    };

    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');

    const confirmAddMember = async () => {
        if (newMemberName.trim()) {
            await familyService.addMember(newMemberName.trim(), 'family');
            const members = await familyService.getMembers();
            setFamilyMembers([...members]);
            setIsAddingMember(false);
            setNewMemberName('');
        }
    };

    const handleSwitchMember = async (id) => {
        await familyService.switchMember(id);
        const members = await familyService.getMembers();
        setFamilyMembers([...members]);
        alert(`Switched to ${id}`);
    };

    /* --- Sub-Components --- */

    const TabButton = ({ id, label, icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
        >
            <span>{icon}</span>
            <span className="font-medium">{label}</span>
        </button>
    );

    if (loading && !lifeData.weather) {
        return <div className="p-10 text-center text-white/30 animate-pulse">Syncing Life Interface...</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col overflow-hidden"
        >
            {/* Header / Tabs */}
            <div className="p-6 pb-2">
                <h2 className="text-2xl font-light mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">
                    Life Manager
                </h2>
                <div className="flex gap-2 border-b border-white/5 pb-1">
                    <TabButton id="dashboard" label="Dashboard" icon="📊" />
                    <TabButton id="tasks" label="Tasks" icon="📋" />
                    <TabButton id="identity" label="Identity" icon="🆔" />
                    <TabButton id="family" label="Family" icon="👨‍👩‍👧‍👦" />
                    <TabButton id="mobile" label="Mobile" icon="📱" />
                    <TabButton id="system" label="System" icon="🖥️" />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
                <AnimatePresence mode="wait">

                    {/* --- DASHBOARD TAB --- */}
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            {/* Weather Card */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-xl">
                                <div className="flex justify-between items-start mb-6">
                                    <div>

                                        <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                            {lifeData.weather?.temp ? (tempUnit === 'F' ? Math.round(lifeData.weather.temp * 9 / 5 + 32) : lifeData.weather.temp) : '--'}°{tempUnit}
                                        </h3>
                                        <p className="text-cyan-400 font-medium capitalize mt-1">
                                            {lifeData.weather?.description ?? 'Clear Sky'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-medium text-white">{lifeData.weather?.city ?? 'Local'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-slate-500 uppercase">Humidity</span>
                                        <span className="text-lg text-white font-light">{lifeData.weather?.humidity ?? 0}%</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-slate-500 uppercase">Wind</span>
                                        <span className="text-lg text-white font-light">{lifeData.weather?.wind ?? 0} km/h</span>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Card */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-xl">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                                    <span className="text-purple-400">📅</span> Upcoming Events
                                </h3>
                                <div className="space-y-3">
                                    {lifeData.events.length > 0 ? (
                                        lifeData.events.map((event, i) => (
                                            <div key={event.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className={`w-1.5 h-10 rounded-full ${event.type === 'work' ? 'bg-cyan-400' :
                                                    event.type === 'personal' ? 'bg-purple-400' : 'bg-green-400'
                                                    }`} />
                                                <div className="flex-1">
                                                    <p className="font-medium text-white">{event.title}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                                        {new Date(event.time).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                                            No upcoming events today.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Routine Overview */}
                            {lifeData.routine && (
                                <div className="col-span-1 lg:col-span-2 p-6 rounded-3xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-medium mb-4 text-white">Daily Routine</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {Object.entries(lifeData.routine).map(([key, value]) => (
                                            <div key={key} className="p-3 rounded-xl bg-black/20 text-center min-w-[100px]">
                                                <div className="text-xs text-white/40 uppercase mb-1">{key}</div>
                                                <div className="text-white font-mono">{value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Memory Section */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-white/0 border border-purple-500/20">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                                    <span className="text-purple-400">🧠</span> Long-term Memory
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {lifeData.memories?.length > 0 ? (
                                        lifeData.memories.map(memory => (
                                            <div key={memory.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-sm text-white/80">{memory.text}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${memory.type === 'event' ? 'bg-cyan-500/20 text-cyan-400' :
                                                        memory.type === 'preference' ? 'bg-purple-500/20 text-purple-400' :
                                                            'bg-green-500/20 text-green-400'
                                                        }`}>{memory.type}</span>
                                                    <span className="text-[10px] text-white/30">{memory.date}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-slate-500">No memories yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Artifacts Section */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-white/0 border border-amber-500/20">
                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                                    <span className="text-amber-400">📎</span> Shared Artifacts
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {lifeData.artifacts?.length > 0 ? (
                                        lifeData.artifacts.map(artifact => (
                                            <div key={artifact.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                                <span className="text-xl">
                                                    {artifact.type === 'file' ? '📄' :
                                                        artifact.type === 'image' ? '🖼️' :
                                                            artifact.type === 'link' ? '🔗' : '📎'}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{artifact.name}</p>
                                                    <p className="text-[10px] text-white/30">{artifact.date}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-slate-500">No shared files</div>
                                    )}
                                </div>
                            </div>

                            {/* Mood Tracker */}
                            <div className="col-span-1 lg:col-span-2">
                                <MoodTracker />
                            </div>

                            {/* Voice Notes */}
                            <VoiceNotes />

                            {/* Screen Captures */}
                            <ScreenCaptures />
                        </motion.div>
                    )}

                    {/* --- IDENTITY TAB --- */}
                    {activeTab === 'identity' && (
                        <motion.div
                            key="identity"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="max-w-3xl space-y-6"
                        >
                            {/* Profile Section */}
                            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                                <h3 className="text-xl font-light text-white mb-6">User Profile</h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-sm text-cyan-300 block mb-2">How should I call you?</label>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={userProfileState?.name || ''}
                                                onChange={(e) => handleProfileChange({ ...userProfileState, name: e.target.value })}
                                                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 outline-none transition-colors"
                                                placeholder="Your Name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-cyan-300 block mb-2">Our Relationship</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {[
                                                { id: 'friend', label: 'Best Friends', icon: '✨' },
                                                { id: 'partner', label: 'Partners', icon: '💕' },
                                                { id: 'assistant', label: 'Co-Workers', icon: '🚀' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleProfileChange({ ...userProfileState, relationship: opt.id })}
                                                    className={`p-4 rounded-xl text-left transition-all border ${userProfileState.relationship === opt.id
                                                        ? 'bg-cyan-500/20 border-cyan-500 text-white'
                                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <span className="text-2xl block mb-2">{opt.icon}</span>
                                                    <span className="font-medium">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm text-cyan-300">Vibe Check</span>
                                            <span className="text-xs text-white/50">{userProfileState.vibe || 50}/100</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100" step="1"
                                            value={userProfileState.vibe || 50}
                                            onChange={(e) => handleProfileChange({ ...userProfileState, vibe: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        />
                                        <div className="flex justify-between text-xs text-white/30 mt-1">
                                            <span>Peaceful</span>
                                            <span>Chaotic</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vision Hardware Section */}
                            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-light text-white">Visual Perception</h3>
                                        <p className="text-sm text-white/50">Allow AI to see emotions via camera</p>
                                    </div>
                                    <button
                                        onClick={() => handleVisionToggle(true)} // Toggle logic can be improved to support off
                                        className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                                    >
                                        Activate Vision
                                    </button>
                                </div>
                                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                    <p className="text-xs text-white/40">
                                        🔒 <strong className="text-white/60">Privacy Note:</strong> Images are processed locally and never uploaded. The AI only detects basic emotions (happy, sad, neutral) to adjust its responses.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* --- FAMILY TAB --- */}
                    {activeTab === 'family' && (
                        <motion.div
                            key="family"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="max-w-3xl space-y-6"
                        >
                            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                                <h3 className="text-xl font-light text-white mb-6">Household Members</h3>

                                <div className="space-y-3">
                                    {familyMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-lg font-medium text-white">
                                                        {member.name}
                                                        {member.id === 'admin' && <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">Admin</span>}
                                                    </div>
                                                    <div className="text-xs text-white/40 capitalize">{member.role} • {member.relationship}</div>
                                                </div>
                                            </div>
                                            {member.id !== 'admin' && (
                                                <button
                                                    onClick={() => handleSwitchMember(member.id)}
                                                    className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-xl text-white/70 transition-colors"
                                                >
                                                    Switch Profile
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {isAddingMember ? (
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/20 flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newMemberName}
                                                onChange={(e) => setNewMemberName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && confirmAddMember()}
                                                placeholder="Enter name..."
                                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30"
                                            />
                                            <button
                                                onClick={confirmAddMember}
                                                className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setIsAddingMember(false)}
                                                className="px-3 py-1 bg-white/5 text-white/50 rounded-lg hover:bg-white/10 transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsAddingMember(true);
                                                setNewMemberName('');
                                            }}
                                            className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/30 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2 mt-4"
                                        >
                                            <span className="text-xl">+</span> Add Family Member
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
                                <h4 className="text-yellow-200 font-medium mb-2">Family Mode (Beta)</h4>
                                <p className="text-sm text-yellow-200/60">
                                    Each family member gets their own memory graph and preference profile.
                                    Switching profiles will change how the AI remembers and interacts with you.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* --- SYSTEM TAB --- */}
                    {activeTab === 'system' && (
                        <motion.div
                            key="system"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="h-full"
                        >
                            <div className="h-full bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                                <SystemInfoPanel />
                            </div>
                        </motion.div>
                    )}

                    {/* --- TASKS TAB --- */}
                    {activeTab === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="h-full"
                        >
                            <div className="h-full bg-white/5 rounded-3xl border border-white/10 p-6 overflow-hidden">
                                <TaskBoard />
                            </div>
                        </motion.div>
                    )}

                    {/* --- MOBILE TAB --- */}
                    {activeTab === 'mobile' && (
                        <motion.div
                            key="mobile"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="h-full"
                        >
                            <div className="h-full bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                                <MobilePanel />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default LifeView;
