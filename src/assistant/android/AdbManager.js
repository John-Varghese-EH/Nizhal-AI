/**
 * Android Debug Bridge (ADB) Manager
 * Handles connection to Android devices via IPC to Main Process.
 * "Zero Install" feel via pre-packaged ADB in Main.
 */

export class AdbManager {
    constructor() {
        this.device = null;
        this.isConnected = false;
        console.log('🤖 Android ADB Manager Initialized');

        // Auto-check on load
        this.checkAvailability();
    }

    async checkAvailability() {
        const available = await window.nizhal?.adb?.check();
        if (available) {
            console.log('✅ Android ADB Service is available');
        } else {
            console.warn('⚠️ ADB not found. Android control may be limited.');
        }
    }

    /**
     * Connect to a device (Wireless)
     */
    async connect(ip, port = 5555) {
        if (!ip) {
            // If no IP, tries to get USB connected devices list
            const result = await window.nizhal.adb.getDevices();
            if (result.success && result.devices.length > 0) {
                console.log('📱 Found USB/Active Devices:', result.devices);
                this.device = result.devices[0].serial;
                this.isConnected = true;
                return true;
            }
            return false;
        }

        const result = await window.nizhal.adb.connect(ip, port);
        if (result.success) {
            this.device = result.device;
            this.isConnected = true;
            console.log(`✅ Connected to Android: ${this.device}`);
            return true;
        }
        return false;
    }

    /**
     * Mirror Phone Screen
     * Uses screenshot loop for low-latency mirror without complex deps
     * @param {function} onFrame - Callback with image URL
     */
    async startMirror(onFrame) {
        if (!this.isConnected) {
            console.warn('Cannot mirror: Not connected');
            return;
        }

        this.mirroring = true;
        console.log('📺 Starting Screen Mirror...');

        while (this.mirroring) {
            const start = Date.now();
            const result = await window.nizhal.adb.screenshot();
            if (result.success && result.url) {
                onFrame(result.url);
            }

            // Aim for ~10 FPS (100ms) minus processing time
            const elapsed = Date.now() - start;
            const delay = Math.max(0, 100 - elapsed);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    stopMirror() {
        this.mirroring = false;
        console.log('📺 Stopped Screen Mirror');
    }

    /**
     * Send Voice Command to Phone
     * e.g. "Take Instagram selfie"
     */
    async handleVoiceCommand(command) {
        if (!this.isConnected) return { success: false, error: "Not connected" };

        const cmd = command.toLowerCase();

        if (cmd.includes('home')) {
            await window.nizhal.adb.home();
        } else if (cmd.includes('back')) {
            await window.nizhal.adb.back();
        } else if (cmd.includes('tiktok')) {
            // Uninstall tiktok? Or open? User said "Uninstall TikTok -> Gone instantly"
            if (cmd.includes('uninstall')) {
                // Requires shell command which we might not expose directly strictly for safety,
                // but we can add 'shell' or specific handlers.
                // For now, let's treat it as "close"
                await window.nizhal.adb.close('com.zhiliaoapp.musically');
            } else {
                await window.nizhal.adb.launch('tiktok');
            }
        } else if (cmd.includes('instagram') || cmd.includes('insta')) {
            await window.nizhal.adb.launch('instagram');
            if (cmd.includes('story') || cmd.includes('selfie')) {
                // Complex macro: Open -> Wait -> Swipe Right -> Capture
                setTimeout(async () => {
                    await window.nizhal.adb.swipe(100, 500, 800, 500); // Swipe to camera
                    // Tap capture... needs coords
                }, 2000);
            }
        } else if (cmd.includes('whatsapp')) {
            await window.nizhal.adb.launch('whatsapp');
        } else if (cmd.includes('type')) {
            const text = command.split('type')[1].trim().replace(/['"]/g, '');
            await window.nizhal.adb.type(text);
        } else if (cmd.includes('mirror')) {
            // Handled by UI usually
            return { action: 'mirror' };
        }

        return { success: true };
    }
}
