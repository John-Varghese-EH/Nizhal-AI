import PermissionService from './PermissionService';

export class CameraService {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.canvas = null;
        this.ctx = null;
        this.isCapturing = false;
        this.captureInterval = null;
        this.frameRate = 1000;
        this.onFrameCallback = null;
        this.privacyMode = false;

        this.status = 'uninitialized';
        this.lastFrameTime = 0;
        this.watchdogInterval = null;
        this.health = {
            status: 'uninitialized',
            streamActive: false,
            lastError: null,
            consecutiveFailures: 0
        };
    }

    /**
     * Initializes components defensively. Protects DOM elements from breaking in headless/testing modes.
     */
    async init(videoElement) {
        if (this.status === 'initializing' || this.status === 'ready') {
            return true;
        }

        this.status = 'initializing';
        this.health.status = 'initializing';
        this.health.lastError = null;

        try {
            if (!videoElement) {
                throw new Error('A valid HTMLVideoElement is required for initialization');
            }

            this.videoElement = videoElement;

            if (typeof document !== 'undefined') {
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
            }

            this.status = 'ready';
            this.health.status = 'ready';

            this.startWatchdog();
            console.log('[CameraService] Service initialized successfully');
            return true;
        } catch (error) {
            this.status = 'failed';
            this.health.status = 'failed';
            this.health.lastError = error.message;
            console.error('[CameraService] Initialization failure:', error);

            if (typeof document !== 'undefined') {
                this.canvas = document.createElement('canvas');
                this.canvas.width = 640;
                this.canvas.height = 480;
                this.ctx = this.canvas.getContext('2d');
            }
            return false;
        }
    }

    /**
     * Compatibility bridge for legacy callers.
     */
    async initialize(videoElement) {
        return this.init(videoElement);
    }

    /**
     * Returns a snapshot of active resource health parameters.
     */
    getState() {
        this.health.streamActive = this.isActive();
        return {
            status: this.status,
            health: { ...this.health },
            isCapturing: this.isCapturing,
            privacyMode: this.privacyMode,
            lastFrameTime: this.lastFrameTime
        };
    }

    /**
     * Hard-resets service to known good configurations.
     */
    async reset() {
        console.log('[CameraService] Restoring service state...');

        try {
            this.stopCamera();
            this.stopCapturing();
            this.stopWatchdog();

            this.canvas = null;
            this.ctx = null;
            this.status = 'uninitialized';
            this.health = {
                status: 'uninitialized',
                streamActive: false,
                lastError: null,
                consecutiveFailures: this.health.consecutiveFailures
            };

            if (this.videoElement) {
                await this.init(this.videoElement);
            }

            return true;
        } catch (error) {
            console.error('[CameraService] Reset failed:', error);
            this.status = 'failed';
            this.health.status = 'failed';
            this.health.lastError = `Reset error: ${error.message}`;
            return false;
        }
    }

    startWatchdog() {
        this.stopWatchdog();
        this.watchdogInterval = setInterval(() => {
            this.watchdog();
        }, 10000);
    }

    stopWatchdog() {
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
    }

    /**
     * Watchdog interval analyzing for inactive capture updates.
     */
    watchdog() {
        if (this.isCapturing && this.isActive()) {
            const idleTime = Date.now() - this.lastFrameTime;

            if (this.lastFrameTime > 0 && idleTime > 15000) {
                console.warn(`[CameraService] Watchdog warning - no frame updates for ${idleTime / 1000}s. Restoring.`);
                this.health.consecutiveFailures++;
                this.health.lastError = 'Watchdog timeout - capture frame loop unresponsive';
                this.recoverService();
            }
        }
    }

    /**
     * Recovery trigger.
     */
    async recoverService() {
        const savedCallback = this.onFrameCallback;
        const savedFrameRate = this.frameRate;
        const savedVideo = this.videoElement;

        try {
            await this.reset();
            if (savedVideo) {
                await this.startCamera();
                if (savedCallback) {
                    this.startCapturing(savedCallback, savedFrameRate);
                }
            }
            console.log('[CameraService] Auto recovery complete');
        } catch (err) {
            console.error('[CameraService] Recovery sequence failed:', err);
        }
    }

    /**
     * Configures user media capture configurations and links to local streams.
     */
    async startCamera(constraints = {}) {
        if (this.privacyMode) {
            console.warn('[CameraService] Privacy mode is enabled. Webcam blocked.');
            return false;
        }

        // Pre-flight permission check
        const permStatus = await PermissionService.check();
        if (permStatus.camera === 'prompt') {
            const result = await PermissionService.request('camera');
            if (result !== 'granted') {
                console.warn('[CameraService] Camera permission prompt was not granted.');
                return false;
            }
        } else if (permStatus.camera === 'denied') {
            console.warn('[CameraService] Camera permission is denied in OS/Browser settings.');
            window.dispatchEvent(new CustomEvent('nizhal-permission-denied', {
                detail: { type: 'camera', message: 'Camera access is blocked in System Settings.' }
            }));
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

                if (this.canvas) {
                    this.canvas.width = this.videoElement.videoWidth || 640;
                    this.canvas.height = this.videoElement.videoHeight || 480;
                }
            }

            this.health.streamActive = true;
            this.health.lastError = null;
            return true;
        } catch (error) {
            this.health.streamActive = false;
            this.health.lastError = error.message;
            console.error('[CameraService] Failed to establish camera connection:', error);
            return false;
        }
    }

    /**
     * Clears local stream capture nodes.
     */
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                try { track.stop(); } catch (e) {}
            });
            this.stream = null;
        }

        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.stopCapturing();
        this.health.streamActive = false;
        console.log('[CameraService] Camera disconnected');
    }

    /**
     * Begins frames sampling sequences.
     */
    startCapturing(callback, frameRate = 1000) {
        if (this.privacyMode) {
            console.warn('[CameraService] Privacy mode enabled - capture rejected');
            return false;
        }

        this.onFrameCallback = callback;
        this.frameRate = frameRate;
        this.isCapturing = true;
        this.lastFrameTime = Date.now();

        if (this.captureInterval) {
            clearInterval(this.captureInterval);
        }

        this.captureInterval = setInterval(() => {
            if (this.isCapturing && this.stream && this.onFrameCallback) {
                const frame = this.captureFrame();
                if (frame) {
                    this.onFrameCallback(frame);
                }
            }
        }, this.frameRate);

        return true;
    }

    stopCapturing() {
        this.isCapturing = false;
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
        this.onFrameCallback = null;
    }

    /**
     * Captures a single image frame buffer returning a clean base64 payload.
     */
    captureFrame(format = 'jpeg', quality = 0.7) {
        if (!this.videoElement || !this.stream || !this.ctx || !this.canvas) {
            return null;
        }

        try {
            this.ctx.drawImage(
                this.videoElement,
                0, 0,
                this.canvas.width,
                this.canvas.height
            );

            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = this.canvas.toDataURL(mimeType, quality);
            const base64Data = dataUrl.split(',')[1];

            this.lastFrameTime = Date.now();

            return {
                data: base64Data,
                mimeType,
                width: this.canvas.width,
                height: this.canvas.height,
                timestamp: this.lastFrameTime
            };
        } catch (error) {
            console.error('[CameraService] Single frame capture failure:', error);
            this.health.lastError = `Capture error: ${error.message}`;
            return null;
        }
    }

    async getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('[CameraService] Device enumeration failure:', error);
            this.health.lastError = `Enumeration error: ${error.message}`;
            return [];
        }
    }

    async switchCamera(deviceId) {
        this.stopCamera();
        return this.startCamera({
            video: { deviceId: { exact: deviceId } }
        });
    }

    setPrivacyMode(enabled) {
        this.privacyMode = enabled;
        if (enabled && this.stream) {
            this.stopCamera();
            console.log('[CameraService] Privacy mode enabled - camera closed');
        }
    }

    isActive() {
        return this.stream !== null && this.stream.active;
    }

    dispose() {
        this.stopCamera();
        this.stopWatchdog();
        this.canvas = null;
        this.ctx = null;
        this.videoElement = null;
        this.status = 'uninitialized';
    }
}

const cameraService = new CameraService();
export default cameraService;
