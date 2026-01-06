import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceRecognition } from '../services/VoiceRecognitionService';

const VoiceButton = ({
    onTranscript,
    onListeningChange,
    persona,
    disabled = false
}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        if (!voiceRecognition.isSupported()) {
            setError('Voice recognition not supported');
            return;
        }

        voiceRecognition.initialize();

        voiceRecognition.onStart = () => {
            setIsListening(true);
            setError(null);
            onListeningChange?.(true);
            startAudioVisualization();
        };

        voiceRecognition.onResult = ({ transcript, isFinal }) => {
            setTranscript(transcript);
            if (isFinal) {
                onTranscript?.(transcript);
                setTranscript('');
            }
        };

        voiceRecognition.onEnd = () => {
            setIsListening(false);
            onListeningChange?.(false);
            stopAudioVisualization();
        };

        voiceRecognition.onError = (err) => {
            setError(err);
            setIsListening(false);
            onListeningChange?.(false);
        };

        return () => {
            voiceRecognition.stopListening();
            stopAudioVisualization();
        };
    }, [onListeningChange, onTranscript]);

    const startAudioVisualization = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            const updateLevel = () => {
                if (!analyserRef.current) return;

                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);

                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(average / 255);

                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (err) {
            console.error('Failed to start audio visualization:', err);
        }
    };

    const stopAudioVisualization = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setAudioLevel(0);
    };

    const handleClick = () => {
        if (disabled) return;

        if (isListening) {
            voiceRecognition.stopListening();
        } else {
            voiceRecognition.startListening();
        }
    };

    const personaColors = {
        jarvis: '#00d4ff',
        bestie: '#ec4899',
        buddy: '#3b82f6'
    };

    const accentColor = personaColors[persona] || '#6366f1';

    return (
        <div className="relative flex flex-col items-center">
            <motion.button
                onClick={handleClick}
                disabled={disabled}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${isListening
                    ? 'bg-red-500'
                    : 'bg-white/10 hover:bg-white/20'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={{ scale: disabled ? 1 : 1.1 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
                style={{
                    boxShadow: isListening
                        ? `0 0 ${20 + audioLevel * 40}px ${accentColor}`
                        : 'none'
                }}
            >
                {isListening && (
                    <>
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="absolute inset-0 rounded-full border-2"
                                style={{ borderColor: accentColor }}
                                animate={{
                                    scale: [1, 1.5 + audioLevel],
                                    opacity: [0.6, 0]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.3
                                }}
                            />
                        ))}
                    </>
                )}

                <svg
                    className={`w-7 h-7 ${isListening ? 'text-white' : 'text-white/80'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                </svg>

                {isListening && (
                    <motion.div
                        className="absolute inset-2 rounded-full border-2 border-white/50"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    />
                )}
            </motion.button>

            <AnimatePresence>
                {transcript && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/80 rounded-lg text-sm text-white max-w-xs text-center"
                    >
                        {transcript}
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-red-400 whitespace-nowrap"
                >
                    {error === 'not-allowed' ? 'Mic access denied' : error}
                </motion.div>
            )}

            <span className="text-xs text-white/40 mt-2">
                {isListening ? 'Listening...' : 'Tap to speak'}
            </span>
        </div>
    );
};

export default VoiceButton;
