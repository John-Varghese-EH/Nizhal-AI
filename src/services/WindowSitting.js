import { getAvatarStateController, AvatarState } from './AvatarStateController';

/**
 * WindowSittingService
 * Manages the logic for detecting valid sitting surfaces (windows/taskbar)
 * and triggering sitting behavior.
 */
class WindowSittingService {
    constructor() {
        this.enabled = false;
        this.isSitting = false;
        this.currentSupport = null; // { type: 'window'|'taskbar', rect: {}, id: '' }

        // Thresholds
        this.sitDistanceThreshold = 50; // Pixels distance to snap
        this.minWidthToSit = 200; // Minimum width of window to sit on

        this.cleanupListener = null;
    }

    /**
     * Initialize service
     */
    async initialize() {
        // Listen for window updates from main process
        if (window.nizhal && window.nizhal.on) {
            this.cleanupListener = window.nizhal.on('window:update', this.handleWindowUpdate.bind(this));
        }
    }

    /**
     * Toggle sitting mode
     * @param {boolean} enable 
     */
    async setEnabled(enable) {
        this.enabled = enable;

        if (window.nizhal) {
            await window.nizhal.window.toggleDetection(enable);
        }

        if (!enable && this.isSitting) {
            this.stopSitting();
        }
    }

    /**
     * Stop sitting and return to idle
     */
    stopSitting() {
        if (!this.isSitting) return;

        this.isSitting = false;
        this.currentSupport = null;
        getAvatarStateController().setState(AvatarState.IDLE);
    }

    /**
     * Handle window data update
     * @param {Object} data - { windows: [], taskbar: {}, character: {} }
     */
    handleWindowUpdate(data) {
        if (!this.enabled) return;
        if (!data.character) return;

        const { windows, taskbar, character } = data;
        const charRect = character;
        const charBottom = charRect.y + charRect.height;
        const charCenter = charRect.x + charRect.width / 2;

        // Check if currently dragging or doing something else
        const currentState = getAvatarStateController().getState();
        if (currentState === AvatarState.DRAGGING || currentState === AvatarState.DANCING) {
            return;
        }

        // Find nearest potential support below character
        let nearestSupport = null;
        let minDistance = Infinity;

        // check windows
        if (windows && Array.isArray(windows)) {
            for (const win of windows) {
                // Skip if window is too small
                if (win.Width < this.minWidthToSit) continue;

                // Check if character is horizontally within window bounds
                const winLeft = win.X;
                const winRight = win.X + win.Width;

                if (charCenter >= winLeft && charCenter <= winRight) {
                    // Check vertical distance (window top vs character bottom)
                    // We want windows strictly BELOW the character
                    if (win.Y >= charBottom - 20) { // Allow slight overlap
                        const dist = win.Y - charBottom;
                        if (dist >= -20 && dist < this.sitDistanceThreshold && dist < minDistance) {
                            minDistance = dist;
                            nearestSupport = {
                                type: 'window',
                                rect: win,
                                y: win.Y
                            };
                        }
                    }
                }
            }
        }

        // check taskbar if no window found yet or taskbar is closer
        if (taskbar) {
            let tbY = taskbar.y;
            if (taskbar.position === 'bottom') {
                // Taskbar is at bottom, use its Y
                tbY = taskbar.y;
            } else if (taskbar.position === 'top') {
                // Ignore top taskbar for sitting (gravity pulls down)
                tbY = Infinity;
            }

            // Check formatted like window
            // If horizontal within taskbar (usually full width so yes)
            if (charCenter >= taskbar.x && charCenter <= (taskbar.x + taskbar.width)) {
                const dist = tbY - charBottom;
                if (dist >= -20 && dist < this.sitDistanceThreshold && dist < minDistance) {
                    minDistance = dist;
                    nearestSupport = {
                        type: 'taskbar',
                        rect: taskbar,
                        y: tbY
                    };
                }
            }
        }

        // Logic to update state
        if (nearestSupport) {
            if (!this.isSitting || this.currentSupport?.y !== nearestSupport.y) {
                // Snap to support
                // Only snap if close enough and not already sitting there
                this.isSitting = true;
                this.currentSupport = nearestSupport;

                getAvatarStateController().setState(AvatarState.SITTING);

                // Ideally we would snap the window position perfectly here
                // But simply setting state to SITTING might be enough if visualization handles leg placement
                // For now, let's just update state. 
                // Future improvement: enable window snapping IPC command
            }
        } else if (this.isSitting) {
            // Lost support (e.g. window moved away) -> Fall / Return to idle
            this.isSitting = false;
            this.currentSupport = null;
            getAvatarStateController().setState(AvatarState.IDLE); // Or FALLING if gravity enabled
        }
    }
}

export const windowSittingService = new WindowSittingService();
