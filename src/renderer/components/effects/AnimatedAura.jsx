import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedAura - Multi-colored floating blobs for ambient background.
 * Uses hardware acceleration for smooth performance.
 */
const AnimatedAura = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Cyan/Blue Aura */}
            <motion.div
                animate={{
                    x: ['-10%', '10%', '-10%'],
                    y: ['-10%', '20%', '-10%'],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-0 -left-1/4 w-[80%] h-[80%] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-screen"
            />

            {/* Purple/Magenta Aura */}
            <motion.div
                animate={{
                    x: ['20%', '-10%', '20%'],
                    y: ['10%', '-20%', '10%'],
                    scale: [1.2, 1, 1.2],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute bottom-0 -right-1/4 w-[80%] h-[80%] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen"
            />

            {/* Center Pulsing Aura */}
            <motion.div
                animate={{
                    opacity: [0.1, 0.3, 0.1],
                    scale: [0.8, 1.1, 0.8],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-blue-600/5 blur-[150px] rounded-full"
            />
        </div>
    );
};

export default AnimatedAura;
