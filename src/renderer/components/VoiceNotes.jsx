import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, Trash2, Clock } from 'lucide-react';
import { voiceNotesService } from '../../services/VoiceNotesService';

/**
 * VoiceNotes - Record and manage voice notes
 */
const VoiceNotes = () => {
    const [notes, setNotes] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingId, setPlayingId] = useState(null);
    const [currentAudio, setCurrentAudio] = useState(null);

    useEffect(() => {
        loadNotes();
    }, []);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const loadNotes = async () => {
        await voiceNotesService.initialize();
        setNotes(voiceNotesService.getNotes());
    };

    const handleStartRecording = async () => {
        try {
            await voiceNotesService.startRecording();
            setIsRecording(true);
            setRecordingTime(0);
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Microphone access required');
        }
    };

    const handleStopRecording = async () => {
        try {
            await voiceNotesService.stopRecording();
            setIsRecording(false);
            setRecordingTime(0);
            loadNotes();
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    };

    const handlePlay = (note) => {
        if (playingId === note.id) {
            currentAudio?.pause();
            setPlayingId(null);
            setCurrentAudio(null);
            return;
        }

        if (currentAudio) {
            currentAudio.pause();
        }

        const audio = voiceNotesService.playNote(note.id);
        if (audio) {
            audio.onended = () => {
                setPlayingId(null);
                setCurrentAudio(null);
            };
            setPlayingId(note.id);
            setCurrentAudio(audio);
        }
    };

    const handleDelete = async (id) => {
        await voiceNotesService.deleteNote(id);
        loadNotes();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 to-white/0 border border-rose-500/20">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                <span className="text-rose-400">🎙️</span> Voice Notes
            </h3>

            {/* Recording Button */}
            <div className="flex items-center gap-4 mb-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all ${isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                        }`}
                >
                    {isRecording ? (
                        <>
                            <Square size={18} fill="currentColor" />
                            Stop Recording
                        </>
                    ) : (
                        <>
                            <Mic size={18} />
                            Record Note
                        </>
                    )}
                </motion.button>

                {isRecording && (
                    <div className="flex items-center gap-2 text-red-400 font-mono">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        {formatTime(recordingTime)}
                    </div>
                )}
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                    {notes.map(note => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group"
                        >
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handlePlay(note)}
                                className={`p-2 rounded-lg transition-colors ${playingId === note.id
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-white/10 text-white/60 hover:text-white'
                                    }`}
                            >
                                {playingId === note.id ? <Pause size={16} /> : <Play size={16} />}
                            </motion.button>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{note.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-white/40">
                                    <Clock size={10} />
                                    {voiceNotesService.formatDuration(note.duration || 0)}
                                    <span>•</span>
                                    {new Date(note.timestamp).toLocaleString()}
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(note.id)}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                                <Trash2 size={14} className="text-red-400" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {notes.length === 0 && (
                    <div className="py-8 text-center text-white/30">
                        <Mic size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No voice notes yet</p>
                        <p className="text-xs">Tap "Record Note" to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceNotes;
