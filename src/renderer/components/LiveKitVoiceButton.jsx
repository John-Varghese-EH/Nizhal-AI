/**
 * LiveKitVoiceButton.jsx
 * Voice connection button component for Nizhal AI
 */

import { useState, useEffect, useRef } from 'react';
import { livekitVoiceService } from '../services/LiveKitVoiceService';

export function LiveKitVoiceButton({ userName = 'User', onStatusChange, onRoomConnected, cameraEnabled, onCameraToggle }) {
    const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected
    const [muted, setMuted] = useState(false);
    const [agentSpeaking, setAgentSpeaking] = useState(false);
    const voiceServiceRef = useRef(livekitVoiceService);

    useEffect(() => {
        // Use singleton service
        const service = livekitVoiceService;

        // Setup callbacks
        service.onConnected = () => {
            setStatus('connected');
            if (onStatusChange) onStatusChange('connected');
            // Pass room to parent for camera integration
            if (onRoomConnected && service.room) {
                onRoomConnected(service.room);
            }
        };

        service.onDisconnected = (reason) => {
            setStatus('disconnected');
            if (onStatusChange) onStatusChange('disconnected');
            console.log('Disconnected:', reason);
        };

        service.onAgentSpeaking = (speaking) => {
            setAgentSpeaking(speaking);
        };

        service.onError = (error) => {
            console.error('LiveKit error:', error);
            // Don't set to disconnected for "Client initiated disconnect" - this is expected during cleanup
            if (!error.message?.includes('Client initiated disconnect')) {
                setStatus('disconnected');
                if (onStatusChange) onStatusChange('error');
            }
        };

        // Sync initial state if already connected
        if (service.isConnected) {
            setStatus('connected');
            setMuted(service.isMuted);
            if (onRoomConnected && service.room) {
                onRoomConnected(service.room);
            }
        }

        // Cleanup only on actual component unmount
        return () => {
            // We DON'T disconnect here anymore if we want persistent voice across tabs,
            // but preserving original behavior for now:
            const service = livekitVoiceService;
            if (service && service.isConnected) {
                // For now, let's keep it behaving as before (disconnect on unmount)
                // Or actually, if we want camera to persist, maybe we should NOT disconnect?
                // But sticking to minimal changes implies keeping it.
                service.disconnect();
            }
        };
    }, []); // Empty deps - only run once on mount/unmount

    const handleConnect = async () => {
        setStatus('connecting');

        try {
            // Check if API is available
            if (!window.nizhal?.livekit) {
                throw new Error('LiveKit API not available. Please restart the app.');
            }

            // Get token from main process
            const result = await window.nizhal.livekit.connect(userName);

            if (!result.success) {
                throw new Error(result.error || 'Connection failed');
            }

            // Connect to room
            await voiceServiceRef.current.connect(result.token, result.url);

        } catch (error) {
            console.error('Connection failed:', error);
            setStatus('disconnected');
            alert(`Voice connection failed: ${error.message}`);
        }
    };

    const handleDisconnect = async () => {
        await voiceServiceRef.current.disconnect();
        if (window.nizhal?.livekit) {
            await window.nizhal.livekit.disconnect();
        }
        setStatus('disconnected');
    };

    const handleToggleMute = async () => {
        const result = await voiceServiceRef.current.toggleMute();
        if (result.success) {
            setMuted(result.muted);
        }
    };

    return (
        <div className="livekit-voice-controls p-3 bg-gray-800/50 rounded-lg backdrop-blur">
            <div className="flex items-center gap-2">
                {/* Connection Button */}
                {status === 'disconnected' && (
                    <button
                        onClick={handleConnect}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Connect Voice
                    </button>
                )}

                {status === 'connecting' && (
                    <div className="px-4 py-2 bg-yellow-600 text-white rounded-lg flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Connecting...
                    </div>
                )}

                {status === 'connected' && (
                    <>
                        {/* Disconnect Button */}
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
                            title="Disconnect"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="4" />
                            </svg>
                        </button>

                        {/* Mute/Unmute Button */}
                        <button
                            onClick={handleToggleMute}
                            className={`px-4 py-2 rounded-lg transition-all ${muted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                                } text-white`}
                            title={muted ? 'Unmute' : 'Mute'}
                        >
                            {muted ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>

                        {/* Camera Toggle Button */}
                        {onCameraToggle && (
                            <button
                                onClick={() => onCameraToggle(!cameraEnabled)}
                                className={`px-4 py-2 rounded-lg transition-all ${!cameraEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                                    } text-white`}
                                title={!cameraEnabled ? 'Turn Camera On' : 'Turn Camera Off'}
                            >
                                {!cameraEnabled ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </button>
                        )}

                        {/* Agent Speaking Indicator */}
                        {agentSpeaking && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-purple-600/50 rounded-lg">
                                <div className="flex gap-1">
                                    <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-white text-sm">AI Speaking</span>
                            </div>
                        )}
                    </>
                )}

                {/* Status Text */}
                <span className="text-gray-400 text-sm ml-auto">
                    {status === 'connected' && (muted ? 'Muted' : 'Live')}
                </span>
            </div>
        </div>
    );
}

export default LiveKitVoiceButton;
