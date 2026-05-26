/**
 * PermissionService - Centralized hardware permission orchestration layer.
 * Standardizes checks, requests, and failure states for Camera and Microphone,
 * optimized specifically for Wayland, Niri, PipeWire, macOS, and Windows.
 */
class PermissionService {
    /**
     * Check if the hardware is visible to the system at all.
     */
    async isHardwareVisible(kind) {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) {
                return false;
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const matching = devices.filter(d => d.kind === kind);
            return matching.length > 0;
        } catch (err) {
            console.warn(`[PermissionService] enumerateDevices failed for ${kind}:`, err);
            return false;
        }
    }

    /**
     * Verify if the necessary portal interfaces are available via D-Bus on Linux
     */
    async checkXdgPortal() {
        if (window.nizhal?.invoke) {
            try {
                return await window.nizhal.invoke('check_xdg_portal');
            } catch (err) {
                console.warn('[PermissionService] Failed to check XDG Portal natively:', err);
                return true; // Fallback to true to allow attempt
            }
        }
        return true;
    }

    /**
     * Pre-flight Check:
     * Returns the current status of camera and microphone permissions.
     * Status is one of: 'granted' | 'denied' | 'prompt'
     */
    async check() {
        const status = {
            camera: 'prompt',
            mic: 'prompt'
        };

        // Try standard navigator.permissions.query API first
        if (navigator.permissions?.query) {
            try {
                const camPermission = await navigator.permissions.query({ name: 'camera' });
                status.camera = camPermission.state; // 'granted' | 'denied' | 'prompt'
            } catch (e) {
                status.camera = await this._fallbackCheck('videoinput');
            }

            try {
                const micPermission = await navigator.permissions.query({ name: 'microphone' });
                status.mic = micPermission.state; // 'granted' | 'denied' | 'prompt'
            } catch (e) {
                status.mic = await this._fallbackCheck('audioinput');
            }
        } else {
            status.camera = await this._fallbackCheck('videoinput');
            status.mic = await this._fallbackCheck('audioinput');
        }

        return status;
    }

    /**
     * Fallback permission check using enumerateDevices.
     */
    async _fallbackCheck(kind) {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) {
                return 'prompt';
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const filtered = devices.filter(d => d.kind === kind);
            
            if (filtered.length === 0) {
                return 'prompt';
            }

            const hasLabel = filtered.some(d => d.label && d.label.length > 0);
            return hasLabel ? 'granted' : 'prompt';
        } catch (err) {
            console.warn(`[PermissionService] Enumerate fallback check failed for ${kind}:`, err);
            return 'prompt';
        }
    }

    /**
     * Request access to the specified hardware (camera or microphone).
     * Triggers native prompt and handles errors defensively.
     */
    async request(type) {
        try {
            const kind = type === 'camera' ? 'videoinput' : 'audioinput';
            
            // 1. Verify hardware presence before asking
            const visible = await this.isHardwareVisible(kind);
            if (!visible) {
                throw new DOMException(`No active ${type} hardware could be found.`, 'NotFoundError');
            }

            // 2. Portal DBus check on Wayland/Linux
            const isPortalOk = await this.checkXdgPortal();
            if (!isPortalOk && window.navigator.userAgent.toLowerCase().includes('linux')) {
                console.warn(`[PermissionService] XDG Desktop Portal seems to be missing or inactive!`);
            }

            // 3. Simple, highly compatible PipeWire/Wayland constraints (avoids legacy/overconstrained options)
            const constraints = {
                camera: { 
                    video: { 
                        width: { ideal: 1280 }, 
                        height: { ideal: 720 },
                        facingMode: 'user'
                    }, 
                    audio: false 
                },
                microphone: { 
                    video: false, 
                    audio: { 
                        echoCancellation: true, 
                        noiseSuppression: true 
                    } 
                }
            };

            const constraint = constraints[type];
            if (!constraint) {
                throw new Error(`Invalid hardware type requested: ${type}`);
            }

            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('WebRTC MediaDevices API is not supported in this runtime.');
            }

            console.log(`[PermissionService] Triggering pre-flight getUserMedia request for: ${type}`);
            
            // Explicitly wait on the userMedia promise
            const getUserMediaPromise = navigator.mediaDevices.getUserMedia(constraint);
            const stream = await getUserMediaPromise;
            
            // Release the stream tracks immediately to release hardware locks
            stream.getTracks().forEach(track => track.stop());
            console.log(`[PermissionService] Hardware permission granted for: ${type}`);
            return 'granted';
        } catch (err) {
            console.error(`[PermissionService] Permission request denied/failed for ${type}:`, err);
            
            let userFriendlyMsg = err.message || 'Permission denied.';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                userFriendlyMsg = `Access to the ${type} was denied by the user or system security sandbox (e.g., Wayland portal rejection).`;
                
                // Automatically attempt to trigger System Settings helper UI
                if (window.nizhal?.invoke) {
                    window.nizhal.invoke('open_system_permission_settings', { permissionType: type })
                        .catch(openErr => console.warn('Could not launch system settings natively:', openErr));
                }
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                userFriendlyMsg = `No active ${type} hardware device could be found. Please plug in a device.`;
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                userFriendlyMsg = `The ${type} is already locked by another software process (e.g. OBS or another browser).`;
            } else if (err.name === 'OverconstrainedError') {
                userFriendlyMsg = `The requested hardware configuration is overconstrained under this system's media server.`;
            }

            // Dispatch custom global event for UI helper overlay
            window.dispatchEvent(new CustomEvent('nizhal-permission-denied', {
                detail: { 
                    type, 
                    error: err.name,
                    message: userFriendlyMsg
                }
            }));

            return 'denied';
        }
    }
}

export default new PermissionService();
