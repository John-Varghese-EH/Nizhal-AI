import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Extend THREE objects for R3F (required in v8+)
extend(THREE);

/**
 * Holographic Core - The central pulsing orb
 */
const HoloCore = ({ state, mood }) => {
    const coreRef = useRef();
    const glowRef = useRef();

    const moodColors = {
        happy: '#10b981',
        neutral: '#00d4ff',
        concerned: '#f59e0b',
        protective: '#ef4444',
        playful: '#ec4899',
        thoughtful: '#8b5cf6'
    };

    const color = new THREE.Color(moodColors[mood] || moodColors.neutral);

    useFrame((frameState) => {
        if (coreRef.current) {
            const time = frameState.clock.elapsedTime;
            const baseScale = state === 'speaking' ? 1 + Math.sin(time * 8) * 0.15 : 1;
            const pulse = 1 + Math.sin(time * 2) * 0.05;
            coreRef.current.scale.setScalar(baseScale * pulse);
        }
        if (glowRef.current) {
            glowRef.current.material.opacity = 0.3 + Math.sin(frameState.clock.elapsedTime * 3) * 0.15;
        }
    });

    return (
        <group>
            {/* Outer Glow */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>

            {/* Main Core */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Inner Core */}
            <mesh>
                <sphereGeometry args={[0.3, 24, 24]} />
                <meshBasicMaterial color="white" transparent opacity={0.4} />
            </mesh>
        </group>
    );
};

/**
 * Orbital Ring - Rotating rings around the core
 */
const OrbitalRing = ({ radius, speed, color, thickness = 0.02 }) => {
    const ringRef = useRef();

    useFrame((state, delta) => {
        if (ringRef.current) {
            ringRef.current.rotation.z += speed * delta;
        }
    });

    return (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, thickness, 16, 100]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
    );
};

/**
 * Data Particles - Floating particles around the hologram
 */
const DataParticles = ({ count = 20, state }) => {
    const particlesRef = useRef();

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = 0.8 + Math.random() * 0.5;
            temp.push({
                position: [
                    Math.cos(angle) * radius,
                    (Math.random() - 0.5) * 1.5,
                    Math.sin(angle) * radius
                ],
                speed: 0.5 + Math.random() * 1.5
            });
        }
        return temp;
    }, [count]);

    useFrame((frameState) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y += 0.005;
            if (state === 'thinking') {
                particlesRef.current.rotation.y += 0.01;
            }
        }
    });

    return (
        <group ref={particlesRef}>
            {particles.map((p, i) => (
                <mesh key={i} position={p.position}>
                    <sphereGeometry args={[0.02, 8, 8]} />
                    <meshBasicMaterial color="#00d4ff" />
                </mesh>
            ))}
        </group>
    );
};

/**
 * Jarvis Hologram Scene
 */
const JarvisScene = ({ state, mood, eyePosition }) => {
    const groupRef = useRef();

    useFrame(() => {
        if (groupRef.current && eyePosition) {
            groupRef.current.rotation.y = eyePosition.x * 0.3;
            groupRef.current.rotation.x = -eyePosition.y * 0.2;
        }
    });

    return (
        <group ref={groupRef}>
            <ambientLight intensity={0.3} />
            <pointLight position={[5, 5, 5]} intensity={0.5} />

            <HoloCore state={state} mood={mood} />

            <OrbitalRing radius={1.2} speed={0.5} color="#00d4ff" />
            <group rotation={[Math.PI / 3, 0, 0]}>
                <OrbitalRing radius={1.0} speed={-0.7} color="#ff6b35" thickness={0.015} />
            </group>
            <group rotation={[Math.PI / 6, Math.PI / 4, 0]}>
                <OrbitalRing radius={0.9} speed={0.4} color="#00d4ff" thickness={0.01} />
            </group>

            <DataParticles count={state === 'thinking' ? 40 : 20} state={state} />
        </group>
    );
};

/**
 * JarvisHologram - A 3D holographic avatar for the Jarvis persona
 * NOTE: This component should be rendered INSIDE a <Canvas>, not standalone.
 */
const JarvisHologram = ({
    state = 'idle',
    mood = 'neutral',
    eyePosition = { x: 0, y: 0 },
    size = 'medium'
}) => {
    // When used inside a Canvas from parent, just render the scene
    return <JarvisScene state={state} mood={mood} eyePosition={eyePosition} />;
};

export default JarvisHologram;
