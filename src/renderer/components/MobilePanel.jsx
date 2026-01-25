import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone, Phone, PhoneOff, PhoneIncoming, PhoneMissed,
    Bell, BellOff, MessageSquare, Battery, Wifi, Signal,
    Volume2, VolumeX, Camera, Music, ChevronRight
} from 'lucide-react';

/**
 * MobilePanel - Android Hub for Notifications & Call Control
 * Shows phone status, notifications, and quick actions
 */
const MobilePanel = ({ adbConnected = false }) => {
    const [notifications, setNotifications] = useState([]);
    const [callState, setCallState] = useState(null); // null | 'incoming' | 'active' | 'ended'
    const [phoneInfo, setPhoneInfo] = useState({
        battery: 85,
        connected: adbConnected,
        signal: 4,
        wifi: true
    });
    const [isRinging, setIsRinging] = useState(false);

    // Simulate notifications (would come from ADB in real implementation)
    useEffect(() => {
        const demoNotifications = [
            { id: 1, app: 'WhatsApp', title: 'John Doe', message: 'Hey! Are you free?', time: '2m ago', icon: '💬' },
            { id: 2, app: 'Gmail', title: 'Meeting Reminder', message: 'Team sync in 30 minutes', time: '15m ago', icon: '📧' },
            { id: 3, app: 'Instagram', title: 'nizhal_ai started following you', message: '', time: '1h ago', icon: '📸' },
        ];
        setNotifications(demoNotifications);
    }, []);

    const handleAnswer = () => {
        setCallState('active');
        setIsRinging(false);
    };

    const handleReject = () => {
        setCallState('ended');
        setIsRinging(false);
        setTimeout(() => setCallState(null), 2000);
    };

    const handleHangup = () => {
        setCallState('ended');
        setTimeout(() => setCallState(null), 2000);
    };

    const simulateCall = () => {
        setCallState('incoming');
        setIsRinging(true);
    };

    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const QuickAction = ({ icon: Icon, label, onClick, active = false }) => (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
        >
            <Icon size={20} />
            <span className="text-[10px]">{label}</span>
        </motion.button>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${phoneInfo.connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <Smartphone size={20} className={phoneInfo.connected ? 'text-green-400' : 'text-red-400'} />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white">Android Hub</h3>
                            <p className="text-xs text-white/40">
                                {phoneInfo.connected ? 'Connected via ADB' : 'Not connected'}
                            </p>
                        </div>
                    </div>

                    {/* Phone Status */}
                    <div className="flex items-center gap-3 text-white/40">
                        <div className="flex items-center gap-1">
                            <Signal size={14} />
                            <span className="text-xs">{phoneInfo.signal}/5</span>
                        </div>
                        {phoneInfo.wifi && <Wifi size={14} className="text-cyan-400" />}
                        <div className="flex items-center gap-1">
                            <Battery size={14} />
                            <span className="text-xs">{phoneInfo.battery}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call UI */}
            <AnimatePresence>
                {callState && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 ${callState === 'incoming' ? 'bg-green-500/10' :
                                callState === 'active' ? 'bg-cyan-500/10' : 'bg-red-500/10'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-full ${callState === 'incoming' ? 'bg-green-500/20 animate-pulse' :
                                        callState === 'active' ? 'bg-cyan-500/20' : 'bg-red-500/20'
                                    }`}>
                                    {callState === 'incoming' ? <PhoneIncoming size={24} className="text-green-400" /> :
                                        callState === 'active' ? <Phone size={24} className="text-cyan-400" /> :
                                            <PhoneMissed size={24} className="text-red-400" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        {callState === 'incoming' ? 'Incoming Call' :
                                            callState === 'active' ? 'Call Active' : 'Call Ended'}
                                    </p>
                                    <p className="text-xs text-white/50">Unknown Caller</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {callState === 'incoming' && (
                                    <>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleReject}
                                            className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-full"
                                        >
                                            <PhoneOff size={20} className="text-red-400" />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleAnswer}
                                            className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-full"
                                        >
                                            <Phone size={20} className="text-green-400" />
                                        </motion.button>
                                    </>
                                )}
                                {callState === 'active' && (
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleHangup}
                                        className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-full"
                                    >
                                        <PhoneOff size={20} className="text-red-400" />
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Actions */}
            <div className="p-4 border-b border-white/5">
                <p className="text-xs text-white/40 mb-3">Quick Actions</p>
                <div className="grid grid-cols-5 gap-2">
                    <QuickAction icon={Phone} label="Call" onClick={simulateCall} />
                    <QuickAction icon={MessageSquare} label="SMS" />
                    <QuickAction icon={Camera} label="Camera" />
                    <QuickAction icon={Music} label="Media" />
                    <QuickAction icon={Bell} label="DND" />
                </div>
            </div>

            {/* Notifications */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-white/40">Notifications</p>
                    <span className="text-xs text-cyan-400">{notifications.length} new</span>
                </div>

                <div className="space-y-2">
                    <AnimatePresence>
                        {notifications.map(notif => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">{notif.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-white/40">{notif.app}</p>
                                            <p className="text-[10px] text-white/30">{notif.time}</p>
                                        </div>
                                        <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                                        {notif.message && (
                                            <p className="text-xs text-white/50 truncate">{notif.message}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => dismissNotification(notif.id)}
                                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ChevronRight size={14} className="text-white/30" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {notifications.length === 0 && (
                        <div className="py-8 text-center text-white/30">
                            <BellOff size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobilePanel;
