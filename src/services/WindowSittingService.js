/**
 * WindowSittingService - Detects windows for avatar to sit on
 * Uses Electron's desktopCapturer and native window APIs
 */
export class WindowSittingService {
    constructor() {
        this.isEnabled = false;
        this.windows = [];
        this.taskbarBounds = null;
        this.refreshInterval = null;
        this.onWindowsUpdate = null;

        // Platform detection
        this.platform = process?.platform || 'unknown';
    }

    /**
     * Initialize the service and start monitoring windows
     * @param {Function} onUpdate - Callback when windows list updates
     */
    async initialize(onUpdate) {
        this.onWindowsUpdate = onUpdate;
        this.isEnabled = true;

        // Get initial window list
        await this.refreshWindows();

        // Refresh periodically
        this.refreshInterval = setInterval(() => {
            this.refreshWindows();
        }, 2000);

        // Get taskbar info
        this.detectTaskbar();
    }

    /**
     * Get list of visible windows with their bounds
     */
    async refreshWindows() {
        if (!this.isEnabled) return;

        try {
            // Use Electron IPC if available
            if (window.nizhal?.system?.getWindows) {
                this.windows = await window.nizhal.system.getWindows();
            } else {
                // Fallback: mock windows for development
                this.windows = this.getMockWindows();
            }

            this.onWindowsUpdate?.(this.windows);
        } catch (error) {
            console.error('Failed to get windows:', error);
        }
    }

    /**
     * Detect taskbar position and size
     */
    detectTaskbar() {
        // Default taskbar at bottom of screen
        const screenHeight = window.screen.height;
        const screenWidth = window.screen.width;
        const taskbarHeight = 48; // Common taskbar height

        this.taskbarBounds = {
            x: 0,
            y: screenHeight - taskbarHeight,
            width: screenWidth,
            height: taskbarHeight,
            position: 'bottom'
        };

        // Try to get actual taskbar from Electron
        if (window.nizhal?.system?.getTaskbar) {
            window.nizhal.system.getTaskbar().then(taskbar => {
                if (taskbar) {
                    this.taskbarBounds = taskbar;
                }
            });
        }
    }

    /**
     * Find best position to sit based on active windows
     * @param {Object} avatarSize - { width, height } of avatar
     * @returns {Object|null} Best sitting position { x, y, target }
     */
    findSittingPosition(avatarSize = { width: 100, height: 150 }) {
        if (this.windows.length === 0 && !this.taskbarBounds) {
            return null;
        }

        const positions = [];

        // Check each window's top edge
        for (const win of this.windows) {
            if (win.isMinimized || !win.bounds) continue;

            positions.push({
                x: win.bounds.x + win.bounds.width / 2 - avatarSize.width / 2,
                y: win.bounds.y - avatarSize.height,
                target: 'window',
                windowTitle: win.title,
                priority: 2
            });
        }

        // Check taskbar
        if (this.taskbarBounds) {
            positions.push({
                x: this.taskbarBounds.width / 2 - avatarSize.width / 2,
                y: this.taskbarBounds.y - avatarSize.height,
                target: 'taskbar',
                priority: 1
            });
        }

        // Sort by priority and return best
        positions.sort((a, b) => b.priority - a.priority);
        return positions[0] || null;
    }

    /**
     * Check if a position overlaps with any window
     * @param {Object} pos - { x, y, width, height }
     * @returns {boolean}
     */
    isOverlapping(pos) {
        for (const win of this.windows) {
            if (!win.bounds) continue;

            const overlapsX = pos.x < win.bounds.x + win.bounds.width &&
                pos.x + pos.width > win.bounds.x;
            const overlapsY = pos.y < win.bounds.y + win.bounds.height &&
                pos.y + pos.height > win.bounds.y;

            if (overlapsX && overlapsY) return true;
        }
        return false;
    }

    /**
     * Get mock windows for development/testing
     */
    getMockWindows() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        return [
            {
                id: 1,
                title: 'Browser Window',
                bounds: {
                    x: 100,
                    y: 100,
                    width: screenWidth * 0.6,
                    height: screenHeight * 0.7
                },
                isMinimized: false
            },
            {
                id: 2,
                title: 'Code Editor',
                bounds: {
                    x: screenWidth * 0.4,
                    y: 50,
                    width: screenWidth * 0.5,
                    height: screenHeight * 0.8
                },
                isMinimized: false
            }
        ];
    }

    /**
     * Get current windows list
     */
    getWindows() {
        return this.windows;
    }

    /**
     * Get taskbar bounds
     */
    getTaskbar() {
        return this.taskbarBounds;
    }

    /**
     * Cleanup
     */
    dispose() {
        this.isEnabled = false;
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.windows = [];
    }
}

export default WindowSittingService;
