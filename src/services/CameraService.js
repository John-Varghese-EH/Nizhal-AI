/**
 * CameraService - Handles webcam capture and image processing
 * Used for AI vision features in FullDashboard
 */

class CameraService {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.canvas = null;
        this.ctx = null;
        this.isCapturing = false;
        this.captureInterval = null;
        this.frameRate = 1000; // 1 frame per second for AI processing
        this.onFrameCallback = null;
        this.privacyMode = false;
    }

    /**
     * Initialize camera service with a video element
     */
    async initialize(videoElement) {
        this.videoElement = videoElement;

        // Create offscreen canvas for frame capture
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        return true;
    }

    /**
     * Start camera stream
     */
    async startCamera(constraints = {}) {
        if (this.privacyMode) {
            console.warn('[CameraService] Privacy mode enabled, camera blocked');
            return false;
        }

        try {
            const defaultConstraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    ...constraints.video
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);

            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                await this.videoElement.play();

                // Set canvas size to match video
                this.canvas.width = this.videoElement.videoWidth || 640;
                this.canvas.height = this.videoElement.videoHeight || 480;
            }

            console.log('[CameraService] Camera started');
            return true;
        } catch (error) {
            console.error('[CameraService] Failed to start camera:', error);
            return false;
        }
    }

    /**
     * Stop camera stream
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.stopCapturing();
        console.log('[CameraService] Camera stopped');
    }

    /**
     * Start continuous frame capturing for AI processing
     */
    startCapturing(callback, frameRate = 1000) {
        if (this.privacyMode) {
            console.warn('[CameraService] Privacy mode enabled, capture blocked');
            return false;
        }

        this.onFrameCallback = callback;
        this.frameRate = frameRate;
        this.isCapturing = true;

        this.captureInterval = setInterval(() => {
            if (this.isCapturing && this.stream && this.onFrameCallback) {
                const frame = this.captureFrame();
                if (frame) {
                    this.onFrameCallback(frame);
                }
            }
        }, this.frameRate);

        console.log(`[CameraService] Started capturing at ${1000 / frameRate} FPS`);
        return true;
    }

    /**
     * Stop continuous frame capturing
     */
    stopCapturing() {
        this.isCapturing = false;
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
        this.onFrameCallback = null;
    }

    /**
     * Capture a single frame as base64 JPEG
     */
    captureFrame(format = 'jpeg', quality = 0.7) {
        if (!this.videoElement || !this.stream) {
            return null;
        }

        try {
            // Draw current video frame to canvas
            this.ctx.drawImage(
                this.videoElement,
                0, 0,
                this.canvas.width,
                this.canvas.height
            );

            // Convert to base64
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = this.canvas.toDataURL(mimeType, quality);

            // Return base64 data without the prefix for API compatibility
            const base64Data = dataUrl.split(',')[1];

            return {
                data: base64Data,
                mimeType,
                width: this.canvas.width,
                height: this.canvas.height,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('[CameraService] Frame capture failed:', error);
            return null;
        }
    }

    /**
     * Get available cameras
     */
    async getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('[CameraService] Failed to enumerate devices:', error);
            return [];
        }
    }

    /**
     * Switch to a different camera
     */
    async switchCamera(deviceId) {
        this.stopCamera();
        return this.startCamera({
            video: { deviceId: { exact: deviceId } }
        });
    }

    /**
     * Set privacy mode (blocks all camera access)
     */
    setPrivacyMode(enabled) {
        this.privacyMode = enabled;
        if (enabled && this.stream) {
            this.stopCamera();
            console.log('[CameraService] Privacy mode enabled, camera stopped');
        }
    }

    /**
     * Check if camera is active
     */
    isActive() {
        return this.stream !== null && this.stream.active;
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.stopCamera();
        this.canvas = null;
        this.ctx = null;
        this.videoElement = null;
    }
}

// Singleton instance
const cameraService = new CameraService();
export default cameraService;
