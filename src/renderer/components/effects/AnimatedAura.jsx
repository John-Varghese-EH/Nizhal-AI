import React from 'react';

/**
 * AnimatedAura - Pure CSS ambient background blobs.
 * Uses GPU-accelerated CSS animations instead of framer-motion
 * to eliminate JavaScript re-render loops (~3 RAF callbacks removed).
 */
const AnimatedAura = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Cyan/Blue Aura */}
            <div className="aura-blob aura-cyan" />
            {/* Purple/Magenta Aura */}
            <div className="aura-blob aura-purple" />
            {/* Center Pulsing Aura */}
            <div className="aura-blob aura-center" />
        </div>
    );
};

export default AnimatedAura;
