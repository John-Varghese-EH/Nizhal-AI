import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getAvatarStateController, AvatarState } from '../../../services/AvatarStateController';
import { touchRegionsService } from '../../../services/TouchRegions';

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
 */
const OptimizedVRMModel = ({
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

                            // Setup lookAt target as Object3D (proper way per three-vrm docs)
                            if (loadedVrm.lookAt) {
                                const lookAtTarget = new THREE.Object3D();
                                lookAtTarget.position.set(0, 1.5, 1);
                                loadedVrm.lookAt.target = lookAtTarget;
                                lookAtTargetRef.current = lookAtTarget;
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
        return () => { mounted = false; };
    }, [url]);

    // Optimized update loop - uses state controller for animations
    useFrame((state, delta) => {
        if (!vrm) return;

        frameCountRef.current++;

        // Skip frames for performance (update every 2nd frame)
        if (frameCountRef.current % 2 !== 0) return;

        const dt = delta * 2; // Compensate for skipped frames
        vrm.update(dt);

        // Update state controller
        const stateController = stateControllerRef.current;
        stateController.update(dt);

        // Get animation parameters from current state
        const animParams = stateController.getAnimationParams();
        const currentState = stateController.getState();

        // Look at mouse (throttled) - use proper Object3D target
        // Disable look-at during sleeping
        if (enableLookAt && vrm.lookAt && lookAtTargetRef.current && currentState !== AvatarState.SLEEPING) {
            const x = mouse.x * 2;
            const y = mouse.y * 1 + 1.5;
            lookAtTargetRef.current.position.set(x, y, 1);
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

        // Apply state-based expression
        if (vrm.expressionManager && animParams.expression) {
            try {
                const expr = vrm.expressionManager.getExpression(animParams.expression);
                if (expr) {
                    vrm.expressionManager.setValue(animParams.expression, animParams.expressionWeight || 0.5);
                }
            } catch (e) {
                // Expression might not exist in this model
            }
        }

        // Keep eyes closed during sleeping
        if (currentState === AvatarState.SLEEPING && vrm.expressionManager) {
            vrm.expressionManager.setValue('blink', 1);
        }

        // State-based animations
        const elapsedTime = state.clock.elapsedTime;
        let posY = 0;
        let rotZ = 0;

        // Breathing animation (varies by state)
        if (animParams.breathingSpeed > 0) {
            posY += Math.sin(elapsedTime * animParams.breathingSpeed) * animParams.breathingAmplitude;
        }

        // Sway animation
        if (animParams.swaySpeed > 0) {
            rotZ += Math.sin(elapsedTime * animParams.swaySpeed) * animParams.swayAmplitude;
        }

        // Dancing bounce
        if (currentState === AvatarState.DANCING && animParams.bounceSpeed) {
            posY += Math.abs(Math.sin(elapsedTime * animParams.bounceSpeed)) * animParams.bounceAmplitude;
        }

        // Dragging float effect
        if (currentState === AvatarState.DRAGGING && animParams.floatSpeed) {
            posY += Math.sin(elapsedTime * animParams.floatSpeed) * animParams.floatAmplitude;
        }

        // Sleeping head tilt
        if (currentState === AvatarState.SLEEPING && animParams.headTilt) {
            rotZ = animParams.headTilt;
        }

        // Apply to VRM scene
        if (vrm.scene) {
            vrm.scene.position.y = posY;
            vrm.scene.rotation.z = rotZ;
        }
    });

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
            onClick={(e) => touchRegionsService.handleTouch(e, vrm)}
        />
    );
};

/**
 * OptimizedVRMAvatar - Full avatar component with Canvas
 */
const OptimizedVRMAvatar = ({
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
        low: { pixelRatio: 0.5, antialias: false, shadows: false },
        medium: { pixelRatio: 0.75, antialias: true, shadows: false },
        high: { pixelRatio: 1, antialias: true, shadows: true }
    }), []);

    const settings = qualitySettings[quality] || qualitySettings.medium;

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
                    powerPreference: 'default',
                    preserveDrawingBuffer: true
                }}
                style={{ background: 'transparent' }}
                frameloop="always" // Only render when needed
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.5} />

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
                        minPolarAngle={Math.PI / 3}
                        maxPolarAngle={Math.PI / 2}
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
};

export default OptimizedVRMAvatar;
