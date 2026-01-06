import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const HUDRing = ({ radius, thickness, color, rotationSpeed, segments = 64, dashArray = null }) => {
    const ringRef = useRef();

    useFrame((state, delta) => {
        if (ringRef.current) {
            ringRef.current.rotation.z += rotationSpeed * delta;
        }
    });

    const geometry = useMemo(() => {
        const geo = new THREE.RingGeometry(radius - thickness, radius, segments);
        return geo;
    }, [radius, thickness, segments]);

    return (
        <mesh ref={ringRef} geometry={geometry}>
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

const DataArc = ({ radius, startAngle, endAngle, color, pulse }) => {
    const arcRef = useRef();

    useFrame((state) => {
        if (arcRef.current && pulse) {
            arcRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
        }
    });

    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const innerRadius = radius - 0.05;
        const outerRadius = radius;

        shape.moveTo(
            Math.cos(startAngle) * innerRadius,
            Math.sin(startAngle) * innerRadius
        );

        const arcPoints = 20;
        for (let i = 0; i <= arcPoints; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / arcPoints);
            shape.lineTo(
                Math.cos(angle) * outerRadius,
                Math.sin(angle) * outerRadius
            );
        }

        for (let i = arcPoints; i >= 0; i--) {
            const angle = startAngle + (endAngle - startAngle) * (i / arcPoints);
            shape.lineTo(
                Math.cos(angle) * innerRadius,
                Math.sin(angle) * innerRadius
            );
        }

        return new THREE.ShapeGeometry(shape);
    }, [radius, startAngle, endAngle]);

    return (
        <mesh ref={arcRef} geometry={geometry}>
            <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
    );
};

const HUDText = ({ text, position, size = 0.15, color = '#00d4ff' }) => {
    return null;
};

const CoreIndicator = ({ affection = 50, mood }) => {
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

    const color = moodColors[mood] || moodColors.neutral;

    useFrame((state) => {
        if (coreRef.current) {
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            coreRef.current.scale.set(scale, scale, 1);
        }
        if (glowRef.current) {
            glowRef.current.material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        }
    });

    return (
        <group>
            <mesh ref={glowRef}>
                <circleGeometry args={[0.4, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>
            <mesh ref={coreRef}>
                <circleGeometry args={[0.2, 32]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    );
};

const HUDScene = ({ mood, affection, isActive }) => {
    const { size } = useThree();

    return (
        <group>
            <HUDRing radius={1.5} thickness={0.02} color="#00d4ff" rotationSpeed={0.3} />
            <HUDRing radius={1.3} thickness={0.03} color="#00d4ff" rotationSpeed={-0.2} />
            <HUDRing radius={1.1} thickness={0.02} color="#ff6b35" rotationSpeed={0.4} />

            <DataArc radius={1.4} startAngle={0} endAngle={Math.PI * (affection / 100) * 2} color="#00d4ff" pulse />
            <DataArc radius={1.2} startAngle={Math.PI} endAngle={Math.PI * 1.5} color="#ff6b35" pulse />

            <CoreIndicator affection={affection} mood={mood} />

            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[
                    Math.cos(i * Math.PI / 2) * 0.9,
                    Math.sin(i * Math.PI / 2) * 0.9,
                    0
                ]}>
                    <circleGeometry args={[0.03, 8]} />
                    <meshBasicMaterial color="#00d4ff" />
                </mesh>
            ))}
        </group>
    );
};

const JarvisHUD = ({ mood, affection = 50, isActive }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 0.8 : 0.4 }}
            className="absolute inset-0 pointer-events-none"
        >
            <Canvas
                camera={{ position: [0, 0, 3], fov: 50 }}
                style={{ background: 'transparent' }}
                gl={{ alpha: true, antialias: true }}
            >
                <ambientLight intensity={0.5} />
                <HUDScene mood={mood} affection={affection} isActive={isActive} />
            </Canvas>

            <div className="absolute bottom-20 left-4 right-4 pointer-events-none">
                <div className="flex justify-between text-xs font-mono text-cyan-400/60">
                    <span>SYS: ONLINE</span>
                    <span>AFFECTION: {affection}%</span>
                </div>
            </div>
        </motion.div>
    );
};

export default JarvisHUD;
