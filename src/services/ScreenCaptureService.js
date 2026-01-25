/**
 * ScreenCaptureService - Capture screenshots to share with AI
 * 
 * Captures screen/window/area and saves for AI context
 */

class ScreenCaptureService {
    constructor() {
        this.captures = [];
        this.initialized = false;
    }

    /**
     * Initialize the service
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.captures = stored;
            }
            this.initialized = true;
            console.log('[ScreenCapture] Initialized with', this.captures.length, 'captures');
        } catch (error) {
            console.error('[ScreenCapture] Init error:', error);
        }
    }

    /**
     * Capture the entire screen
     */
    async captureScreen() {
        try {
            // Use Electron's desktopCapturer via IPC
            const sources = await window.nizhal?.screen?.getSources?.('screen');

            if (!sources || sources.length === 0) {
                // Fallback: use browser API if available
                return this._browserCapture();
            }

            const source = sources[0];
            return this._processCapture(source, 'screen');
        } catch (error) {
            console.error('[ScreenCapture] Screen capture failed:', error);
            throw error;
        }
    }

    /**
     * Capture active window
     */
    async captureWindow() {
        try {
            const sources = await window.nizhal?.screen?.getSources?.('window');

            if (!sources || sources.length === 0) {
                throw new Error('No windows available for capture');
            }

            // Get the first window (usually the active one)
            const source = sources[0];
            return this._processCapture(source, 'window');
        } catch (error) {
            console.error('[ScreenCapture] Window capture failed:', error);
            throw error;
        }
    }

    /**
     * Browser-based screen capture fallback
     */
    async _browserCapture() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' }
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());

            const dataUrl = canvas.toDataURL('image/png');
            return this._saveCapture(dataUrl, 'screen');
        } catch (error) {
            console.error('[ScreenCapture] Browser capture failed:', error);
            throw error;
        }
    }

    /**
     * Process and save a capture
     */
    async _processCapture(source, type) {
        const dataUrl = source.thumbnail || source.dataUrl;
        return this._saveCapture(dataUrl, type);
    }

    /**
     * Save capture to storage
     */
    async _saveCapture(dataUrl, type) {
        const capture = {
            id: `capture_${Date.now()}`,
            type,
            dataUrl,
            timestamp: Date.now(),
            date: new Date().toISOString()
        };

        this.captures.unshift(capture);

        // Keep only last 20 captures
        if (this.captures.length > 20) {
            this.captures = this.captures.slice(0, 20);
        }

        await this._saveToStorage();
        return capture;
    }

    /**
     * Get all captures
     */
    getCaptures() {
        return [...this.captures];
    }

    /**
     * Get recent captures
     */
    getRecentCaptures(count = 5) {
        return this.captures.slice(0, count);
    }

    /**
     * Delete a capture
     */
    async deleteCapture(id) {
        const index = this.captures.findIndex(c => c.id === id);
        if (index > -1) {
            this.captures.splice(index, 1);
            await this._saveToStorage();
            return true;
        }
        return false;
    }

    /**
     * Clear all captures
     */
    async clearCaptures() {
        this.captures = [];
        await this._saveToStorage();
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.screenCaptures || [];
            }
            return [];
        } catch {
            return [];
        }
    }

    async _saveToStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                await window.nizhal.memory.setUserPreferences({
                    ...prefs,
                    screenCaptures: this.captures
                });
            }
        } catch (error) {
            console.error('[ScreenCapture] Save error:', error);
        }
    }
}

export const screenCaptureService = new ScreenCaptureService();
export default ScreenCaptureService;
