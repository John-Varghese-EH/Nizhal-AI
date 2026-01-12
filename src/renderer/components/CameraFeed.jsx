import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, RefreshCw, AlertCircle } from 'lucide-react';
import cameraService from '../../services/CameraService';

/**
 * CameraFeed - Camera preview component with controls
 * Integrates with CameraService for webcam access
 */
const CameraFeed = ({
    enabled = false,
    onToggle,
    onFrame,
    privacyMode = false,
    showControls = true,
    className = ''
}) => {
    const videoRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState(null);

    useEffect(() => {
        // Sync privacy mode with service
        cameraService.setPrivacyMode(privacyMode);
    }, [privacyMode]);

    useEffect(() => {
        if (enabled && !privacyMode) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [enabled, privacyMode]);

    const startCamera = async () => {
        setError(null);

        if (videoRef.current) {
            const initialized = await cameraService.initialize(videoRef.current);
            if (!initialized) {
                setError('Failed to initialize camera');
                return;
            }

            const success = await cameraService.startCamera();
            if (success) {
                setIsActive(true);

                // Get available cameras
                const available = await cameraService.getAvailableCameras();
                setCameras(available);
                if (available.length > 0) {
                    setCurrentCamera(available[0].deviceId);
                }

                // Start frame capture if callback provided
                if (onFrame) {
                    cameraService.startCapturing(onFrame, 2000); // 1 frame every 2 seconds
                }
            } else {
                setError('Camera access denied or unavailable');
            }
        }
    };

    const stopCamera = () => {
        cameraService.stopCamera();
        setIsActive(false);
    };

    const switchCamera = async () => {
        if (cameras.length <= 1) return;

        const currentIndex = cameras.findIndex(c => c.deviceId === currentCamera);
        const nextIndex = (currentIndex + 1) % cameras.length;
        const nextCamera = cameras[nextIndex];

        const success = await cameraService.switchCamera(nextCamera.deviceId);
        if (success) {
            setCurrentCamera(nextCamera.deviceId);
        }
    };

    const handleToggle = () => {
        if (onToggle) {
            onToggle(!enabled);
        }
    };

    if (privacyMode) {
        return (
            <div className={`relative rounded-xl overflow-hidden bg-slate-900/50 border border-green-500/30 ${className}`}>
                <div className="aspect-video flex flex-col items-center justify-center text-green-400 p-4">
                    <CameraOff size={32} className="mb-2" />
                    <p className="text-sm font-mono">Privacy Mode Active</p>
                    <p className="text-xs text-green-400/60 mt-1">Camera disabled</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`relative rounded-xl overflow-hidden bg-slate-900/50 border border-red-500/30 ${className}`}>
                <div className="aspect-video flex flex-col items-center justify-center text-red-400 p-4">
                    <AlertCircle size={32} className="mb-2" />
                    <p className="text-sm">{error}</p>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={startCamera}
                        className="mt-3 px-4 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 rounded-lg"
                    >
                        <RefreshCw size={14} className="inline mr-1" />
                        Retry
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative rounded-xl overflow-hidden bg-black/50 ${className}`}>
            {/* Video element */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${enabled ? 'block' : 'hidden'}`}
            />

            {/* Placeholder when not active */}
            {!enabled && (
                <div className="aspect-video flex flex-col items-center justify-center text-slate-500 p-4">
                    <Camera size={32} className="mb-2" />
                    <p className="text-sm">Camera Off</p>
                    {showControls && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleToggle}
                            className="mt-3 px-4 py-2 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg"
                        >
                            Enable Camera
                        </motion.button>
                    )}
                </div>
            )}

            {/* Live indicator */}
            {enabled && isActive && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-500/80 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-white">LIVE</span>
                </div>
            )}

            {/* Camera switch button */}
            {enabled && isActive && cameras.length > 1 && showControls && (
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={switchCamera}
                    className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full"
                    title="Switch camera"
                >
                    <RefreshCw size={14} className="text-white" />
                </motion.button>
            )}

            {/* Toggle button overlay */}
            {enabled && showControls && (
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggle}
                    className="absolute bottom-2 left-2 p-2 bg-black/50 hover:bg-red-500/50 rounded-full"
                    title="Disable camera"
                >
                    <CameraOff size={14} className="text-white" />
                </motion.button>
            )}
        </div>
    );
};

export default CameraFeed;
