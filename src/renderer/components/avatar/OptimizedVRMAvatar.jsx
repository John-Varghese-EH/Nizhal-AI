import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getAvatarStateController, AvatarState } from '../../../services/AvatarStateController';
import { getVRMAAnimationService } from '../../../services/VRMAAnimationService';
import { getMouseInteractionService } from '../../../services/MouseInteractionService';
import { touchRegionsService } from '../../../services/TouchRegions';
import { getAdvancedAnimationEngine, InteractionType } from '../../../services/AdvancedAnimationEngine';

// Extend THREE objects for R3F (required in v8+)
extend(THREE);

// Performance monitoring
let performanceMode = 'standard'; // 'standard', 'low', 'minimal'
let frameSkipCounter = 0;
const FRAME_SKIP_THRESHOLD = 2; // Skip every 3rd frame on low-end

// Lazy import VRM loader to reduce initial bundle
let VRMLoaderPlugin = null;
let VRMUtils = null;
let GLTFLoader = null;

const loadVRMDeps = async () => {
    if (!VRMLoaderPlugin || !VRMUtils) {
        const vrm = await import('@pixiv/three-vrm');
        VRMLoaderPlugin = vrm.VRMLoaderPlugin;
        VRMUtils = vrm.VRMUtils;
    }
    if (!GLTFLoader) {
        const loader = await import('three/examples/jsm/loaders/GLTFLoader.js');
        GLTFLoader = loader.GLTFLoader;
    }
    return { VRMLoaderPlugin, VRMUtils, GLTFLoader };
};

/**
 * OptimizedVRMModel - Resource-efficient VRM renderer
 * Memoized to prevent unnecessary re-renders
 */
const OptimizedVRMModel = React.memo(({
    url,
    scale = 1,
    position = [0, 0, 0],
    enableLookAt = true,
    enableBlink = true,
    expression = 'neutral',
    isSpeaking = false,
    onHoverIn,
    onHoverOut,
    onLoad,
    onError
}) => {
    const [vrm, setVrm] = useState(null);
    const [loading, setLoading] = useState(true);
    const { camera, mouse, size } = useThree();
    const clockRef = useRef(new THREE.Clock());
    const blinkTimerRef = useRef(0);
    const frameCountRef = useRef(0);
    const lookAtTargetRef = useRef(null);
    const stateControllerRef = useRef(getAvatarStateController());
    const vrmaServiceRef = useRef(getVRMAAnimationService());
    const mouseServiceRef = useRef(getMouseInteractionService());
    const animEngineRef = useRef(getAdvancedAnimationEngine());
    const lastStateRef = useRef(null);
    const idleGestureTimerRef = useRef(0);
    const lastClickTimeRef = useRef(0);

    // Head pat detection logic
    const moveHistoryRef = useRef([]);
    const lastMoveTimeRef = useRef(0);
    const isRubbingRef = useRef(false);

    // Load VRM with lazy deps
    useEffect(() => {
        let mounted = true;

        const loadModel = async () => {
            try {
                const { VRMLoaderPlugin, VRMUtils, GLTFLoader } = await loadVRMDeps();
                const loader = new GLTFLoader();
                loader.crossOrigin = 'anonymous';
                loader.register((parser) => new VRMLoaderPlugin(parser, {
                    autoUpdateHumanBones: true
                }));

                loader.load(
                    url,
                    (gltf) => {
                        if (!mounted) return;
                        const loadedVrm = gltf.userData.vrm;
                        if (loadedVrm) {
                            // Apply VRM optimizations (from official three-vrm examples)
                            VRMUtils.removeUnnecessaryVertices(gltf.scene);
                            VRMUtils.combineSkeletons(gltf.scene);
                            VRMUtils.combineMorphs(loadedVrm);

                            // IMPORTANT: Disable frustum culling - prevents model disappearing
                            loadedVrm.scene.traverse((obj) => {
                                obj.frustumCulled = false;
                            });

                            // Rotate model to face camera
                            loadedVrm.scene.rotation.y = Math.PI;

                            // Initialize VRMA animation service with VRM
                            if (vrmaServiceRef.current) {
                                const vrmaService = vrmaServiceRef.current;
                                vrmaService.initialize(loadedVrm);
                                console.log('[OptimizedVRMModel] VRMA animation service initialized');

                                // Set initial idle state - will auto-load and play idle animation
                                vrmaService.setState('idle').then((success) => {
                                    if (success) {
                                        console.log('[OptimizedVRMModel] ✓ Idle animation started successfully');
                                        console.log('[OptimizedVRMModel] Animation state:', vrmaService.getState());
                                    } else {
                                        console.warn('[OptimizedVRMModel] ✗ Failed to start idle animation');
                                    }
                                }).catch(err => {
                                    console.error('[OptimizedVRMModel] ✗ Error starting idle animation:', err);
                                });
                            }

                            console.log('VRM loaded:', loadedVrm.meta?.name || url);
                            setVrm(loadedVrm);
                            onLoad?.(loadedVrm);
                        } else {
                            console.error('No VRM data found in model');
                            onError?.(new Error('No VRM data found'));
                        }
                        setLoading(false);
                    },
                    (progress) => {
                        if (progress.total > 0) {
                            console.log(`Loading VRM: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                        }
                    },
                    (error) => {
                        console.error('VRM load error:', error);
                        onError?.(error);
                        setLoading(false);
                    }
                );
            } catch (err) {
                console.error('Failed to load VRM deps:', err);
                setLoading(false);
            }
        };

        loadModel();

        // Cleanup when URL changes (model switch)
        return () => {
            mounted = false;
            // Dispose animation service to allow reinitialization with new VRM
            if (vrmaServiceRef.current) {
                vrmaServiceRef.current.dispose();
                console.log('[OptimizedVRMModel] Animation service disposed for model change');
            }
        };
    }, [url]);

    // Initialize MouseInteractionService when VRM is loaded
    useEffect(() => {
        if (vrm && mouseServiceRef.current) {
            mouseServiceRef.current.initialize();
            console.log('[OptimizedVRMModel] MouseInteractionService initialized');

            // Subscribe to interaction events
            const unsubscribe = mouseServiceRef.current.onInteraction((event) => {
                console.log('[OptimizedVRMModel] Interaction:', event.type);
                // Trigger appropriate reactions
                if (event.type === 'headPat') {
                    touchRegionsService.triggerReaction('head');
                }
            });

            return () => {
                unsubscribe();
                mouseServiceRef.current?.stop();
            };
        }
    }, [vrm]);

    // Optimized update loop - uses state controller for animations
    useFrame((state, delta) => {
        if (!vrm) return;

        frameCountRef.current++;
        
        // Performance optimization: skip frames on low-end mode
        if (performanceMode === 'low') {
            frameSkipCounter++;
            if (frameSkipCounter % FRAME_SKIP_THRESHOLD !== 0) {
                return; // Skip this frame
            }
        }

        // Adaptive quality based on performance mode
        const dt = performanceMode === 'minimal' ? delta * 2 : delta;

        // Required for VRM visibility and spring bones
        vrm.update(dt);

        // Update state controller (reduced frequency on low-end)
        const stateController = stateControllerRef.current;
        if (performanceMode !== 'minimal' || frameCountRef.current % 2 === 0) {
            stateController.update(dt);
        }

        // Get current avatar state
        const currentState = stateController.getState();

        // Update VRMA animation mixer (reduced frequency on low-end)
        const vrmaService = vrmaServiceRef.current;
        if (vrmaService) {
            vrmaService.update(dt);

            // Detect state changes and trigger appropriate VRMA animation
            if (currentState !== lastStateRef.current) {
                lastStateRef.current = currentState;

                // Map AvatarState to animation state string
                const stateMap = {
                    [AvatarState.IDLE]: 'idle',
                    [AvatarState.SPEAKING]: 'speaking',
                    [AvatarState.DANCING]: 'dancing',
                    [AvatarState.SLEEPING]: 'idle', // Fixed: Use idle to keep upright (eyes will still close)
                    [AvatarState.DRAGGING]: 'dragging',
                    [AvatarState.SITTING_TASKBAR]: 'sitting',
                    [AvatarState.SITTING_WINDOW]: 'sitting',
                    [AvatarState.THINKING]: 'thinking',
                    [AvatarState.HAPPY]: 'happy',
                    [AvatarState.EXCITED]: 'happy',
                    [AvatarState.SAD]: 'idle',
                    [AvatarState.EMBARRASSED]: 'idle',
                };

                const animState = stateMap[currentState] || 'idle';
                console.log(`[OptimizedVRMModel] State changed: ${currentState} -> animation: ${animState}`);
                vrmaService.setState(animState).catch(err => {
                    console.warn('[OptimizedVRMModel] Failed to set animation state:', err);
                });
            }

            // Random idle gestures (reduced frequency on low-end)
            if (currentState === AvatarState.IDLE) {
                idleGestureTimerRef.current += dt;
                const gestureInterval = performanceMode === 'low' ? 60 : 30; // Longer intervals on low-end
                if (idleGestureTimerRef.current > gestureInterval + Math.random() * gestureInterval) {
                    idleGestureTimerRef.current = 0;
                    // Lower chance on low-end devices
                    const gestureChance = performanceMode === 'low' ? 0.2 : 0.4;
                    if (Math.random() < gestureChance) {
                        vrmaService.playRandomGesture();
                    }
                }
            } else {
                idleGestureTimerRef.current = 0;
            }
        }

        // Blink animation (disabled during sleeping - eyes closed)
        // Reduced frequency on low-end devices
        if (enableBlink && currentState !== AvatarState.SLEEPING) {
            blinkTimerRef.current += dt;
            const blinkInterval = performanceMode === 'low' ? 6 : 3; // Less frequent blinking
            if (blinkTimerRef.current > blinkInterval + Math.random() * blinkInterval) {
                blinkTimerRef.current = 0;
                const blinkExpr = vrm.expressionManager?.getExpression('blink');
                if (blinkExpr) {
                    vrm.expressionManager.setValue('blink', 1);
                    setTimeout(() => {
                        vrm.expressionManager?.setValue('blink', 0);
                    }, performanceMode === 'low' ? 150 : 100); // Slower blink on low-end
                }
            }
        }

        // Mouth animation for speaking (simplified on low-end)
        if (isSpeaking && vrm.expressionManager) {
            const mouthValue = performanceMode === 'minimal' ? 0.5 : 0.3 + Math.sin(state.clock.elapsedTime * 15) * 0.2;
            vrm.expressionManager.setValue('aa', mouthValue);
            // Set speaking state if not already
            if (currentState !== AvatarState.SPEAKING) {
                stateController.setState(AvatarState.SPEAKING);
            }
        } else if (vrm.expressionManager) {
            vrm.expressionManager.setValue('aa', 0);
            // Return to idle from speaking
            if (currentState === AvatarState.SPEAKING) {
                stateController.setState(AvatarState.IDLE);
            }
        }

        // Keep eyes closed during sleeping
        if (currentState === AvatarState.SLEEPING && vrm.expressionManager) {
            vrm.expressionManager.setValue('blink', 1);
        }
    });

    // Handle interactive animation triggers (must be before any returns - React hooks rule)
    const handleClick = useCallback((e) => {
        if (!vrm) return;
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTimeRef.current;
        lastClickTimeRef.current = now;

        // Double-click detection (< 300ms)
        if (timeSinceLastClick < 300) {
            animEngineRef.current?.handleInteraction(InteractionType.DOUBLE_CLICK);
        } else {
            animEngineRef.current?.handleInteraction(InteractionType.CLICK);
        }

        touchRegionsService.handleTouch(e, vrm);
    }, [vrm]);

    const handlePointerOver = useCallback((e) => {
        // Only trigger hover state if we hit the actual model, not a transparent bounding box easily
        e.stopPropagation();
        animEngineRef.current?.handleInteraction(InteractionType.HOVER);
        onHoverIn?.();
    }, [onHoverIn]);

    const handlePointerOut = useCallback((e) => {
        onHoverOut?.();
    }, [onHoverOut]);

    const handlePointerMove = useCallback((e) => {
        // Detect "rubbing" or "petting" motion (back and forth)
        const now = Date.now();
        if (now - lastMoveTimeRef.current > 100) {
            lastMoveTimeRef.current = now;

            if (e.point && e.point.y > 1.2) { 
                moveHistoryRef.current.push(e.point.x);
                if (moveHistoryRef.current.length > 5) moveHistoryRef.current.shift();

                let directionChanges = 0;
                for (let i = 2; i < moveHistoryRef.current.length; i++) {
                    const prevDelta = moveHistoryRef.current[i - 1] - moveHistoryRef.current[i - 2];
                    const currDelta = moveHistoryRef.current[i] - moveHistoryRef.current[i - 1];
                    if (Math.sign(prevDelta) !== Math.sign(currDelta)) {
                        directionChanges++;
                    }
                }

                if (directionChanges >= 2 && !isRubbingRef.current) {
                    isRubbingRef.current = true;
                    console.log('[OptimizedVRMModel] Head Pat Detected! ❤️');
                    mouseServiceRef.current?.triggerEvent('headPat'); 
                    setTimeout(() => { isRubbingRef.current = false; }, 1000);
                }
            }
        }
    }, []);

    if (loading) {
        return (
            <Html center>
                <div className="text-white text-sm animate-pulse">Loading...</div>
            </Html>
        );
    }

    if (!vrm) return null;

    return (
        <primitive
            object={vrm.scene}
            scale={scale}
            position={position}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerMove={handlePointerMove}
        />
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when only callbacks change
    return prevProps.url === nextProps.url &&
           prevProps.scale === nextProps.scale &&
           prevProps.enableLookAt === nextProps.enableLookAt &&
           prevProps.enableBlink === nextProps.enableBlink &&
           prevProps.expression === nextProps.expression &&
           prevProps.isSpeaking === nextProps.isSpeaking &&
           JSON.stringify(prevProps.position) === JSON.stringify(nextProps.position);
});

/**
 * OptimizedVRMAvatar - Full avatar component with Canvas
 * Memoized to prevent unnecessary re-renders
 */
const OptimizedVRMAvatar = React.memo(({
    modelUrl,
    size = { width: 200, height: 300 },
    expression = 'neutral',
    isSpeaking = false,
    isThinking = false,
    enableInteraction = true,
    quality = 'medium', // 'low', 'medium', 'high'
    onLoad,
    onError
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentPerformanceMode, setCurrentPerformanceMode] = useState('standard');

    // Listen for performance mode changes from main process
    useEffect(() => {
        const handlePerformanceMode = (event) => {
            const { isLowEnd } = event.data;
            const mode = isLowEnd ? 'low' : 'standard';
            performanceMode = mode;
            setCurrentPerformanceMode(mode);
            console.log(`[OptimizedVRMAvatar] Performance mode: ${mode}`);
        };

        window.addEventListener('message', handlePerformanceMode);
        
        // Request initial performance mode (via Tauri or browser)
        if (window.nizhal?.system?.getPerformanceMode) {
            window.nizhal.system.getPerformanceMode().then(({ is_low_end, isLowEnd }) => {
                const mode = (is_low_end || isLowEnd) ? 'low' : 'standard';
                performanceMode = mode;
                setCurrentPerformanceMode(mode);
            }).catch(() => {});
        }


        return () => {
            window.removeEventListener('message', handlePerformanceMode);
        };
    }, []);

    // Quality presets based on performance mode
    const qualitySettings = useMemo(() => {
        const baseSettings = {
            low: { pixelRatio: 0.5, antialias: false, shadows: false },
            medium: { pixelRatio: 1, antialias: true, shadows: false },
            high: { pixelRatio: 1.5, antialias: true, shadows: true }
        };
        
        // Force low quality on low-end devices
        if (currentPerformanceMode === 'low') {
            return baseSettings.low;
        }
        
        return baseSettings[quality] || baseSettings.medium;
    }, [quality, currentPerformanceMode]);

    // Adaptive frame loop based on performance
    const frameLoop = useMemo(() => {
        return currentPerformanceMode === 'low' ? 'demand' : 'always';
    }, [currentPerformanceMode]);

    const handleLoad = useCallback((vrm) => {
        setIsLoaded(true);
        onLoad?.(vrm);
    }, [onLoad]);

    return (
        <div
            style={{ width: size.width, height: size.height }}
            className="relative"
        >
            {/* Key prop forces full remount when model changes */}
            <Canvas
                key={modelUrl}
                camera={{ position: [0, 0.8, 3], fov: 50 }}
                dpr={qualitySettings.pixelRatio}
                gl={{
                    antialias: qualitySettings.antialias,
                    alpha: true,
                    powerPreference: currentPerformanceMode === 'low' ? 'default' : 'high-performance',
                    preserveDrawingBuffer: false // Disable on low-end to save memory
                }}
                style={{ background: 'transparent' }}
                frameloop={frameLoop}
                performance={{ min: 0.5, max: currentPerformanceMode === 'low' ? 30 : 60 }} // FPS limits
            >
                {/* Simplified lighting for low-end devices */}
                {currentPerformanceMode === 'low' ? (
                    <>
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 5, 5]} intensity={0.5} />
                    </>
                ) : (
                    <>
                        <ambientLight intensity={0.8} />
                        <directionalLight position={[5, 5, 5]} intensity={0.7} />
                        <directionalLight position={[-5, 3, -5]} intensity={0.3} />
                    </>
                )}

                <OptimizedVRMModel
                    key={modelUrl}
                    url={modelUrl}
                    scale={1}
                    expression={expression}
                    isSpeaking={isSpeaking}
                    onLoad={handleLoad}
                    onError={onError}
                />

                {enableInteraction && currentPerformanceMode !== 'minimal' && (
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        enableRotate={false}
                        target={[0, 1, 0]}
                    />
                )}
            </Canvas>

            {/* Thinking indicator */}
            {isThinking && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-lg animate-bounce">
                    💭
                </div>
            )}
            
            {/* Performance mode indicator (development only) */}
            {process.env.NODE_ENV === 'development' && currentPerformanceMode === 'low' && (
                <div className="absolute top-2 right-2 text-xs bg-yellow-500 text-black px-1 rounded">
                    LOW-END MODE
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when only callbacks change
    return prevProps.modelUrl === nextProps.modelUrl &&
           prevProps.expression === nextProps.expression &&
           prevProps.isSpeaking === nextProps.isSpeaking &&
           prevProps.isThinking === nextProps.isThinking &&
           prevProps.enableInteraction === nextProps.enableInteraction &&
           prevProps.quality === nextProps.quality &&
           JSON.stringify(prevProps.size) === JSON.stringify(nextProps.size);
});

// Export both: default is full component with Canvas, named is just the model
export { OptimizedVRMModel };
export default OptimizedVRMAvatar;
