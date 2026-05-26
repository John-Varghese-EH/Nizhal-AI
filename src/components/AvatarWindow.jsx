import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { ThreeCanvasController } from '../services/ThreeViewer';

const AvatarWindow = ({ modelUrl, expression, isSpeaking, onLoad }) => {
    const containerRef = useRef(null);
    const controllerRef = useRef(null);
    const [loadStatus, setLoadStatus] = useState('idle');
    const [fps, setFps] = useState(0);
    const [showDebug, setShowDebug] = useState(false);
    const [camPos, setCamPos] = useState({ x: 0, y: 0, z: 0 });

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        // Initialize ThreeCanvasController with mount-guard
        const controller = new ThreeCanvasController();
        controllerRef.current = controller;

        // Mount the controller canvas directly onto the container element
        controller.mount(containerRef.current);

        // Bind status and FPS observers
        controller.onStatusChange = (status) => {
            setLoadStatus(status);
            if (status === 'loaded' && onLoad) {
                onLoad();
            }
        };
        controller.onFpsUpdate = (currentFps) => {
            setFps(currentFps);
            if (controller.camera) {
                setCamPos({
                    x: controller.camera.position.x.toFixed(2),
                    y: controller.camera.position.y.toFixed(2),
                    z: controller.camera.position.z.toFixed(2)
                });
            }
        };

        // Complete unmount garbage collection cleanup
        return () => {
            if (controllerRef.current) {
                controllerRef.current.dispose();
                controllerRef.current = null;
            }
        };
    }, []);

    // Load new model if modelUrl changes
    useEffect(() => {
        if (controllerRef.current && modelUrl && loadStatus !== 'loading') {
            controllerRef.current.loadVRM(modelUrl);
        }
    }, [modelUrl]);

    // Handle expressions inside the Three.js update cycles
    useEffect(() => {
        const controller = controllerRef.current;
        if (!controller || !controller.vrm) return;

        const vrm = controller.vrm;
        if (vrm.expressionManager) {
            // Reset all expressions first
            const expressions = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'thinking'];
            expressions.forEach(exp => {
                vrm.expressionManager.setValue(exp, 0);
            });

            // Trigger target expression
            if (expression) {
                vrm.expressionManager.setValue(expression === 'thinking' ? 'relaxed' : expression, 1);
            }
        }
    }, [expression, loadStatus]);

    // High-performance voice-reactive lip sync loop driven by global audio-energy events
    useEffect(() => {
        const controller = controllerRef.current;
        if (!controller) return;

        let activeSpeak = true;
        let lastEnergy = 0;

        // Register the global Tauri event listener for live audio stream volume levels
        const unlistenEnergy = window.nizhal?.on?.('avatar:audio-energy', (energy) => {
            lastEnergy = typeof energy === 'number' ? energy : 0;
        });

        const animateMouth = () => {
            if (!activeSpeak || !controllerRef.current) return;
            const vrm = controllerRef.current.vrm;
            if (vrm && vrm.expressionManager) {
                if (isSpeaking) {
                    // Voice reactive lip-sync: scale mouth opening dynamically based on actual voice energy!
                    // Apply a natural baseline + multiplier, and smoothly interpolate (lerp) values so it moves fluidly
                    const targetValue = Math.min(0.85, 0.15 + lastEnergy * 5.0);
                    const currentValue = vrm.expressionManager.getValue('aa') || 0;
                    const newValue = currentValue + (targetValue - currentValue) * 0.32;
                    vrm.expressionManager.setValue('aa', newValue);
                } else {
                    const currentValue = vrm.expressionManager.getValue('aa') || 0;
                    if (currentValue > 0.01) {
                        vrm.expressionManager.setValue('aa', currentValue * 0.72); // Smooth decay shutdown
                    } else {
                        vrm.expressionManager.setValue('aa', 0);
                    }
                }
            }
            requestAnimationFrame(animateMouth);
        };

        animateMouth();

        return () => {
            activeSpeak = false;
            if (unlistenEnergy) unlistenEnergy();
        };
    }, [isSpeaking, loadStatus]);

    return (
        <div 
            ref={containerRef} 
            className="relative w-full h-full overflow-hidden bg-transparent"
            style={{ position: 'relative', width: '100%', height: '100%' }}
        >
            {/* Loading/Error Spinner overlay states */}
            {loadStatus === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-30 transition-all select-none">
                    <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(34,211,238,0.2)]" />
                    <span className="text-xs text-cyan-200 tracking-wider animate-pulse">Initializing Engine...</span>
                </div>
            )}

            {loadStatus === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-sm z-30 select-none">
                    <span className="text-3xl mb-2">⚠️</span>
                    <span className="text-xs text-red-200 tracking-wider font-semibold">Failed to Load Skin</span>
                    <button 
                        onClick={() => controllerRef.current?.loadVRM(modelUrl)}
                        className="mt-3 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-xl text-[10px] border border-red-500/20 uppercase tracking-widest transition-all active:scale-95"
                    >
                        Retry Load
                    </button>
                </div>
            )}

            {/* Toggleable Hidden Debug HUD button */}
            <div 
                className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/5 hover:bg-white/20 transition-all cursor-pointer z-40 select-none"
                onClick={() => setShowDebug(!showDebug)}
                title="Toggle Debug HUD"
            />

            {showDebug && (
                <div className="absolute top-4 left-4 p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-mono text-cyan-400 z-40 space-y-1 shadow-lg pointer-events-none select-none">
                    <div className="font-bold text-white mb-1 tracking-wider border-b border-white/5 pb-1">DIAGNOSTICS HUD</div>
                    <div>STATUS: <span className="text-white">{loadStatus.toUpperCase()}</span></div>
                    <div>CAMERA: <span className="text-white">[{camPos.x}, {camPos.y}, {camPos.z}]</span></div>
                    <div>RENDER FPS: <span className="text-white">{fps} FPS</span></div>
                </div>
            )}
        </div>
    );
};

export default AvatarWindow;
