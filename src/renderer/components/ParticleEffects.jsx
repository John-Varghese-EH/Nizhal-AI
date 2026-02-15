import React, { useCallback, useImperativeHandle, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ParticleEffects - Visual Feedback System
 * 
 * Supports:
 * - Hearts (Love/GF mode)
 * - Sparks (Excitement/BF mode)
 * - Orbs (Thought/Data)
 */
const ParticleEffects = React.forwardRef((props, ref) => {
    const [particles, setParticles] = useState([]);

    useImperativeHandle(ref, () => ({
        burst: (type, viewportX, viewportY, count = 10) => {
            // Default center if no coords
            const startX = viewportX || window.innerWidth / 2;
            const startY = viewportY || window.innerHeight / 2;

            // Create all particles at once instead of one by one to avoid multiple re-renders
            const newParticles = [];
            for (let i = 0; i < count; i++) {
                const id = Date.now() + Math.random() + i;
                newParticles.push({
                    id,
                    type,
                    x: startX,
                    y: startY,
                    velocity: {
                        x: (Math.random() - 0.5) * 10,
                        y: -Math.random() * 10 - 5
                    }
                });

                // Auto cleanup for each particle
                setTimeout(() => {
                    setParticles(prev => prev.filter(p => p.id !== id));
                }, 2000);
            }

            // Single state update for all particles
            setParticles(prev => [...prev, ...newParticles]);
        }
    }));

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            <AnimatePresence>
                {particles.map(p => (
                    <Particle key={p.id} {...p} />
                ))}
            </AnimatePresence>
        </div>
    );
});

const Particle = ({ type, x, y }) => {
    // Variations based on type
    const variants = {
        heart: { icon: '💕', color: '#ff69b4' },
        spark: { icon: '✨', color: '#fbbf24' },
        note: { icon: '🎵', color: '#60a5fa' },
        angry: { icon: '💢', color: '#ef4444' }
    };

    const config = variants[type] || variants.spark;

    // Random trajectory
    const endX = (Math.random() - 0.5) * 200;
    const endY = -100 - Math.random() * 200;
    const rotate = Math.random() * 360;

    return (
        <motion.div
            initial={{
                opacity: 1,
                x: x - window.innerWidth / 2, // relative to center for simplicity or absolute?
                y: y - window.innerHeight / 2,
                scale: 0
            }}
            // Actually, we are using absolute positioning in a full screen div, 
            // so let's stick to absolute coordinates.
            style={{
                position: 'absolute',
                left: x,
                top: y,
                fontSize: '1.5rem',
                color: config.color
            }}
            animate={{
                opacity: 0,
                x: x + endX,
                y: y + endY,
                scale: [0, 1.5, 0],
                rotate: rotate
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
        >
            {config.icon}
        </motion.div>
    );
};

export default ParticleEffects;
