import { powerMonitor } from 'electron';

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

        this.checkInterval = setInterval(() => {
            const idleTime = powerMonitor.getSystemIdleTime();

            if (!this.isIdle && idleTime >= this.idleThreshold) {
                // User has gone idle
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
