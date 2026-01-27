
/**
 * VisionEmotionManager.js
 * Bridges CameraService and EmotionDetectionService.
 * Uses a lightweight mock (or placeholder for face-api) to detect emotion from video frames.
 */

import cameraService from './CameraService.js';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export class VisionEmotionManager {
    constructor() {
        this.isMonitoring = false;
        this.lastDetections = [];
        this.model = null;
        this.isLoading = false;
        this.detectionInterval = null;
        this.contextString = "";
    }

    async loadModel() {
        if (this.model || this.isLoading) return;
        this.isLoading = true;

        try {
            console.log('[VisionManager] Loading COCO-SSD model...');
            await tf.ready();
            this.model = await cocoSsd.load({
                base: 'lite_mobilenet_v2' // Faster, lighter
            });
            console.log('[VisionManager] COCO-SSD loaded');
        } catch (error) {
            console.error('[VisionManager] Failed to load model:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async startMonitoring(callback) {
        if (this.isMonitoring) return;

        if (!this.model) {
            await this.loadModel();
        }

        if (!this.model) {
            console.error('[VisionManager] Cannot start: Model not loaded');
            return;
        }

        this.isMonitoring = true;

        // Initialize camera via CameraService
        // We use a hidden video element for the model input
        const videoElement = document.createElement('video');
        videoElement.width = 640;
        videoElement.height = 480;
        videoElement.autoplay = true;

        await cameraService.initialize(videoElement);
        const started = await cameraService.startCamera();

        if (!started) {
            this.isMonitoring = false;
            return;
        }

        console.log('[VisionManager] Started monitoring');

        // Loop for detection
        const detectLoop = async () => {
            if (!this.isMonitoring || !cameraService.videoElement) return;

            try {
                // Ensure video is ready
                if (cameraService.videoElement.readyState === 4) {
                    const predictions = await this.model.detect(cameraService.videoElement);
                    this.processDetections(predictions);

                    if (callback) {
                        callback(predictions);
                    }
                }
            } catch (error) {
                console.warn('[VisionManager] Detection error:', error);
            }

            // Schedule next frame (throttle to ~5-10 FPS to save CPU)
            if (this.isMonitoring) {
                requestAnimationFrame(() => setTimeout(detectLoop, 200));
            }
        };

        detectLoop();
    }

    processDetections(predictions) {
        this.lastDetections = predictions;

        // Build context string
        if (predictions.length > 0) {
            const counts = {};
            predictions.forEach(p => {
                if (p.score > 0.6) { // Confidence threshold
                    counts[p.class] = (counts[p.class] || 0) + 1;
                }
            });

            this.contextString = Object.entries(counts)
                .map(([cls, count]) => count > 1 ? `${count} ${cls}s` : cls)
                .join(', ');
        } else {
            this.contextString = "";
        }
    }

    stopMonitoring() {
        this.isMonitoring = false;
        cameraService.stopCamera();
        console.log('[VisionManager] Stopped monitoring');
    }

    /**
     * Get current visual context for LLM
     */
    getVisualContext() {
        if (!this.contextString) return null;
        return `[Visual Context: I see ${this.contextString}]`;
    }
}

export const visionManager = new VisionEmotionManager();
