import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { VRMLoaderService } from '../../../services/VRMLoaderService';
import { LipSyncService } from '../../../services/LipSyncService';
import TouchRegionSystem from './TouchRegionSystem';

// Extend THREE objects for R3F (required in v8+)
extend(THREE);

/**
 * VRM Character Component - Renders the loaded VRM inside Three.js scene
 */
const VRMCharacter = ({
    vrm,
    lipSyncService,
    mousePosition,
    state = 'idle',
    enableLookAt = true
}) => {
    const { camera } = useThree();
    const groupRef = useRef();
    const blinkTimer = useRef(0);

    // Look at target based on mouse - must be Object3D, not Vector3
    const lookAtTarget = useRef((() => {
        const target = new THREE.Object3D();
        target.position.set(0, 1.5, 2);
        return target;
    })());

    useFrame((frameState, delta) => {
        if (!vrm) return;

        // Update VRM (spring bones, etc.)
        vrm.update(delta);

        // Update look-at based on mouse
        if (enableLookAt && vrm.lookAt && mousePosition) {
            // Convert mouse position to 3D target
            const x = (mousePosition.x - 0.5) * 4;
            const y = (0.5 - mousePosition.y) * 3 + 1.5;
            lookAtTarget.current.position.set(x, y, 2);

            // Only set target if not already set
            if (vrm.lookAt.target !== lookAtTarget.current) {
                vrm.lookAt.target = lookAtTarget.current;
            }
        }

        // Random blinking
        blinkTimer.current += delta;
        if (blinkTimer.current > 3 + Math.random() * 2) {
            blinkTimer.current = 0;
            // Trigger blink expression
            if (vrm.expressionManager) {
                vrm.expressionManager.setValue('blink', 1);
                setTimeout(() => {
                    vrm.expressionManager?.setValue('blink', 0);
                }, 150);
            }
        }

        // Apply lip sync if available
        if (lipSyncService && vrm.expressionManager) {
            const visemes = lipSyncService.getVisemes();
            vrm.expressionManager.setValue('aa', visemes.aa || 0);
            vrm.expressionManager.setValue('oh', visemes.oh || 0);
            vrm.expressionManager.setValue('ee', visemes.ee || 0);
        }

        // State-based expressions
        if (vrm.expressionManager) {
            switch (state) {
                case 'happy':
                    vrm.expressionManager.setValue('happy', 0.7);
                    break;
                case 'thinking':
                    vrm.expressionManager.setValue('neutral', 1);
                    break;
                case 'speaking':
                    // Handled by lip sync
                    break;
                default:
                    vrm.expressionManager.setValue('neutral', 0.3);
            }
        }
    });

    if (!vrm) return null;

    return (
        <group ref={groupRef}>
            <primitive object={vrm.scene} />
        </group>
    );
};

/**
 * Loading Indicator
 */
const LoadingIndicator = () => {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.02;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.3;
        }
    });

    return (
        <mesh ref={meshRef}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#6366f1" wireframe />
        </mesh>
    );
};

/**
 * VRMAvatar - Full VRM avatar component with lip-sync and interactions
 */
const VRMAvatar = ({
    modelUrl,
    state = 'idle',
    mood = 'neutral',
    onLoad,
    onError,
    enableTouchRegions = true,
    enableLipSync = true,
    voicePacks = {},
    size = 'medium',
    className = ''
}) => {
    const containerRef = useRef(null);
    const [vrm, setVRM] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

    const vrmLoaderRef = useRef(new VRMLoaderService());
    const lipSyncRef = useRef(enableLipSync ? new LipSyncService() : null);

    const sizeClasses = {
        small: 'w-40 h-56',
        medium: 'w-64 h-80',
        large: 'w-96 h-120',
        fullscreen: 'w-full h-full'
    };

    // Load VRM model
    useEffect(() => {
        if (!modelUrl) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        vrmLoaderRef.current.loadVRM(modelUrl)
            .then(({ vrm: loadedVRM }) => {
                setVRM(loadedVRM);
                setLoading(false);
                onLoad?.(loadedVRM);
            })
            .catch((err) => {
                console.error('VRM load error:', err);
                setError(err.message);
                setLoading(false);
                onError?.(err);
            });

        return () => {
            vrmLoaderRef.current.dispose();
        };
    }, [modelUrl, onLoad, onError]);

    // Initialize lip sync
    useEffect(() => {
        if (enableLipSync && lipSyncRef.current) {
            lipSyncRef.current.initialize();
        }
        return () => {
            lipSyncRef.current?.dispose();
        };
    }, [enableLipSync]);

    // Track mouse position for look-at
    const handleMouseMove = useCallback((e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        });
    }, []);

    // Handle touch region events
    const handleRegionTouch = useCallback((regionId) => {
        console.log('Touch region:', regionId);
        // Could trigger expressions here
        if (vrm?.expressionManager) {
            vrm.expressionManager.setValue('surprised', 0.5);
            setTimeout(() => {
                vrm.expressionManager?.setValue('surprised', 0);
            }, 500);
        }
    }, [vrm]);

    const handleRegionPat = useCallback((regionId) => {
        console.log('Pat region:', regionId);
        // Trigger happy expression on pat
        if (vrm?.expressionManager) {
            vrm.expressionManager.setValue('happy', 1);
            setTimeout(() => {
                vrm.expressionManager?.setValue('happy', 0);
            }, 2000);
        }
    }, [vrm]);

    return (
        <div
            ref={containerRef}
            className={`relative ${sizeClasses[size]} ${className}`}
            onMouseMove={handleMouseMove}
        >
            {/* Background glow */}
            <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/10 to-blue-500/10 blur-xl"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
            />

            {/* 3D Canvas */}
            <Canvas
                camera={{ position: [0, 1.2, 2.5], fov: 35 }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[2, 3, 2]} intensity={0.8} />
                <directionalLight position={[-2, 1, -2]} intensity={0.3} />

                <Suspense fallback={<LoadingIndicator />}>
                    {vrm && (
                        <VRMCharacter
                            vrm={vrm}
                            lipSyncService={lipSyncRef.current}
                            mousePosition={mousePosition}
                            state={state}
                        />
                    )}
                </Suspense>

                <OrbitControls
                    enablePan={false}
                    enableZoom={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                    target={[0, 1, 0]}
                />
            </Canvas>

            {/* Touch Regions Overlay */}
            {enableTouchRegions && vrm && (
                <TouchRegionSystem
                    onRegionTouch={handleRegionTouch}
                    onRegionPat={handleRegionPat}
                    voicePacks={voicePacks}
                    containerRef={containerRef}
                    debug={false}
                />
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
                    <motion.div
                        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-2xl">
                    <div className="text-center p-4">
                        <span className="text-red-400 text-sm">Failed to load model</span>
                        <p className="text-xs text-gray-400 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* State Indicator */}
            {state !== 'idle' && (
                <motion.div
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 capitalize"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {state}
                </motion.div>
            )}
        </div>
    );
};

export default VRMAvatar;
