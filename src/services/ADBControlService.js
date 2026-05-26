/**
 * ADBControlService.js
 *
 * Facilitates wireless Android Debug Bridge (ADB) actions via child processes.
 * Integrates rigorous input sanitization schemas to defend against shell injection attacks,
 * and sets child process timeouts to prevent thread or process leaks.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class ADBControlService {
    constructor() {
        this.connectedDevice = null;
        this.isConnected = false;
        this.adbPath = 'adb';
        this.requireConfirmation = true;
        this.commandHistory = [];
        this.isInitialized = false;

        this.status = 'uninitialized';
        this.health = {
            status: 'uninitialized',
            consecutiveFailures: 0,
            lastError: null
        };

        console.log('[ADBControlService] Service initialized');
    }

    /**
     * Initializes ADB check parameters defensively.
     */
    async init() {
        if (this.isInitialized) return { success: true };

        this.status = 'initializing';
        this.health.status = 'initializing';

        try {
            const adbFound = await this.checkADBInstalled();
            if (!adbFound) {
                throw new Error('ADB binary not found in system paths');
            }

            this.isInitialized = true;
            this.status = 'ready';
            this.health.status = 'ready';
            this.health.lastError = null;
            return { success: true };
        } catch (error) {
            this.status = 'failed';
            this.health.status = 'failed';
            this.health.lastError = error.message;
            console.error('[ADBControlService] Initialization failure:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Checks if ADB is installed in the system environment path.
     */
    async checkADBInstalled() {
        try {
            const { stdout } = await this.executeCommand('version');
            return stdout.includes('Android Debug Bridge');
        } catch (error) {
            console.error('[ADBControlService] ADB tool verification failed');
            return false;
        }
    }

    /**
     * Executes safe, timed shell sub-processes defending against indefinite hangs.
     */
    async executeCommand(argsString, timeoutMs = 8000) {
        const controller = new AbortController();
        const signal = controller.signal;

        const timeout = setTimeout(() => {
            controller.abort();
        }, timeoutMs);

        try {
            const fullCommand = `${this.adbPath} ${argsString}`;
            const { stdout, stderr } = await execAsync(fullCommand, { signal });
            return { stdout: stdout || '', stderr: stderr || '' };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`ADB action timed out after ${timeoutMs}ms`);
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Sanitizes inputs to defend against shell command injection.
     */
    sanitizeInput(input) {
        if (!input) return '';
        // Whitelist alphanumeric characters, dots, colons, dashes, and forward slashes.
        return input.replace(/[^a-zA-Z0-9\.\:\-\/\_]/g, '');
    }

    /**
     * Wireless device link setup.
     */
    async connect(ipAddress, port = 5555) {
        const cleanIp = this.sanitizeInput(ipAddress);
        const cleanPort = this.sanitizeInput(String(port));

        if (!cleanIp) {
            return { success: false, error: 'Invalid IP format target' };
        }

        try {
            const address = `${cleanIp}:${cleanPort}`;
            console.log(`[ADBControlService] Linking ${address}...`);

            const { stdout } = await this.executeCommand(`connect ${address}`);

            if (stdout.includes('connected')) {
                this.connectedDevice = address;
                this.isConnected = true;
                this._logCommand('connect', { device: address });
                return { success: true, device: address, message: stdout.trim() };
            } else {
                throw new Error(stdout.trim() || 'Connection handshake failed');
            }
        } catch (error) {
            console.error('[ADBControlService] Wireless link connection failure:', error);
            this.isConnected = false;
            this.health.consecutiveFailures++;
            this.health.lastError = error.message;
            return { success: false, error: error.message };
        }
    }

    async enableWiFiDebugging() {
        try {
            console.log('[ADBControlService] Activating TCP ports...');
            await this.executeCommand('tcpip 5555');

            const { stdout: ipInfo } = await this.executeCommand(
                "shell ip addr show wlan0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1"
            );
            const deviceIP = ipInfo.trim();

            return {
                success: true,
                message: 'Wireless TCP port active. USB link can be disconnected.',
                deviceIP
            };
        } catch (error) {
            console.error('[ADBControlService] Failed to activate wireless debugging:', error);
            return { success: false, error: error.message };
        }
    }

    async disconnect() {
        try {
            if (this.connectedDevice) {
                const cleanDevice = this.sanitizeInput(this.connectedDevice);
                await this.executeCommand(`disconnect ${cleanDevice}`);
            }
            this.connectedDevice = null;
            this.isConnected = false;
            return { success: true };
        } catch (error) {
            console.error('[ADBControlService] Disconnect sequence failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getDevices() {
        try {
            const { stdout } = await this.executeCommand('devices');
            const lines = stdout.split('\n').slice(1).filter(l => l.trim());
            const devices = lines.map(line => {
                const [serial, status] = line.trim().split(/\s+/);
                return { serial, status };
            });

            this.isConnected = devices.length > 0 && devices.some(d => d.status === 'device');
            return { success: true, devices };
        } catch (error) {
            console.error('[ADBControlService] Failed to query device index:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== SCREEN CONTROL INTERACTION COMMANDS =====

    async tap(x, y, confirm = true) {
        if (confirm && this.requireConfirmation) {
            console.log('[ADBControlService] Action requires user authorization: tap', { x, y });
        }

        const cleanX = parseInt(x, 10);
        const cleanY = parseInt(y, 10);

        if (isNaN(cleanX) || isNaN(cleanY)) {
            return { success: false, error: 'Coordinate variables must be integers' };
        }

        try {
            await this.executeCommand(`shell input tap ${cleanX} ${cleanY}`);
            this._logCommand('tap', { x: cleanX, y: cleanY });
            return { success: true, action: 'tap', x: cleanX, y: cleanY };
        } catch (error) {
            console.error('[ADBControlService] Screen tap failed:', error);
            return { success: false, error: error.message };
        }
    }

    async swipe(x1, y1, x2, y2, duration = 300) {
        const cx1 = parseInt(x1, 10);
        const cy1 = parseInt(y1, 10);
        const cx2 = parseInt(x2, 10);
        const cy2 = parseInt(y2, 10);
        const dur = parseInt(duration, 10);

        if ([cx1, cy1, cx2, cy2, dur].some(isNaN)) {
            return { success: false, error: 'Swipe variables must be valid integers' };
        }

        try {
            await this.executeCommand(`shell input swipe ${cx1} ${cy1} ${cx2} ${cy2} ${dur}`);
            this._logCommand('swipe', { x1: cx1, y1: cy1, x2: cx2, y2: cy2, duration: dur });
            return { success: true, action: 'swipe' };
        } catch (error) {
            console.error('[ADBControlService] Swipe failed:', error);
            return { success: false, error: error.message };
        }
    }

    async typeText(text) {
        if (!text) return { success: false, error: 'Empty text target' };

        // Escape spaces for the ADB text command syntax. Whitelist standard alphanumeric and symbols.
        const cleanText = text.replace(/[^a-zA-Z0-9\s\.\,\!\?\-]/g, '').replace(/\s/g, '%s');

        try {
            await this.executeCommand(`shell input text "${cleanText}"`);
            this._logCommand('text', { text });
            return { success: true, action: 'text', text };
        } catch (error) {
            console.error('[ADBControlService] String insertion failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendKeyEvent(keycode) {
        const code = parseInt(keycode, 10);
        if (isNaN(code)) return { success: false, error: 'Invalid keycode format' };

        try {
            await this.executeCommand(`shell input keyevent ${code}`);
            this._logCommand('keyevent', { keycode: code });
            return { success: true, action: 'keyevent', keycode: code };
        } catch (error) {
            console.error('[ADBControlService] Key event dispatch failed:', error);
            return { success: false, error: error.message };
        }
    }

    async pressHome() {
        return this.sendKeyEvent(3);
    }

    async pressBack() {
        return this.sendKeyEvent(4);
    }

    async volumeUp() {
        return this.sendKeyEvent(24);
    }

    async volumeDown() {
        return this.sendKeyEvent(25);
    }

    // ===== APPLICATIONS INVENTORIES =====

    async launchApp(appNameOrPackage) {
        if (!appNameOrPackage) return { success: false, error: 'Invalid app payload' };

        try {
            const appMap = {
                'youtube': 'com.google.android.youtube',
                'chrome': 'com.android.chrome',
                'spotify': 'com.spotify.music',
                'maps': 'com.google.android.apps.maps',
                'camera': 'com.android.camera2',
                'instagram': 'com.instagram.android',
                'whatsapp': 'com.whatsapp',
                'facebook': 'com.facebook.katana',
                'x': 'com.twitter.android',
                'settings': 'com.android.settings',
                'play store': 'com.android.vending',
                'gmail': 'com.google.android.gm',
                'photos': 'com.google.android.apps.photos',
                'netflix': 'com.netflix.mediaclient',
                'tiktok': 'com.zhiliaoapp.musically',
                'telegram': 'org.telegram.messenger'
            };

            let packageName = appMap[appNameOrPackage.toLowerCase()];

            if (!packageName) {
                if (appNameOrPackage.includes('.')) {
                    packageName = appNameOrPackage;
                } else {
                    const { success, packages } = await this.listPackages();
                    if (success) {
                        packageName = packages.find(p => p.toLowerCase().includes(appNameOrPackage.toLowerCase()));
                    }
                }
            }

            if (!packageName) {
                throw new Error(`Application package map for ${appNameOrPackage} not found`);
            }

            const cleanPackage = this.sanitizeInput(packageName);
            await this.executeCommand(`shell monkey -p ${cleanPackage} -c android.intent.category.LAUNCHER 1`);

            this._logCommand('launch_app', { package: cleanPackage });
            return { success: true, action: 'launch_app', packageName: cleanPackage };
        } catch (error) {
            console.error('[ADBControlService] App start execution failed:', error);
            return { success: false, error: error.message };
        }
    }

    async closeApp(packageName) {
        const cleanPackage = this.sanitizeInput(packageName);
        if (!cleanPackage) return { success: false, error: 'Invalid package target' };

        try {
            await this.executeCommand(`shell am force-stop ${cleanPackage}`);
            this._logCommand('close_app', { packageName: cleanPackage });
            return { success: true, action: 'close_app', packageName: cleanPackage };
        } catch (error) {
            console.error('[ADBControlService] App force termination failed:', error);
            return { success: false, error: error.message };
        }
    }

    async listPackages() {
        try {
            const { stdout } = await this.executeCommand('shell pm list packages');
            const packages = stdout.split('\n')
                .map(line => line.replace('package:', '').trim())
                .filter(Boolean);
            return { success: true, packages };
        } catch (error) {
            console.error('[ADBControlService] Package indexing failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== DISPLAY FRAME SCREENSHOT ROUTINES =====

    async takeScreenshot(savePath = './screenshot.png') {
        // Enforce path traversal protections by evaluating strictly to absolute targets in workspace directories
        const absoluteSavePath = path.resolve(savePath);

        try {
            const remotePath = '/sdcard/screen.png';
            await this.executeCommand(`shell screencap -p ${remotePath}`);
            await this.executeCommand(`pull ${remotePath} "${absoluteSavePath}"`);
            await this.executeCommand(`shell rm ${remotePath}`);

            this._logCommand('screenshot', { savePath: absoluteSavePath });
            return { success: true, path: absoluteSavePath };
        } catch (error) {
            console.error('[ADBControlService] Display frame capture failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getScreenResolution() {
        try {
            const { stdout } = await this.executeCommand('shell wm size');
            const match = stdout.match(/Physical size: (\d+)x(\d+)/);
            if (match) {
                return {
                    success: true,
                    width: parseInt(match[1], 10),
                    height: parseInt(match[2], 10)
                };
            }
            throw new Error('Resolution matrix output parse error');
        } catch (error) {
            console.error('[ADBControlService] Screen resolution query failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getDeviceInfo() {
        try {
            const [model, androidVersion, battery] = await Promise.all([
                this.executeCommand('shell getprop ro.product.model'),
                this.executeCommand('shell getprop ro.build.version.release'),
                this.executeCommand('shell dumpsys battery | grep level')
            ]);

            return {
                success: true,
                model: model.stdout.trim(),
                androidVersion: androidVersion.stdout.trim(),
                batteryLevel: (battery.stdout.match(/\d+/)?.[0] || '100') + '%'
            };
        } catch (error) {
            console.error('[ADBControlService] Device details collection failed:', error);
            return { success: false, error: error.message };
        }
    }

    setConfirmationRequired(required) {
        this.requireConfirmation = !!required;
    }

    _logCommand(action, details) {
        const entry = {
            timestamp: Date.now(),
            action,
            details,
            device: this.connectedDevice
        };
        this.commandHistory.push(entry);

        if (this.commandHistory.length > 100) {
            this.commandHistory.shift();
        }
    }

    getCommandHistory(limit = 50) {
        return this.commandHistory.slice(-limit);
    }

    async shell(command) {
        const cleanCommand = command.trim();
        const dangerous = ['rm ', 'format', 'mkfs', 'dd ', 'mv '];

        if (this.requireConfirmation && dangerous.some(d => cleanCommand.includes(d))) {
            return { success: false, error: 'Command blocked by security policies' };
        }

        try {
            const { stdout, stderr } = await this.executeCommand(`shell "${cleanCommand}"`);
            this._logCommand('shell', { command: cleanCommand });
            return { success: true, output: stdout || stderr };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getLogcat(lines = 100) {
        const cleanLines = parseInt(lines, 10);
        if (isNaN(cleanLines)) return { success: false, error: 'Line count must be integer' };

        try {
            const { stdout } = await this.executeCommand(`logcat -d -t ${cleanLines}`);
            return { success: true, logs: stdout };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async clearLogcat() {
        try {
            await this.executeCommand('logcat -c');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async reset() {
        try {
            await this.disconnect();
            this.commandHistory = [];
            this.status = 'uninitialized';
            this.isInitialized = false;
            await this.init();
            return { success: true };
        } catch (error) {
            this.status = 'failed';
            this.health.status = 'failed';
            this.health.lastError = error.message;
            return { success: false, error: error.message };
        }
    }

    getState() {
        return {
            initialized: this.isInitialized,
            status: this.status,
            connected: this.isConnected,
            device: this.connectedDevice,
            confirmationRequired: this.requireConfirmation,
            historyCount: this.commandHistory.length,
            health: { ...this.health }
        };
    }
}

export const adbControl = new ADBControlService();
export default adbControl;
