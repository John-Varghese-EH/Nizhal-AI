import { powerMonitor } from 'electron';
import { exec } from 'child_process';
import util from 'util';
const execAsync = util.promisify(exec);

/**
 * IdleDetection - Monitors system idle state to trigger sleep/wake
 */
class IdleDetection {
    constructor() {
        this.isEnabled = false;
        this.idleThreshold = 60; // seconds (default 1 min for testing, user configurable later)
        this.checkInterval = null;
        this.onIdle = null;
        this.onActive = null;
        this.isIdle = false;
        this.lastMediaResult = false;
        this.lastMediaCheck = 0;
    }

    /**
     * Start monitoring
     * @param {Object} callbacks - { onIdle, onActive, onSuspend, onResume, onLockScreen, onUnlockScreen }
     */
    start({ onIdle, onActive, onSuspend, onResume, onLockScreen, onUnlockScreen }) {
        if (this.isEnabled) return;

        this.isEnabled = true;
        this.onIdle = onIdle;
        this.onActive = onActive;
        this.isIdle = false;

        // Listen to system power events (screen lock/unlock, suspend/resume)
        powerMonitor.on('suspend', () => {
            console.log('[IdleDetection] System suspended');
            if (onSuspend) onSuspend();
            if (this.onIdle) this.onIdle();
        });

        powerMonitor.on('resume', () => {
            console.log('[IdleDetection] System resumed');
            if (onResume) onResume();
            // Delay to allow system to fully wake up
            setTimeout(() => {
                if (this.onActive) this.onActive();
            }, 1000);
        });

        powerMonitor.on('lock-screen', () => {
            console.log('[IdleDetection] Screen locked');
            if (onLockScreen) onLockScreen();
            this.isIdle = true;
            if (this.onIdle) this.onIdle();
        });

        powerMonitor.on('unlock-screen', () => {
            console.log('[IdleDetection] Screen unlocked');
            if (onUnlockScreen) onUnlockScreen();
            this.isIdle = false;
            // Delay to ensure desktop is fully visible before showing window
            setTimeout(() => {
                if (this.onActive) this.onActive();
            }, 500);
        });

        // Use polling for finer control or powerMonitor events
        // powerMonitor.getSystemIdleTime() returns seconds
        this.checkInterval = setInterval(async () => {
            const idleTime = powerMonitor.getSystemIdleTime();

            if (!this.isIdle && idleTime >= this.idleThreshold) {
                // User has gone idle BUT check for media first
                const isMediaPlaying = await this.checkMediaActivity();

                if (isMediaPlaying) {
                    // Media is playing, do NOT go idle. 
                    return;
                }

                this.isIdle = true;
                if (this.onIdle) this.onIdle();
            } else if (this.isIdle && idleTime < this.idleThreshold) {
                // User is active again
                this.isIdle = false;
                if (this.onActive) this.onActive();
            }
        }, 1000); // Check every second
    }

    /**
     * Check if system is preventing sleep (Audio/Video playing)
     * Uses 'powercfg /requests' and PowerShell fallback
     */
    async checkMediaActivity() {
        // Cache result for 5 seconds to prevent high CPU usage (PowerShell is slow)
        const NOW = Date.now();
        if (this.lastMediaCheck && (NOW - this.lastMediaCheck < 5000)) {
            return this.lastMediaResult;
        }

        this.lastMediaCheck = NOW;
        let isActive = false;

        try {
            // Method 1: powercfg (Fastest, catch perms error)
            try {
                const { stdout } = await execAsync('powercfg /requests');
                if (stdout.includes('DISPLAY:') && !stdout.includes('DISPLAY:\r\nNone')) {
                    // Basic check if section is empty
                    const displaySection = stdout.split('DISPLAY:')[1]?.split('SYSTEM:')[0] || '';
                    // Typical "None." or localised equivalent? 
                    // If it has text content that isn't "None.", assume active.
                    if (displaySection.trim().length > 5 && !displaySection.includes('None.')) {
                        isActive = true;
                    }
                }
                if (!isActive && (stdout.includes('Audio') || stdout.includes('audio'))) {
                    isActive = true;
                }
            } catch (e) {
                // Ignore powercfg failures (common without Admin)
            }

            // Method 2: PowerShell Audio Check (Reliable)
            // Checks if 'audiodg' process has > 0 CPU usage
            if (!isActive) {
                // Using Win32_PerfFormattedData_PerfProc_Process to check audiodg usage
                // This works on non-admin usually
                const psCommand = "Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object {$_.Name -eq 'audiodg'} | Select-Object -ExpandProperty PercentProcessorTime";
                const { stdout } = await execAsync(`powershell -NoProfile -Command "${psCommand}"`);
                const cpuUsage = parseInt(stdout.trim(), 10);

                if (!isNaN(cpuUsage) && cpuUsage > 0) {
                    isActive = true;
                }
            }
        } catch (error) {
            console.warn('[IdleDetection] Media check failed:', error);
        }

        this.lastMediaResult = isActive;
        return isActive;
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isEnabled = false;
        this.isIdle = false;
    }

    /**
     * Set idle threshold in seconds
     */
    setThreshold(seconds) {
        this.idleThreshold = seconds;
    }
}

export default new IdleDetection();
