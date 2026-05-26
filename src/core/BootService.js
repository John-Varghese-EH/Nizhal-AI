import appStateService from './AppStateService.js';
import cameraService from '../services/CameraService.js';

/**
 * BootService - Orchestrates application Startup
 * 
 * Responsibilities:
 * 1. Preload critical assets (VRM, Voices)
 * 2. Initialize Core Services (AppState, AI, LiveKit)
 * 3. Report progress to UI with retry-with-backoff reliability
 */
export class BootService {
    constructor() {
        this.isReady = false;
        this.loadingProgress = 0;
        this.healthStatus = 'INITIALIZING';
    }

    /**
     * Return standard health status (READY, INITIALIZING, ERROR)
     */
    status() {
        if (this.isReady) return 'READY';
        if (this.healthStatus === 'ERROR') return 'ERROR';
        return 'INITIALIZING';
    }

    /**
     * Standard cleanup of all trackers and progress counters
     */
    dispose() {
        this.isReady = false;
        this.loadingProgress = 0;
        this.healthStatus = 'INITIALIZING';
        console.log('[BootService] Disposed and resource allocation freed.');
    }

    /**
     * Standardized init setup wrapping the internal initializer
     */
    async init() {
        return this.initialize();
    }

    _emitToast(message, type = 'info') {
        window.dispatchEvent(new CustomEvent('nizhal-toast', {
            detail: { message, type, duration: 4000 }
        }));
    }

    /**
     * Retry a promise-returning function with exponential backoff
     */
    async _retryWithBackoff(taskFn, retries = 3, delay = 1000, backoffFactor = 2) {
        let attempt = 0;
        while (attempt < retries) {
            try {
                return await taskFn();
            } catch (error) {
                attempt++;
                if (attempt >= retries) throw error;
                const nextDelay = delay * Math.pow(backoffFactor, attempt - 1);
                console.warn(`[BootService] Task failed (attempt ${attempt}/${retries}). Retrying in ${nextDelay}ms... Error:`, error);
                await new Promise(resolve => setTimeout(resolve, nextDelay));
            }
        }
    }

    async initialize() {
        console.log('[BootService] Starting initialization sequence...');
        this.loadingProgress = 0;

        try {
            // 1. Environment Check
            await this._runCheck('Environment Config', async () => {
                const env = await window.nizhal?.env?.getAll?.() || {};
                const missing = [];
                if (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
                    missing.push('AI API Key');
                }

                if (missing.length > 0) {
                    this._emitToast(`Companion running with missing keys: ${missing.join(', ')}`, 'warning');
                }
            }, 20);

            // 2. Core State Synchronization (Rust -> Zustand)
            await this._runCheck('Core State Sync', async () => {
                await appStateService.initialize();
            }, 20);

            // 3. LiveKit Status & Voice Services
            await this._runCheck('Voice & LiveKit Services', async () => {
                if (window.nizhal?.livekit) {
                    const status = await window.nizhal.livekit.getStatus();
                    console.log('[BootService] LiveKit Status:', status);
                }
            }, 20);

            // 4. Camera & Video Devices Check
            await this._runCheck('Camera & Vision System', async () => {
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    console.log(`[BootService] Found ${videoDevices.length} camera(s) available.`);
                    if (videoDevices.length === 0) {
                        console.warn('[BootService] No video input devices found. Camera companion features will be offline.');
                    }
                } else {
                    console.warn('[BootService] navigator.mediaDevices not available.');
                }
            }, 20);

            // 5. Finalize Boot
            this.loadingProgress = 100;
            this.isReady = true;
            this.healthStatus = 'READY';
            console.log('[BootService] Initialization complete.');

            this._emitToast('Nizhal AI Ready', 'success');
            return true;

        } catch (error) {
            this.healthStatus = 'ERROR';
            console.error('[BootService] Init failed:', error);
            this._emitToast('Initialization failed. Some services may be degraded.', 'error');
            return false;
        }
    }

    async _runCheck(name, taskFn, weight, retries = 3, baseDelay = 1000) {
        console.log(`[BootService] Running startup check: ${name}...`);
        try {
            await this._retryWithBackoff(taskFn, retries, baseDelay);
        } catch (e) {
            console.error(`[BootService] ${name} check failed after ${retries} attempts:`, e);
            this._emitToast(`Service startup failed: ${name}. Using offline fallback.`, 'warning');
        }
        this.loadingProgress += weight;
    }
}

export const bootService = new BootService();
export default bootService;
