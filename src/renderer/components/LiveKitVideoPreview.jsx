/**
 * LiveKitVideoPreview.jsx
 * Camera preview component for LiveKit video calls
 */

import { useState, useEffect, useRef } from 'react';
import { createLocalVideoTrack } from 'livekit-client';

export function LiveKitVideoPreview({ room, enabled = false, onToggle, hideControls = false }) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [localTrack, setLocalTrack] = useState(null);
    const videoRef = useRef(null);

    // Sync internal state with prop
    useEffect(() => {
        setIsEnabled(enabled);
    }, [enabled]);

    useEffect(() => {
        if (isEnabled && room) {
            startCamera();
        } else if (!isEnabled && localTrack) {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isEnabled, room]);

    const startCamera = async () => {
        try {
            // Create local video track
            const track = await createLocalVideoTrack({
                resolution: {
                    width: 640,
                    height: 480
                }
            });

            setLocalTrack(track);

            // Attach to video element
            if (videoRef.current) {
                track.attach(videoRef.current);
            }

            // Publish to room if connected
            if (room && room.localParticipant) {
                await room.localParticipant.publishTrack(track);
            }

            console.log('[LiveKitVideo] Camera started');
        } catch (error) {
            console.error('[LiveKitVideo] Failed to start camera:', error);
            setIsEnabled(false);
            if (onToggle) onToggle(false);

            if (error.name === 'NotAllowedError') {
                alert('Camera access denied. Please allow camera access in browser settings.');
            }
        }
    };

    const stopCamera = async () => {
        if (!localTrack) return;

        try {
            // Detach from video element
            if (videoRef.current) {
                localTrack.detach(videoRef.current);
            }

            // Unpublish from room
            if (room && room.localParticipant) {
                await room.localParticipant.unpublishTrack(localTrack);
            }

            // Stop track
            localTrack.stop();
            setLocalTrack(null);

            console.log('[LiveKitVideo] Camera stopped');
        } catch (error) {
            console.error('[LiveKitVideo] Error stopping camera:', error);
        }
    };

    const handleToggle = () => {
        const newState = !isEnabled;
        setIsEnabled(newState);
        if (onToggle) {
            onToggle(newState);
        }
    };

    return (
        <div className="livekit-video-preview relative">
            {/* Video Element */}
            <div className={`relative rounded-lg overflow-hidden bg-gray-900 ${isEnabled ? 'block' : 'hidden'}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto max-h-64 object-cover mirror"
                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                />

                {/* Camera enabled indicator */}
                <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white text-xs">Live</span>
                </div>
            </div>

            {/* Toggle Button (Optional) */}
            {!hideControls && (
                <button
                    onClick={handleToggle}
                    className={`mt-2 px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${isEnabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    title={isEnabled ? 'Turn camera off' : 'Turn camera on'}
                >
                    {isEnabled ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                            </svg>
                            Camera Off
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                            </svg>
                            Camera On
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export default LiveKitVideoPreview;
