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
     * @param {Object} callbacks - { onIdle, onActive }
     */
    start({ onIdle, onActive }) {
        if (this.isEnabled) return;

        this.isEnabled = true;
        this.onIdle = onIdle;
        this.onActive = onActive;
        this.isIdle = false;

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
