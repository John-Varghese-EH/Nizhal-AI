import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoAvatar = ({
    personaId = 'default',
    currentState = 'idle',
    mood = 'neutral',
    size = 'medium',
    className = ''
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentVideo, setCurrentVideo] = useState(0);
    const video1Ref = useRef(null);
    const video2Ref = useRef(null);

    const videoSources = {
        default: {
            idle: '/videos/avatar/idle_loop.webm',
            listening: '/videos/avatar/listening.webm',
            thinking: '/videos/avatar/thinking.webm',
            speaking: '/videos/avatar/speaking.webm',
            happy: '/videos/avatar/happy.webm',
            wave: '/videos/avatar/wave.webm'
        },
        jarvis: {
            idle: '/videos/jarvis/idle_loop.webm',
            listening: '/videos/jarvis/listening.webm',
            thinking: '/videos/jarvis/thinking.webm',
            speaking: '/videos/jarvis/speaking.webm'
        },
        kavya: {
            idle: '/videos/thozhi/idle_loop.webm',
            speaking: '/videos/thozhi/speaking.webm',
            listening: '/videos/thozhi/listening_nod.webm',
            happy: '/videos/thozhi/happy_laugh.webm',
            greeting: '/videos/thozhi/greeting_wave.webm',
            sad: '/videos/thozhi/sad_concern.webm'
        },
        arjun: {
            idle: '/videos/thozhan/idle.webm',
            speaking: '/videos/thozhan/speaking.webm'
        },
        naruto: { idle: '/videos/anime/naruto_idle.webm' },
        goku: { idle: '/videos/anime/goku_idle.webm' },
        elsa: { idle: '/videos/cartoon/elsa_idle.webm' }
    };

    const sizeClasses = {
        small: 'w-32 h-32',
        medium: 'w-48 h-48',
        large: 'w-64 h-64',
        fullscreen: 'w-full h-full'
    };

    const getVideoSource = () => {
        const personaVideos = videoSources[personaId] || videoSources.default;
        return personaVideos[currentState] || personaVideos.idle;
    };

    useEffect(() => {
        const activeVideo = currentVideo === 0 ? video1Ref.current : video2Ref.current;
        const inactiveVideo = currentVideo === 0 ? video2Ref.current : video1Ref.current;

        if (inactiveVideo) {
            inactiveVideo.src = getVideoSource();
            inactiveVideo.load();

            inactiveVideo.oncanplaythrough = () => {
                inactiveVideo.play().then(() => {
                    setCurrentVideo(prev => prev === 0 ? 1 : 0);
                }).catch(console.error);
            };
        }
    }, [currentState, personaId]);

    useEffect(() => {
        const video = video1Ref.current;
        if (video) {
            video.src = getVideoSource();
            video.load();
            video.oncanplaythrough = () => {
                video.play().then(() => setIsLoaded(true)).catch(console.error);
            };
        }
    }, []);

    return (
        <div className={`relative overflow-visible ${sizeClasses[size]} ${className}`}>
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <motion.div
                        className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            )}

            <video
                ref={video1Ref}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${currentVideo === 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                loop
                muted
                playsInline
            />

            <video
                ref={video2Ref}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${currentVideo === 1 ? 'opacity-100' : 'opacity-0'
                    }`}
                loop
                muted
                playsInline
            />

            {/* Shadow overlay removed for full character display */}

            <AnimatePresence>
                {currentState === 'listening' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                    >
                        <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-indigo-500 rounded-full"
                                    animate={{
                                        height: [8, 20, 8],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        delay: i * 0.1
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoAvatar;
