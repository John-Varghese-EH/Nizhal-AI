import { useCallback, useState, useEffect } from 'react';

/**
 * useFileDrop - Handle file drag-and-drop onto avatar
 * 
 * Features:
 * - Detects file drops on the window
 * - Returns file info for AI processing
 * - Visual feedback during drag
 */
export const useFileDrop = (onFileDrop) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && onFileDrop) {
            const fileInfo = files.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                path: file.path // Electron provides full path
            }));
            onFileDrop(fileInfo);
        }
    }, [onFileDrop]);

    useEffect(() => {
        const win = window;

        win.addEventListener('dragenter', handleDragEnter);
        win.addEventListener('dragleave', handleDragLeave);
        win.addEventListener('dragover', handleDragOver);
        win.addEventListener('drop', handleDrop);

        return () => {
            win.removeEventListener('dragenter', handleDragEnter);
            win.removeEventListener('dragleave', handleDragLeave);
            win.removeEventListener('dragover', handleDragOver);
            win.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    return { isDragging };
};

/**
 * getFileDescription - Generate AI-friendly file description
 */
export const getFileDescription = (fileInfo) => {
    const file = fileInfo[0];
    const sizeKB = Math.round(file.size / 1024);

    const typeMap = {
        'image/': '📷 Image',
        'video/': '🎬 Video',
        'audio/': '🎵 Audio',
        'text/': '📄 Text',
        'application/pdf': '📑 PDF',
        'application/json': '📋 JSON',
        'application/zip': '📦 Archive'
    };

    let fileType = '📁 File';
    for (const [key, value] of Object.entries(typeMap)) {
        if (file.type.startsWith(key)) {
            fileType = value;
            break;
        }
    }

    return `${fileType}: "${file.name}" (${sizeKB} KB)`;
};
