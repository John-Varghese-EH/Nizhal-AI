/**
 * VisionEmotionManager.js
 * Lightweight Visual Context Manager for Desktop Companion.
 * Uses native Canvas / WebRTC frame captures without heavy TensorFlow.js bloat.
 */

import cameraService from './CameraService.js';

export class VisionEmotionManager {
    constructor() {
        this.isMonitoring = false;
        this.isLoading = false;
        this.contextString = "";
        this.lastFrameDataUrl = null;
    }

    async loadModel() {
        // No heavy client-side ML bundle required
        return Promise.resolve();
    }

    async startMonitoring(callback) {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        try {
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

            console.log('[VisionManager] Started lightweight camera monitoring');
            if (callback) callback([]);
        } catch (err) {
            console.error('[VisionManager] Camera monitoring failed:', err);
            this.isMonitoring = false;
        }
    }

    /**
     * Capture a single lightweight snapshot for multimodal LLMs
     */
    captureSnapshot() {
        if (!cameraService.videoElement || !this.isMonitoring) return null;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(cameraService.videoElement, 0, 0, 320, 240);
            this.lastFrameDataUrl = canvas.toDataURL('image/jpeg', 0.6);
            return this.lastFrameDataUrl;
        } catch (e) {
            console.warn('[VisionManager] Snapshot capture failed:', e);
            return null;
        }
    }

    stopMonitoring() {
        this.isMonitoring = false;
        cameraService.stopCamera();
        console.log('[VisionManager] Stopped monitoring');
    }

    getVisualContext() {
        if (!this.contextString) return null;
        return `[Visual Context: ${this.contextString}]`;
    }
}

export const visionManager = new VisionEmotionManager();
export default visionManager;
