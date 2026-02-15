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

        // Full quality - update every frame
        const dt = delta;

        // Required for VRM visibility and spring bones
        vrm.update(dt);

        // Update state controller
        const stateController = stateControllerRef.current;
        stateController.update(dt);

        // Get current avatar state
        const currentState = stateController.getState();

        // Update VRMA animation mixer
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

            // Random idle gestures every 30-60 seconds
            if (currentState === AvatarState.IDLE) {
                idleGestureTimerRef.current += dt;
                if (idleGestureTimerRef.current > 30 + Math.random() * 30) {
                    idleGestureTimerRef.current = 0;
                    // 40% chance to play a gesture
                    if (Math.random() < 0.4) {
                        vrmaService.playRandomGesture();
                    }
                }
            } else {
                idleGestureTimerRef.current = 0;
            }
        }

        // Blink animation (disabled during sleeping - eyes closed)
        if (enableBlink && currentState !== AvatarState.SLEEPING) {
            blinkTimerRef.current += dt;
            if (blinkTimerRef.current > 3 + Math.random() * 4) {
                blinkTimerRef.current = 0;
                const blinkExpr = vrm.expressionManager?.getExpression('blink');
                if (blinkExpr) {
                    vrm.expressionManager.setValue('blink', 1);
                    setTimeout(() => {
                        vrm.expressionManager?.setValue('blink', 0);
                    }, 100);
                }
            }
        }

        // Mouth animation for speaking
        if (isSpeaking && vrm.expressionManager) {
            const mouthValue = 0.3 + Math.sin(state.clock.elapsedTime * 15) * 0.2;
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

    const handlePointerOver = useCallback(() => {
        animEngineRef.current?.handleInteraction(InteractionType.HOVER);
    }, []);

    const handlePointerMove = useCallback((e) => {
        // Detect "rubbing" or "petting" motion (back and forth)
        const now = Date.now();
        if (now - lastMoveTimeRef.current > 100) {
            lastMoveTimeRef.current = now;

            // Approximate head area (top 20% of the bounding box)
            // e.point is the 3D intersection point
            if (e.point && e.point.y > 1.2) { // Rough height check for head
                moveHistoryRef.current.push(e.point.x);
                if (moveHistoryRef.current.length > 5) moveHistoryRef.current.shift();

                // Check for direction changes (zig-zag x-movement)
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
                    mouseServiceRef.current?.triggerEvent('headPat'); // Notify service

                    // Reset after delay
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
            onPointerMove={handlePointerMove}
        />
    );
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

    // Quality presets
    const qualitySettings = useMemo(() => ({
        low: { pixelRatio: 0.75, antialias: true, shadows: false },
        medium: { pixelRatio: 1, antialias: true, shadows: false },
        high: { pixelRatio: 1.5, antialias: true, shadows: true }
    }), []);

    // Default to high quality
    const settings = qualitySettings[quality] || qualitySettings.high;

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
                dpr={settings.pixelRatio}
                gl={{
                    antialias: settings.antialias,
                    alpha: true,
                    powerPreference: 'high-performance',
                    preserveDrawingBuffer: true
                }}
                style={{ background: 'transparent' }}
                frameloop="always"
            >
                {/* Improved lighting for better VRM rendering */}
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 5, 5]} intensity={0.7} />
                <directionalLight position={[-5, 3, -5]} intensity={0.3} />

                <OptimizedVRMModel
                    key={modelUrl}
                    url={modelUrl}
                    scale={1}
                    expression={expression}
                    isSpeaking={isSpeaking}
                    onLoad={handleLoad}
                    onError={onError}
                />

                {enableInteraction && (
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
        </div>
    );
});

// Export both: default is full component with Canvas, named is just the model
export { OptimizedVRMModel };
export default OptimizedVRMAvatar;
