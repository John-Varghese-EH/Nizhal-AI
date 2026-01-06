import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const FloatingCompanion = ({
    children,
    defaultPosition = { x: 50, y: 50 },
    snapToEdges = true,
    boundaries = true,
    onPositionChange
}) => {
    const [position, setPosition] = useState(defaultPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const containerRef = useRef(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const elementStartPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e) => {
        if (e.target.closest('.no-drag')) return;

        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        elementStartPos.current = { ...position };

        e.preventDefault();
    }, [position]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        let newX = elementStartPos.current.x + deltaX;
        let newY = elementStartPos.current.y + deltaY;

        if (boundaries && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
            newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
        }

        setPosition({ x: newX, y: newY });
    }, [isDragging, boundaries]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);

        if (snapToEdges && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const centerX = position.x + rect.width / 2;
            const centerY = position.y + rect.height / 2;

            let snapX = position.x;
            let snapY = position.y;

            const edgeThreshold = 100;

            if (centerX < edgeThreshold) {
                snapX = 10;
            } else if (centerX > viewportWidth - edgeThreshold) {
                snapX = viewportWidth - rect.width - 10;
            }

            if (centerY < edgeThreshold) {
                snapY = 10;
            } else if (centerY > viewportHeight - edgeThreshold) {
                snapY = viewportHeight - rect.height - 10;
            }

            setPosition({ x: snapX, y: snapY });
        }

        onPositionChange?.(position);
    }, [isDragging, snapToEdges, position, onPositionChange]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const handleTouchStart = useCallback((e) => {
        if (e.target.closest('.no-drag')) return;

        const touch = e.touches[0];
        setIsDragging(true);
        dragStartPos.current = { x: touch.clientX, y: touch.clientY };
        elementStartPos.current = { ...position };
    }, [position]);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStartPos.current.x;
        const deltaY = touch.clientY - dragStartPos.current.y;

        let newX = elementStartPos.current.x + deltaX;
        let newY = elementStartPos.current.y + deltaY;

        if (boundaries && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
            newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
        }

        setPosition({ x: newX, y: newY });
    }, [isDragging, boundaries]);

    const handleTouchEnd = useCallback(() => {
        handleMouseUp();
    }, [handleMouseUp]);

    const toggleMinimize = (e) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    return (
        <motion.div
            ref={containerRef}
            className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
                left: position.x,
                top: position.y,
                touchAction: 'none'
            }}
            animate={{
                scale: isMinimized ? 0.5 : 1,
                opacity: isMinimized ? 0.7 : 1
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <motion.button
                className="no-drag absolute -top-2 -right-2 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMinimize}
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMinimized ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    )}
                </svg>
            </motion.button>

            <div className={isMinimized ? 'pointer-events-none' : ''}>
                {children}
            </div>

            {isDragging && (
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-white/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
        </motion.div>
    );
};

export default FloatingCompanion;
