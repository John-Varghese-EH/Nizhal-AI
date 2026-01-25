/**
 * ADB Control Service - FREE Android Device Control
 * 
 * Wireless Android debugging via ADB (Android Debug Bridge)
 * Requires: android-platform-tools installed
 * 
 * Features:
 * - Wireless ADB connection
 * - Tap/swipe/text input
 * - App launching
 * - Screenshot capture
 * - Safety confirmations (cybersecurity best practice)
 * 
 * 100% FREE, NO APIs!
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

class ADBControlService {
    constructor() {
        this.connectedDevice = null;
        this.isConnected = false;
        this.adbPath = this._findADBPath();

        // Safety: Require confirmation for sensitive commands
        this.requireConfirmation = true;

        // Command history for logging
        this.commandHistory = [];
    }

    /**
     * Find ADB executable path
     */
    _findADBPath() {
        // Common ADB paths
        const paths = [
            'adb', // In PATH
            'C:\\Program Files\\Android\\android-sdk\\platform-tools\\adb.exe',
            'C:\\Android\\sdk\\platform-tools\\adb.exe',
            '/usr/bin/adb',
            '/usr/local/bin/adb',
            process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb') : null
        ].filter(Boolean);

        // Return first valid path (assumes adb is in PATH for simplicity)
        return 'adb';
    }

    /**
     * Check if ADB is installed
     */
    async checkADBInstalled() {
        try {
            const { stdout } = await execAsync(`${this.adbPath} version`);
            console.log('[ADB] Version:', stdout.trim());
            return true;
        } catch (error) {
            console.error('[ADB] Not installed or not in PATH');
            return false;
        }
    }

    // ===== CONNECTION =====

    /**
     * Connect to device wirelessly
     * @param {string} ipAddress - Device IP (e.g., 192.168.1.100)
     * @param {number} port - ADB port (default 5555)
     */
    async connect(ipAddress, port = 5555) {
        try {
            const address = `${ipAddress}:${port}`;

            console.log(`[ADB] Connecting to ${address}...`);
            const { stdout } = await execAsync(`${this.adbPath} connect ${address}`);

            if (stdout.includes('connected')) {
                this.connectedDevice = address;
                this.isConnected = true;
                console.log('[ADB] ✅ Connected:', stdout.trim());
                return { success: true, device: address, message: stdout.trim() };
            } else {
                throw new Error(stdout);
            }
        } catch (error) {
            console.error('[ADB] Connection failed:', error);
            this.isConnected = false;
            return { success: false, error: error.message };
        }
    }

    /**
     * Enable WiFi debugging (requires USB connection first)
     * Run this once with USB cable connected
     */
    async enableWiFiDebugging() {
        try {
            // Step 1: Switch to TCP/IP mode on port 5555
            console.log('[ADB] Enabling TCP/IP mode...');
            const { stdout } = await execAsync(`${this.adbPath} tcpip 5555`);

            // Step 2: Get device IP address
            const { stdout: ipInfo } = await execAsync(
                `${this.adbPath} shell ip addr show wlan0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1`
            );
            const deviceIP = ipInfo.trim();

            return {
                success: true,
                message: 'WiFi debugging enabled. Disconnect USB and connect wirelessly.',
                deviceIP,
                instructions: [
                    `1. Note device IP: ${deviceIP}`,
                    '2. Disconnect USB cable',
                    `3. Use connect("${deviceIP}") to connect wirelessly`
                ]
            };
        } catch (error) {
            console.error('[ADB] Enable WiFi debugging failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disconnect device
     */
    async disconnect() {
        try {
            if (this.connectedDevice) {
                const { stdout } = await execAsync(`${this.adbPath} disconnect ${this.connectedDevice}`);
                console.log('[ADB] Disconnected:', stdout.trim());
            }
            this.connectedDevice = null;
            this.isConnected = false;
            return { success: true };
        } catch (error) {
            console.error('[ADB] Disconnect failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check connection status
     */
    async getDevices() {
        try {
            const { stdout } = await execAsync(`${this.adbPath} devices`);
            const lines = stdout.split('\n').slice(1).filter(l => l.trim());
            const devices = lines.map(line => {
                const [serial, status] = line.trim().split(/\s+/);
                return { serial, status };
            });

            this.isConnected = devices.length > 0 && devices.some(d => d.status === 'device');
            return { success: true, devices };
        } catch (error) {
            console.error('[ADB] Get devices failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== INPUT COMMANDS =====

    /**
     * Tap on screen coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    async tap(x, y, confirm = true) {
        if (confirm && this.requireConfirmation) {
            // In real app, show UI confirmation dialog
            console.warn('[ADB] Command requires confirmation: tap', { x, y });
        }

        try {
            const command = `${this.adbPath} shell input tap ${x} ${y}`;
            await execAsync(command);

            this._logCommand('tap', { x, y });
            return { success: true, action: 'tap', x, y };
        } catch (error) {
            console.error('[ADB] Tap failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Swipe on screen
     */
    async swipe(x1, y1, x2, y2, duration = 300) {
        try {
            const command = `${this.adbPath} shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`;
            await execAsync(command);

            this._logCommand('swipe', { x1, y1, x2, y2, duration });
            return { success: true, action: 'swipe' };
        } catch (error) {
            console.error('[ADB] Swipe failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Type text
     */
    async typeText(text) {
        try {
            // Escape special characters and spaces
            const escapedText = text.replace(/ /g, '%s').replace(/'/g, "\\'");
            const command = `${this.adbPath} shell input text "${escapedText}"`;
            await execAsync(command);

            this._logCommand('text', { text });
            return { success: true, action: 'text', text };
        } catch (error) {
            console.error('[ADB] Type text failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send key event
     * Common keycodes:
     * - HOME: 3
     * - BACK: 4
     * - VOLUME_UP: 24
     * - VOLUME_DOWN: 25
     * - POWER: 26
     * - ENTER: 66
     */
    async sendKeyEvent(keycode) {
        try {
            const command = `${this.adbPath} shell input keyevent ${keycode}`;
            await execAsync(command);

            this._logCommand('keyevent', { keycode });
            return { success: true, action: 'keyevent', keycode };
        } catch (error) {
            console.error('[ADB] Key event failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Press HOME button
     */
    async pressHome() {
        return await this.sendKeyEvent(3);
    }

    /**
     * Press BACK button
     */
    async pressBack() {
        return await this.sendKeyEvent(4);
    }

    /**
     * Volume up
     */
    async volumeUp() {
        return await this.sendKeyEvent(24);
    }

    /**
     * Volume down
     */
    async volumeDown() {
        return await this.sendKeyEvent(25);
    }

    // ===== APP CONTROL =====

    /**
     * Launch app by package name
     * Common packages:
     * - Instagram: com.instagram.android
     * - WhatsApp: com.whatsapp
     * - Chrome: com.android.chrome
     */
    /**
     * Launch app by name or package
     * Supports common app names like 'youtube', 'chrome' via internal map
     */
    async launchApp(appNameOrPackage) {
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
                'twitter': 'com.twitter.android',
                'x': 'com.twitter.android',
                'clash of clans': 'com.supercell.clashofclans',
                'coc': 'com.supercell.clashofclans',
                'settings': 'com.android.settings',
                'play store': 'com.android.vending',
                'gmail': 'com.google.android.gm',
                'photos': 'com.google.android.apps.photos',
                'netflix': 'com.netflix.mediaclient',
                'tiktok': 'com.zhiliaoapp.musically',
                'telegram': 'org.telegram.messenger'
            };

            let packageName = appMap[appNameOrPackage.toLowerCase()];

            // If not in map, treat as package name or fuzzy search
            if (!packageName) {
                // Check if it looks like a package name (contains dot)
                if (appNameOrPackage.includes('.')) {
                    packageName = appNameOrPackage;
                } else {
                    // Fuzzy search in installed packages
                    console.log(`[ADB] Searching for app: ${appNameOrPackage}`);
                    const { success, packages } = await this.listPackages();
                    if (success) {
                        packageName = packages.find(p => p.toLowerCase().includes(appNameOrPackage.toLowerCase()));
                    }
                }
            }

            if (!packageName) {
                throw new Error(`App '${appNameOrPackage}' not found`);
            }

            console.log(`[ADB] Launching ${packageName}...`);
            const command = `${this.adbPath} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
            await execAsync(command);

            this._logCommand('launch_app', { name: appNameOrPackage, package: packageName });
            return { success: true, action: 'launch_app', packageName };
        } catch (error) {
            console.error('[ADB] Launch app failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close app (force stop)
     */
    async closeApp(packageName) {
        try {
            const command = `${this.adbPath} shell am force-stop ${packageName}`;
            await execAsync(command);

            this._logCommand('close_app', { packageName });
            return { success: true, action: 'close_app', packageName };
        } catch (error) {
            console.error('[ADB] Close app failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get list of installed packages
     */
    async listPackages() {
        try {
            const { stdout } = await execAsync(`${this.adbPath} shell pm list packages`);
            const packages = stdout.split('\n')
                .map(line => line.replace('package:', '').trim())
                .filter(Boolean);
            return { success: true, packages };
        } catch (error) {
            console.error('[ADB] List packages failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== SCREENSHOT =====

    /**
     * Take screenshot and save locally
     * @param {string} savePath - Local path to save screenshot
     */
    async takeScreenshot(savePath = './screenshot.png') {
        try {
            const remotePath = '/sdcard/screen.png';

            // Capture screenshot on device
            await execAsync(`${this.adbPath} shell screencap -p ${remotePath}`);

            // Pull to local
            await execAsync(`${this.adbPath} pull ${remotePath} "${savePath}"`);

            // Clean up device
            await execAsync(`${this.adbPath} shell rm ${remotePath}`);

            this._logCommand('screenshot', { savePath });
            return { success: true, path: savePath };
        } catch (error) {
            console.error('[ADB] Screenshot failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get screen resolution
     */
    async getScreenResolution() {
        try {
            const { stdout } = await execAsync(`${this.adbPath} shell wm size`);
            const match = stdout.match(/Physical size: (\d+)x(\d+)/);
            if (match) {
                return {
                    success: true,
                    width: parseInt(match[1]),
                    height: parseInt(match[2])
                };
            }
            throw new Error('Failed to parse resolution');
        } catch (error) {
            console.error('[ADB] Get resolution failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== DEVICE INFO =====

    /**
     * Get device information
     */
    async getDeviceInfo() {
        try {
            const [model, androidVersion, battery] = await Promise.all([
                execAsync(`${this.adbPath} shell getprop ro.product.model`),
                execAsync(`${this.adbPath} shell getprop ro.build.version.release`),
                execAsync(`${this.adbPath} shell dumpsys battery | grep level`)
            ]);

            return {
                success: true,
                model: model.stdout.trim(),
                androidVersion: androidVersion.stdout.trim(),
                batteryLevel: battery.stdout.match(/\d+/)?.[0] + '%'
            };
        } catch (error) {
            console.error('[ADB] Get device info failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== SECURITY & LOGGING =====

    /**
     * Enable/disable confirmation prompts
     */
    setConfirmationRequired(required) {
        this.requireConfirmation = required;
        console.log(`[ADB] Confirmation ${required ? 'enabled' : 'disabled'}`);
    }

    /**
     * Log command for security audit
     */
    _logCommand(action, details) {
        const entry = {
            timestamp: Date.now(),
            action,
            details,
            device: this.connectedDevice
        };
        this.commandHistory.push(entry);

        // Keep last 100 commands
        if (this.commandHistory.length > 100) {
            this.commandHistory.shift();
        }
    }

    /**
     * Get command history
     */
    getCommandHistory(limit = 50) {
        return this.commandHistory.slice(-limit);
    }

    // ===== PENTESTER TOOLS =====

    /**
     * Execute arbitrary shell command
     * @param {string} command - Shell command to execute
     */
    async shell(command) {
        try {
            // Security check: Block dangerous commands if confirmation enabled
            const dangerous = ['rm -rf', 'format', 'mkfs', 'dd'];
            if (this.requireConfirmation && dangerous.some(d => command.includes(d))) {
                throw new Error('Command blocked by security policy');
            }

            const fullCmd = `${this.adbPath} shell "${command}"`;
            const { stdout, stderr } = await execAsync(fullCmd);

            this._logCommand('shell', { command });
            return { success: true, output: stdout || stderr };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get Logcat dump (last N lines)
     */
    async getLogcat(lines = 100) {
        try {
            const { stdout } = await execAsync(`${this.adbPath} logcat -d -t ${lines}`);
            return { success: true, logs: stdout };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear Logcat buffer
     */
    async clearLogcat() {
        try {
            await execAsync(`${this.adbPath} logcat -c`);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get security warning message
     */
    getSecurityWarning() {
        return {
            title: '⚠️ ADB Security Warning',
            message: [
                'USB Debugging allows full control of your Android device.',
                'Only enable if you understand the risks.',
                'Recommendations:',
                '- Use only on trusted networks',
                '- Disable when not in use',
                '- Never allow unknown devices',
                '- Revoke access after use'
            ].join('\n')
        };
    }
}

// Export singleton
export const adbControl = new ADBControlService();
export { ADBControlService };
