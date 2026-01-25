/**
 * ObjectDetectionService - COCO-SSD Object Detection
 * 
 * Detects objects in camera feed using TensorFlow.js COCO-SSD model
 * Returns bounding boxes and class labels for detected objects
 */

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

class ObjectDetectionService {
    constructor() {
        this.model = null;
        this.isLoading = false;
        this.isDetecting = false;
        this.detectionInterval = null;
    }

    /**
     * Load the COCO-SSD model
     * @returns {Promise<boolean>} - Success status
     */
    async loadModel() {
        if (this.model) {
            console.log('[ObjectDetection] Model already loaded');
            return true;
        }

        if (this.isLoading) {
            console.log('[ObjectDetection] Model is currently loading');
            return false;
        }

        try {
            this.isLoading = true;
            console.log('[ObjectDetection] Loading COCO-SSD model...');

            this.model = await cocoSsd.load();

            console.log('[ObjectDetection] ✓ Model loaded successfully');
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('[ObjectDetection] Failed to load model:', error);
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Detect objects in a video element or image
     * @param {HTMLVideoElement|HTMLImageElement} input - Video or image element
     * @returns {Promise<Array>} - Array of detections with {class, score, bbox}
     */
    async detect(input) {
        if (!this.model) {
            console.warn('[ObjectDetection] Model not loaded. Call loadModel() first.');
            return [];
        }

        try {
            const predictions = await this.model.detect(input);

            // Filter low-confidence predictions (< 50%)
            const filtered = predictions.filter(pred => pred.score >= 0.5);

            return filtered.map(pred => ({
                class: pred.class,
                confidence: Math.round(pred.score * 100),
                bbox: pred.bbox // [x, y, width, height]
            }));
        } catch (error) {
            console.error('[ObjectDetection] Detection error:', error);
            return [];
        }
    }

    /**
     * Start continuous detection on video element
     * @param {HTMLVideoElement} videoElement 
     * @param {Function} callback - Called with detection results
     * @param {number} intervalMs - Detection interval in ms (default 500)
     */
    async startDetection(videoElement, callback, intervalMs = 500) {
        if (!this.model) {
            const loaded = await this.loadModel();
            if (!loaded) {
                console.error('[ObjectDetection] Cannot start detection - model failed to load');
                return false;
            }
        }

        if (this.isDetecting) {
            console.warn('[ObjectDetection] Detection already running');
            return false;
        }

        this.isDetecting = true;
        console.log('[ObjectDetection] Starting continuous detection');

        const detectFrame = async () => {
            if (!this.isDetecting) return;

            try {
                const detections = await this.detect(videoElement);
                callback(detections);
            } catch (error) {
                console.error('[ObjectDetection] Frame detection error:', error);
            }
        };

        // Run first detection immediately
        detectFrame();

        // Then continue at interval
        this.detectionInterval = setInterval(detectFrame, intervalMs);
        return true;
    }

    /**
     * Stop continuous detection
     */
    stopDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        this.isDetecting = false;
        console.log('[ObjectDetection] Detection stopped');
    }

    /**
     * Cleanup and dispose model
     */
    dispose() {
        this.stopDetection();
        if (this.model) {
            this.model.dispose();
            this.model = null;
            console.log('[ObjectDetection] Model disposed');
        }
    }

    /**
     * Get model status
     */
    getStatus() {
        return {
            modelLoaded: !!this.model,
            isLoading: this.isLoading,
            isDetecting: this.isDetecting
        };
    }
}

// Export singleton
export const objectDetectionService = new ObjectDetectionService();
export default ObjectDetectionService;
