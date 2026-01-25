import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, RefreshCw, AlertCircle, Box } from 'lucide-react';
import cameraService from '../../services/CameraService';
import { objectDetectionService } from '../../services/ObjectDetectionService';

/**
 * CameraFeed - Camera preview component with controls
 * Integrates with CameraService for webcam access
 * Optionally includes COCO-SSD object detection with bounding boxes
 */
const CameraFeed = ({
    enabled = false,
    onToggle,
    onFrame,
    privacyMode = false,
    showControls = true,
    enableObjectDetection = false,
    className = ''
}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState(null);
    const [detections, setDetections] = useState([]);
    const [modelLoaded, setModelLoaded] = useState(false);

    const isMounted = useRef(false);
    const mountingRef = useRef(false);

    useEffect(() => {
        isMounted.current = true;

        if (enabled && !privacyMode) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            isMounted.current = false;
            stopCamera();
        };
    }, [enabled, privacyMode]);

    // Handle object detection toggle
    useEffect(() => {
        if (enableObjectDetection && isActive && videoRef.current) {
            startObjectDetection();
        } else {
            stopObjectDetection();
        }

        return () => {
            stopObjectDetection();
        };
    }, [enableObjectDetection, isActive]);

    // Draw bounding boxes on canvas
    useEffect(() => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        // Match canvas size to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length === 0) return;

        // Draw each detection
        detections.forEach(detection => {
            const [x, y, width, height] = detection.bbox;

            // Draw bounding box
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // Draw label background
            ctx.fillStyle = '#00ffff';
            const label = `${detection.class} ${detection.confidence}%`;
            ctx.font = 'bold 16px monospace';
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(x, y - 25, textWidth + 10, 25);

            // Draw label text
            ctx.fillStyle = '#000000';
            ctx.fillText(label, x + 5, y - 7);
        });
    }, [detections]);

    const startObjectDetection = async () => {
        if (!videoRef.current) return;

        console.log('[CameraFeed] Starting object detection...');
        const loaded = await objectDetectionService.loadModel();

        if (loaded && isMounted.current) {
            setModelLoaded(true);
            objectDetectionService.startDetection(
                videoRef.current,
                (detectionResults) => {
                    if (isMounted.current) {
                        setDetections(detectionResults);
                    }
                },
                500 // Detect every 500ms
            );
        }
    };

    const stopObjectDetection = () => {
        objectDetectionService.stopDetection();
        setDetections([]);
    };

    const startCamera = async () => {
        setError(null);
        if (mountingRef.current) return; // Prevent double init
        mountingRef.current = true;

        try {
            if (videoRef.current) {
                const initialized = await cameraService.initialize(videoRef.current);
                if (!isMounted.current) return;

                if (!initialized) {
                    setError('Failed to initialize camera');
                    return;
                }

                const success = await cameraService.startCamera();
                if (!isMounted.current) {
                    // If unmounted during start, immediately stop to prevent orphaned stream
                    cameraService.stopCamera();
                    return;
                }

                if (success) {
                    setIsActive(true);

                    // Get available cameras
                    const available = await cameraService.getAvailableCameras();
                    if (isMounted.current) {
                        setCameras(available);
                        if (available.length > 0) {
                            setCurrentCamera(available[0].deviceId);
                        }

                        // Start frame capture if callback provided
                        if (onFrame) {
                            cameraService.startCapturing(onFrame, 2000);
                        }
                    }
                } else {
                    setError('Camera access denied or unavailable');
                }
            }
        } finally {
            mountingRef.current = false;
        }
    };

    const stopCamera = () => {
        cameraService.stopCamera();
        stopObjectDetection();
        if (isMounted.current) {
            setIsActive(false);
        }
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

            {/* Canvas overlay for bounding boxes */}
            {enabled && enableObjectDetection && (
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
            )}

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

            {/* Object detection indicator */}
            {enabled && enableObjectDetection && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-cyan-500/80 rounded-full">
                    <Box size={12} className="text-white" />
                    <span className="text-[10px] font-mono text-white">
                        {modelLoaded ? `${detections.length} objects` : 'Loading...'}
                    </span>
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
