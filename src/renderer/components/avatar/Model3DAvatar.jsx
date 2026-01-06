import React, { useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, useAnimations } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

/**
 * 3D Model Component - Loads and renders a GLTF/GLB model
 */
const Model = ({
    modelPath,
    state = 'idle',
    eyePosition = { x: 0, y: 0 },
    scale = 1,
    position = [0, -1, 0]
}) => {
    const group = useRef();
    const { scene, animations } = useGLTF(modelPath);
    const { actions, names } = useAnimations(animations, group);

    // Clone the scene to avoid issues with multiple instances
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // Animation mapping based on state
    useEffect(() => {
        // Stop all current animations
        Object.values(actions).forEach(action => action?.fadeOut(0.3));

        // Map states to animation names (common naming conventions)
        const animationMap = {
            idle: ['Idle', 'idle', 'IDLE', 'Stand', 'Breathing'],
            speaking: ['Talk', 'Talking', 'Speaking', 'speak', 'Mouth_Open'],
            listening: ['Listen', 'Listening', 'Attention', 'look'],
            thinking: ['Think', 'Thinking', 'Pondering', 'idle'],
            happy: ['Happy', 'Joy', 'Celebrate', 'Wave'],
            waving: ['Wave', 'Waving', 'Greeting', 'Hello']
        };

        const targetAnimations = animationMap[state] || animationMap.idle;

        // Find and play matching animation
        for (const animName of targetAnimations) {
            const action = actions[animName];
            if (action) {
                action.reset().fadeIn(0.3).play();
                break;
            }
        }

        // Fallback to first available animation
        if (names.length > 0 && !targetAnimations.some(n => actions[n])) {
            actions[names[0]]?.reset().fadeIn(0.3).play();
        }
    }, [state, actions, names]);

    // Look at mouse effect
    useFrame(() => {
        if (group.current) {
            // Subtle rotation based on eye/mouse position
            group.current.rotation.y = THREE.MathUtils.lerp(
                group.current.rotation.y,
                eyePosition.x * 0.3,
                0.1
            );
            group.current.rotation.x = THREE.MathUtils.lerp(
                group.current.rotation.x,
                -eyePosition.y * 0.1,
                0.1
            );
        }
    });

    return (
        <group ref={group} position={position} scale={scale}>
            <primitive object={clonedScene} />
        </group>
    );
};

/**
 * Loading Placeholder while model loads
 */
const LoadingPlaceholder = () => {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.02;
            meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
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
 * Model3DAvatar - Renders a 3D character model for Desktop Mate companions
 * Supports GLTF/GLB models with animations
 */
const Model3DAvatar = ({
    modelPath,
    state = 'idle',
    mood = 'neutral',
    eyePosition = { x: 0, y: 0 },
    size = 'medium',
    modelScale = 1,
    enableControls = false,
    backgroundColor = 'transparent'
}) => {
    const sizeClasses = {
        small: 'w-32 h-32',
        medium: 'w-48 h-48',
        large: 'w-72 h-72',
        fullscreen: 'w-full h-full'
    };

    const moodColors = {
        happy: '#10b981',
        neutral: '#6366f1',
        concerned: '#f59e0b',
        protective: '#ef4444',
        playful: '#ec4899',
        thoughtful: '#8b5cf6'
    };

    const glowColor = moodColors[mood] || moodColors.neutral;

    return (
        <div className={`relative ${sizeClasses[size]}`}>
            {/* Mood Glow Effect */}
            <motion.div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ backgroundColor: glowColor }}
                animate={{
                    opacity: [0.2, 0.4, 0.2],
                    scale: [0.8, 1, 0.8]
                }}
                transition={{ duration: 3, repeat: Infinity }}
            />

            {/* 3D Canvas */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Canvas
                    camera={{ position: [0, 0, 3], fov: 45 }}
                    style={{ background: backgroundColor }}
                    shadows
                >
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
                    <directionalLight position={[-5, 3, -5]} intensity={0.3} />

                    <Suspense fallback={<LoadingPlaceholder />}>
                        {modelPath && (
                            <Model
                                modelPath={modelPath}
                                state={state}
                                eyePosition={eyePosition}
                                scale={modelScale}
                            />
                        )}
                        <Environment preset="sunset" />
                    </Suspense>

                    {enableControls && (
                        <OrbitControls
                            enablePan={false}
                            enableZoom={true}
                            minDistance={2}
                            maxDistance={6}
                        />
                    )}
                </Canvas>
            </div>

            {/* State Indicator */}
            {state !== 'idle' && (
                <motion.div
                    className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium capitalize"
                    style={{
                        backgroundColor: `${glowColor}30`,
                        color: glowColor,
                        border: `1px solid ${glowColor}50`
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {state}
                </motion.div>
            )}

            {/* Listening Pulse Effect */}
            {state === 'listening' && (
                <>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-2xl border-2"
                            style={{ borderColor: glowColor }}
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: [1, 1.2 + i * 0.1], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

// Preload common models (add your model paths here)
// useGLTF.preload('/models/character.glb');

export default Model3DAvatar;
