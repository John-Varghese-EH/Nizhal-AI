import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Extend THREE objects for R3F (required in v8+)
extend(THREE);

/**
 * ParticleSphereVisualizer - Audio-reactive 3D particle sphere
 * Ported from Kreo 2.0 with enhancements for Nizhal AI
 * 
 * States:
 * - Idle: Small grey ball with breathing animation
 * - Listening: Expanded cyan sphere
 * - User Speaking: White color
 * - AI Speaking: Cyan with audio reactivity
 */

const ParticleSphere = ({ isActive, analyserOut, analyserIn, isUserSpeaking: isUserSpeakingProp }) => {
    const pointsRef = useRef(null);
    const count = 4000;
    const radius = 2;

    // Create initial positions for a sphere
    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        return positions;
    }, [count, radius]);

    const originalPositions = useMemo(() => particlesPosition.slice(), [particlesPosition]);

    const dataArray = useMemo(() => new Uint8Array(analyserOut?.frequencyBinCount || 128), [analyserOut]);
    const inputDataArray = useMemo(() => new Uint8Array(analyserIn?.frequencyBinCount || 128), [analyserIn]);

    const currentScale = useRef(0.2);
    const currentColor = useRef(new THREE.Color("#555555"));

    useFrame((state) => {
        if (!pointsRef.current) return;

        const time = state.clock.getElapsedTime();

        // Rotate slowly
        pointsRef.current.rotation.y = time * 0.05;
        pointsRef.current.rotation.z = time * 0.02;

        // Audio reactivity
        let averageFreq = 0;
        let isUserSpeaking = isUserSpeakingProp || false;

        // Check user input volume
        if (isActive && analyserIn) {
            analyserIn.getByteFrequencyData(inputDataArray);
            let inputSum = 0;
            for (let i = 0; i < inputDataArray.length; i++) {
                inputSum += inputDataArray[i];
            }
            const inputAvg = inputSum / inputDataArray.length;
            if (inputAvg > 5) {
                isUserSpeaking = true;
            }
        }

        if (isActive && analyserOut) {
            analyserOut.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            averageFreq = sum / dataArray.length;
        }

        // Target scale: Small (0.2) when idle, Large (1.0) when active
        const targetBaseScale = isActive ? 1.0 : 0.2;
        currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetBaseScale, 0.05);

        // Color logic
        const targetColor = new THREE.Color();
        if (!isActive) {
            targetColor.set("#555555"); // Idle Grey
        } else if (isUserSpeaking) {
            targetColor.set("#ffffff"); // User Speaking White
        } else {
            targetColor.set("#00ffff"); // AI Speaking/Listening Cyan
        }

        currentColor.current.lerp(targetColor, 0.1);

        // Update material color
        if (pointsRef.current.material instanceof THREE.PointsMaterial) {
            pointsRef.current.material.color.copy(currentColor.current);
        }

        const positions = pointsRef.current.geometry.attributes.position.array;

        // Animate particles
        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            const ox = originalPositions[ix];
            const oy = originalPositions[iy];
            const oz = originalPositions[iz];

            // Map particle index to frequency bin
            const freqIndex = i % dataArray.length;
            const freqValue = isActive ? dataArray[freqIndex] : 0;

            const displacementIntensity = isActive ? 0.5 : 0.05;
            const displacement = (freqValue / 255) * displacementIntensity;

            // Breathing effect when idle
            const breathing = Math.sin(time * 2 + i * 0.01) * 0.05;

            const particleScale = currentScale.current + displacement + (isActive ? 0 : breathing);

            positions[ix] = ox * particleScale;
            positions[iy] = oy * particleScale;
            positions[iz] = oz * particleScale;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                color="#555555"
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

const ParticleSphereVisualizer = ({
    isActive,
    analyserOut,
    analyserIn,
    isUserSpeaking = false,
    compact = false
}) => {
    const size = compact ? 'h-32' : 'h-full';

    return (
        <div className={`w-full ${size} relative bg-black/50 overflow-hidden rounded-2xl`}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <PerspectiveCamera makeDefault position={[0, 0, compact ? 10 : 8]} />
                <ambientLight intensity={0.5} />

                <ParticleSphere
                    isActive={isActive}
                    analyserOut={analyserOut}
                    analyserIn={analyserIn}
                    isUserSpeaking={isUserSpeaking}
                />

                <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>

            {/* Status indicator */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <div className={`inline-block px-4 py-1 rounded-full border ${isActive
                    ? isUserSpeaking
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-slate-500'
                    } backdrop-blur-md transition-all duration-300`}>
                    <span className="text-[10px] font-mono tracking-[0.2em] font-bold">
                        {isActive
                            ? isUserSpeaking
                                ? 'LISTENING'
                                : 'SPEAKING'
                            : 'IDLE'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ParticleSphereVisualizer;
