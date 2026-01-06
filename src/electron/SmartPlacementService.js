import { screen } from 'electron';

/**
 * SmartPlacementService - Intelligent character positioning
 * Finds optimal position: sit on windows, taskbar, or fallback to bottom-left
 */
export class SmartPlacementService {
    constructor() {
        this.currentPosition = null;
        this.sittingTarget = null;
        this.fallbackPosition = { corner: 'bottom-left', padding: 20 };
    }

    /**
     * Find best position for character
     * Priority: 1) Sit on window top edge 2) Taskbar 3) Bottom-left corner
     */
    findBestPosition(characterSize = { width: 200, height: 300 }) {
        const displays = screen.getAllDisplays();
        const primary = screen.getPrimaryDisplay();
        const workArea = primary.workArea;
        const fullBounds = primary.bounds;

        // Calculate taskbar info
        const taskbar = this.detectTaskbar(fullBounds, workArea);

        // Default fallback: bottom-left
        const fallback = {
            x: workArea.x + this.fallbackPosition.padding,
            y: workArea.y + workArea.height - characterSize.height - this.fallbackPosition.padding,
            type: 'corner',
            corner: 'bottom-left'
        };

        // If taskbar at bottom, sit on it
        if (taskbar && taskbar.position === 'bottom') {
            return {
                x: workArea.x + workArea.width - characterSize.width - 50,
                y: taskbar.y - characterSize.height,
                type: 'taskbar'
            };
        }

        // Otherwise use fallback
        return fallback;
    }

    /**
     * Detect taskbar position and bounds
     */
    detectTaskbar(fullBounds, workArea) {
        const taskbarHeight = fullBounds.height - workArea.height;
        const taskbarWidth = fullBounds.width - workArea.width;

        if (workArea.y > fullBounds.y) {
            return { position: 'top', y: fullBounds.y, height: workArea.y - fullBounds.y };
        } else if (taskbarHeight > 0 && workArea.y === fullBounds.y) {
            return { position: 'bottom', y: workArea.y + workArea.height, height: taskbarHeight };
        } else if (workArea.x > fullBounds.x) {
            return { position: 'left', x: fullBounds.x, width: workArea.x - fullBounds.x };
        } else if (taskbarWidth > 0) {
            return { position: 'right', x: workArea.x + workArea.width, width: taskbarWidth };
        }
        return null;
    }

    /**
     * Get all available placement options
     */
    getPlacementOptions(characterSize = { width: 200, height: 300 }) {
        const primary = screen.getPrimaryDisplay();
        const { workArea } = primary;
        const padding = 20;

        return {
            corners: {
                'top-left': { x: workArea.x + padding, y: workArea.y + padding },
                'top-right': { x: workArea.x + workArea.width - characterSize.width - padding, y: workArea.y + padding },
                'bottom-left': { x: workArea.x + padding, y: workArea.y + workArea.height - characterSize.height - padding },
                'bottom-right': { x: workArea.x + workArea.width - characterSize.width - padding, y: workArea.y + workArea.height - characterSize.height - padding }
            },
            center: {
                x: workArea.x + (workArea.width - characterSize.width) / 2,
                y: workArea.y + (workArea.height - characterSize.height) / 2
            },
            taskbar: this.findBestPosition(characterSize)
        };
    }

    /**
     * Check if position is valid (within screen bounds)
     */
    isValidPosition(position, characterSize) {
        const primary = screen.getPrimaryDisplay();
        const { workArea } = primary;

        return (
            position.x >= workArea.x &&
            position.y >= workArea.y &&
            position.x + characterSize.width <= workArea.x + workArea.width &&
            position.y + characterSize.height <= workArea.y + workArea.height
        );
    }
}

export default SmartPlacementService;
