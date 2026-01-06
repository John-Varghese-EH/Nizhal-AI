import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TouchRegion - Defines a clickable area on the avatar for reactions
 */
const TouchRegion = ({
    id,
    position,
    size = 40,
    color = 'rgba(255, 100, 150, 0.3)',
    onTouch,
    onPat,
    debug = false
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [patProgress, setPatProgress] = useState(0);
    const lastPositions = useRef([]);
    const patTimeout = useRef(null);

    // Detect circular "pat" motion
    const handleMouseMove = useCallback((e) => {
        if (!isHovered) return;

        const now = Date.now();
        const pos = { x: e.clientX, y: e.clientY, time: now };

        // Keep last 10 positions
        lastPositions.current.push(pos);
        if (lastPositions.current.length > 10) {
            lastPositions.current.shift();
        }

        // Calculate if motion is circular
        if (lastPositions.current.length >= 5) {
            const positions = lastPositions.current;
            let totalAngleChange = 0;

            for (let i = 2; i < positions.length; i++) {
                const v1 = {
                    x: positions[i - 1].x - positions[i - 2].x,
                    y: positions[i - 1].y - positions[i - 2].y
                };
                const v2 = {
                    x: positions[i].x - positions[i - 1].x,
                    y: positions[i].y - positions[i - 1].y
                };

                const cross = v1.x * v2.y - v1.y * v2.x;
                const dot = v1.x * v2.x + v1.y * v2.y;
                const angle = Math.atan2(cross, dot);
                totalAngleChange += angle;
            }

            // If accumulated angle > 360 degrees, trigger pat
            const progress = Math.min(1, Math.abs(totalAngleChange) / (Math.PI * 2));
            setPatProgress(progress);

            if (progress >= 1) {
                onPat?.();
                lastPositions.current = [];
                setPatProgress(0);
            }
        }

        // Reset pat detection after inactivity
        clearTimeout(patTimeout.current);
        patTimeout.current = setTimeout(() => {
            lastPositions.current = [];
            setPatProgress(0);
        }, 500);
    }, [isHovered, onPat]);

    useEffect(() => {
        if (isHovered) {
            window.addEventListener('mousemove', handleMouseMove);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(patTimeout.current);
        };
    }, [isHovered, handleMouseMove]);

    return (
        <motion.div
            className="absolute cursor-pointer"
            style={{
                left: position.x - size / 2,
                top: position.y - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: debug ? color : 'transparent',
                border: debug ? '2px dashed rgba(255,255,255,0.5)' : 'none'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTouch?.()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setPatProgress(0);
                lastPositions.current = [];
            }}
        >
            {/* Pat progress indicator */}
            {patProgress > 0 && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-pink-400"
                    style={{
                        clipPath: `inset(${(1 - patProgress) * 100}% 0 0 0)`
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}

            {debug && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                    {id}
                </span>
            )}
        </motion.div>
    );
};

/**
 * TouchRegionSystem - Manages all touch regions on an avatar
 */
const TouchRegionSystem = ({
    regions,
    onRegionTouch,
    onRegionPat,
    voicePacks = {},
    enabled = true,
    debug = false,
    containerRef
}) => {
    const [activeReaction, setActiveReaction] = useState(null);
    const cooldowns = useRef({});
    const audioRef = useRef(new Audio());

    // Default touch regions for humanoid avatars
    const defaultRegions = useMemo(() => [
        { id: 'head', position: { x: 50, y: 15 }, size: 50, color: 'rgba(255, 200, 100, 0.3)' },
        { id: 'face', position: { x: 50, y: 25 }, size: 40, color: 'rgba(255, 150, 200, 0.3)' },
        { id: 'leftHand', position: { x: 20, y: 60 }, size: 30, color: 'rgba(100, 200, 255, 0.3)' },
        { id: 'rightHand', position: { x: 80, y: 60 }, size: 30, color: 'rgba(100, 200, 255, 0.3)' },
        { id: 'body', position: { x: 50, y: 50 }, size: 60, color: 'rgba(200, 100, 255, 0.3)' }
    ], []);

    const activeRegions = regions || defaultRegions;

    // Play voice reaction
    const playVoiceReaction = useCallback((regionId, isPat = false) => {
        const packType = isPat ? `${regionId}_pat` : regionId;
        const clips = voicePacks[packType] || voicePacks[regionId] || [];

        if (clips.length === 0) return;

        // Check cooldown
        const now = Date.now();
        if (cooldowns.current[regionId] && now - cooldowns.current[regionId] < 1000) {
            return;
        }
        cooldowns.current[regionId] = now;

        // Play random clip
        const randomClip = clips[Math.floor(Math.random() * clips.length)];
        audioRef.current.src = randomClip;
        audioRef.current.play().catch(e => console.warn('Audio play failed:', e));

        // Show reaction
        setActiveReaction({ regionId, isPat, timestamp: now });
        setTimeout(() => setActiveReaction(null), 2000);
    }, [voicePacks]);

    const handleTouch = useCallback((regionId) => {
        onRegionTouch?.(regionId);
        playVoiceReaction(regionId, false);
    }, [onRegionTouch, playVoiceReaction]);

    const handlePat = useCallback((regionId) => {
        onRegionPat?.(regionId);
        playVoiceReaction(regionId, true);
    }, [onRegionPat, playVoiceReaction]);

    if (!enabled) return null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            {activeRegions.map((region) => (
                <TouchRegion
                    key={region.id}
                    id={region.id}
                    position={{
                        x: (region.position.x / 100) * (containerRef?.current?.offsetWidth || 200),
                        y: (region.position.y / 100) * (containerRef?.current?.offsetHeight || 300)
                    }}
                    size={region.size}
                    color={region.color}
                    onTouch={() => handleTouch(region.id)}
                    onPat={() => handlePat(region.id)}
                    debug={debug}
                />
            ))}

            {/* Reaction bubble */}
            <AnimatePresence>
                {activeReaction && (
                    <motion.div
                        className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/90 rounded-full shadow-lg"
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    >
                        <span className="text-sm font-medium text-gray-800">
                            {activeReaction.isPat ? '❤️ *happy*' : '✨ *touched*'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export { TouchRegion, TouchRegionSystem };
export default TouchRegionSystem;
