
/**
 * VisionEmotionManager.js
 * Bridges CameraService and EmotionDetectionService.
 * Uses a lightweight mock (or placeholder for face-api) to detect emotion from video frames.
 */

import cameraService from '../services/CameraService';
import { emotionDetector } from '../services/EmotionDetectionService';

export class VisionEmotionManager {
    constructor() {
        this.isMonitoring = false;
        this.lastEmotion = 'neutral';
    }

    async startMonitoring(callback) {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        const videoElement = document.createElement('video'); // Hidden video element
        await cameraService.initialize(videoElement);
        await cameraService.startCamera();

        cameraService.startCapturing((frame) => {
            // In a real production app, we would send 'frame.data' to a local model (e.g. face-api.js)
            // For now, we simulate detection to demonstrate the feedback loop.
            this.detectEmotionFromFrame(frame).then(emotion => {
                if (emotion !== this.lastEmotion) {
                    this.lastEmotion = emotion;
                    callback(emotion);
                }
            });
        }, 3000); // Check every 3 seconds
    }

    stopMonitoring() {
        this.isMonitoring = false;
        cameraService.stopCapturing();
        cameraService.stopCamera();
    }

    // Mock Vision Inference
    async detectEmotionFromFrame(frame) {
        // Randomly detect emotions for demo purposes
        // In reality: await faceApi.detectExpressions(frame)
        const emotions = ['happy', 'neutral', 'surprised', 'neutral', 'neutral', 'happy'];
        return emotions[Math.floor(Math.random() * emotions.length)];
    }
}

export const visionManager = new VisionEmotionManager();
