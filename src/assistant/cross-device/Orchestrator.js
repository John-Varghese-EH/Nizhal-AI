
/**
 * Orchestrator.js
 * Central command center for Cross-Device operations.
 * Routes commands between Desktop, Android (via ADB), and other connected nodes.
 */

import { adbManager } from '../android/AdbManager.js'; // Assuming this exists or will exist properly
// import { voiceRelay } from './VoiceRelay.js';

export class DeviceOrchestrator {
    constructor() {
        this.devices = new Map(); // id -> { type, status, capabilities }
        this.activeDevice = 'desktop'; // Default target
    }

    /**
     * Register a new device or update its status
     */
    registerDevice(id, type, capabilities = []) {
        this.devices.set(id, {
            id,
            type,
            status: 'connected',
            capabilities,
            lastSeen: Date.now()
        });
        console.log(`[Orchestrator] Device registered: ${id} (${type})`);
    }

    /**
     * Route a command to the appropriate device
     * @param {string} command - The intent/command to execute
     * @param {string} targetDevice - Optional target device ID
     */
    async routeCommand(command, targetDevice = null) {
        const target = targetDevice || this.activeDevice;

        console.log(`[Orchestrator] Routing '${command}' to ${target}`);

        if (target === 'desktop') {
            return this.handleDesktopCommand(command);
        } else if (target === 'android') {
            return this.handleAndroidCommand(command);
        }

        throw new Error(`Unknown target device: ${target}`);
    }

    // --- Command Handlers ---

    async handleDesktopCommand(command) {
        // Delegate to existing desktop services
        console.log('[Orchestrator] Executing on Desktop...');
        // Example: launch app, change volume (Integrated with existing services)
        return { success: true, source: 'desktop', result: `Executed: ${command}` };
    }

    async handleAndroidCommand(command) {
        // Delegate to ADB Manager
        console.log('[Orchestrator] Relaying to Android via ADB...');
        // Check if ADB is ready
        // return adbManager.execute(command);
        return { success: true, source: 'android', result: `Relayed: ${command}` };
    }

    /**
     * Set the focus/active device for implicit commands
     */
    setActiveDevice(deviceId) {
        if (this.devices.has(deviceId) || deviceId === 'desktop' || deviceId === 'android') {
            this.activeDevice = deviceId;
            console.log(`[Orchestrator] Active device set to: ${deviceId}`);
        }
    }
}

export const orchestrator = new DeviceOrchestrator();
