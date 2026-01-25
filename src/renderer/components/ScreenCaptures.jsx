import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Monitor, Trash2, Download, Eye, X } from 'lucide-react';
import { screenCaptureService } from '../../services/ScreenCaptureService';

/**
 * ScreenCaptures - Manage screen captures
 */
const ScreenCaptures = () => {
    const [captures, setCaptures] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        loadCaptures();
    }, []);

    const loadCaptures = async () => {
        await screenCaptureService.initialize();
        setCaptures(screenCaptureService.getCaptures());
    };

    const handleCaptureScreen = async () => {
        setIsCapturing(true);
        try {
            await screenCaptureService.captureScreen();
            loadCaptures();
        } catch (error) {
            console.error('Screen capture failed:', error);
            alert('Screen capture requires permission');
        }
        setIsCapturing(false);
    };

    const handleCaptureWindow = async () => {
        setIsCapturing(true);
        try {
            await screenCaptureService.captureWindow();
            loadCaptures();
        } catch (error) {
            console.error('Window capture failed:', error);
        }
        setIsCapturing(false);
    };

    const handleDelete = async (id) => {
        await screenCaptureService.deleteCapture(id);
        loadCaptures();
    };

    const handleDownload = (capture) => {
        const link = document.createElement('a');
        link.href = capture.dataUrl;
        link.download = `capture_${capture.id}.png`;
        link.click();
    };

    return (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-white/0 border border-cyan-500/20">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                <span className="text-cyan-400">📸</span> Screen Captures
            </h3>

            {/* Capture Buttons */}
            <div className="flex gap-3 mb-6">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCaptureScreen}
                    disabled={isCapturing}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                >
                    <Monitor size={16} />
                    Capture Screen
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCaptureWindow}
                    disabled={isCapturing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/70 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                    <Camera size={16} />
                    Capture Window
                </motion.button>
            </div>

            {/* Captures Grid */}
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                <AnimatePresence>
                    {captures.map(capture => (
                        <motion.div
                            key={capture.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video"
                        >
                            <img
                                src={capture.dataUrl}
                                alt={`Capture ${capture.id}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPreviewImage(capture)}
                                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                >
                                    <Eye size={14} className="text-white" />
                                </button>
                                <button
                                    onClick={() => handleDownload(capture)}
                                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                                >
                                    <Download size={14} className="text-white" />
                                </button>
                                <button
                                    onClick={() => handleDelete(capture.id)}
                                    className="p-2 bg-red-500/40 rounded-lg hover:bg-red-500/60 transition-colors"
                                >
                                    <Trash2 size={14} className="text-white" />
                                </button>
                            </div>

                            <div className="absolute bottom-1 left-1 text-[8px] text-white/50 bg-black/40 px-1 rounded">
                                {capture.type}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {captures.length === 0 && (
                <div className="py-8 text-center text-white/30">
                    <Camera size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No captures yet</p>
                </div>
            )}

            {/* Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="max-w-4xl max-h-[80vh] relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <img
                                src={previewImage.dataUrl}
                                alt="Preview"
                                className="max-w-full max-h-[80vh] rounded-xl"
                            />
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                            >
                                <X size={20} className="text-white" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScreenCaptures;
