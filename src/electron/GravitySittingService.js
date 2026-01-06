import { screen } from 'electron';

/**
 * GravitySittingService - Makes avatar sit on windows with physics
 * Detects windows and taskbar, applies gravity to avatar position
 */
export class GravitySittingService {
    constructor(windowManager) {
        this.windowManager = windowManager;
        this.isEnabled = false;
        this.isSitting = false;
        this.sittingTarget = null;

        // Physics state
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.gravity = 0.5;
        this.friction = 0.95;
        this.bounce = 0.3;

        // Animation
        this.animationFrame = null;
        this.lastUpdate = Date.now();

        // Screen bounds
        this.screenBounds = null;
        this.taskbarBounds = null;

        // Sitting positions
        this.sittingPositions = [];
    }

    /**
     * Initialize the service
     */
    async initialize() {
        this.updateScreenInfo();
        this.isEnabled = true;

        // Get initial position from character window
        const pos = this.windowManager?.getCharacterPosition();
        if (pos) {
            this.position = { x: pos.x, y: pos.y };
        }

        this.startPhysicsLoop();
    }

    /**
     * Update screen and taskbar information
     */
    updateScreenInfo() {
        const primaryDisplay = screen.getPrimaryDisplay();
        this.screenBounds = primaryDisplay.workArea;

        // Detect taskbar position
        const fullBounds = primaryDisplay.bounds;
        const workArea = primaryDisplay.workArea;

        if (workArea.y > fullBounds.y) {
            // Taskbar at top
            this.taskbarBounds = {
                x: fullBounds.x,
                y: fullBounds.y,
                width: fullBounds.width,
                height: workArea.y - fullBounds.y,
                position: 'top'
            };
        } else if (workArea.height < fullBounds.height) {
            // Taskbar at bottom
            this.taskbarBounds = {
                x: fullBounds.x,
                y: workArea.y + workArea.height,
                width: fullBounds.width,
                height: fullBounds.height - workArea.height,
                position: 'bottom'
            };
        } else if (workArea.x > fullBounds.x) {
            // Taskbar at left
            this.taskbarBounds = {
                x: fullBounds.x,
                y: fullBounds.y,
                width: workArea.x - fullBounds.x,
                height: fullBounds.height,
                position: 'left'
            };
        } else if (workArea.width < fullBounds.width) {
            // Taskbar at right
            this.taskbarBounds = {
                x: workArea.x + workArea.width,
                y: fullBounds.y,
                width: fullBounds.width - workArea.width,
                height: fullBounds.height,
                position: 'right'
            };
        }
    }

    /**
     * Start physics simulation loop
     */
    startPhysicsLoop() {
        const update = () => {
            if (!this.isEnabled) return;

            const now = Date.now();
            const delta = Math.min((now - this.lastUpdate) / 16.67, 3); // Cap at 3x speed
            this.lastUpdate = now;

            this.updatePhysics(delta);

            this.animationFrame = requestAnimationFrame(update);
        };

        update();
    }

    /**
     * Update physics simulation
     */
    updatePhysics(delta) {
        if (!this.windowManager) return;

        const charBounds = this.windowManager.getCharacterPosition();
        if (!charBounds) return;

        const charWidth = charBounds.width || 200;
        const charHeight = charBounds.height || 300;

        // Apply gravity if not sitting
        if (!this.isSitting) {
            this.velocity.y += this.gravity * delta;
        }

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Update position
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;

        // Check for taskbar collision (sitting on taskbar)
        if (this.taskbarBounds && this.taskbarBounds.position === 'bottom') {
            const taskbarTop = this.taskbarBounds.y;
            const charBottom = this.position.y + charHeight;

            if (charBottom >= taskbarTop) {
                this.position.y = taskbarTop - charHeight;
                this.velocity.y *= -this.bounce;

                // Settle into sitting
                if (Math.abs(this.velocity.y) < 1) {
                    this.velocity.y = 0;
                    this.isSitting = true;
                    this.sittingTarget = { type: 'taskbar', ...this.taskbarBounds };
                }
            }
        }

        // Check screen bounds
        if (this.screenBounds) {
            // Left bound
            if (this.position.x < this.screenBounds.x) {
                this.position.x = this.screenBounds.x;
                this.velocity.x *= -this.bounce;
            }
            // Right bound
            if (this.position.x + charWidth > this.screenBounds.x + this.screenBounds.width) {
                this.position.x = this.screenBounds.x + this.screenBounds.width - charWidth;
                this.velocity.x *= -this.bounce;
            }
            // Top bound
            if (this.position.y < this.screenBounds.y) {
                this.position.y = this.screenBounds.y;
                this.velocity.y *= -this.bounce;
            }
            // Bottom bound (screen edge, not taskbar)
            if (!this.taskbarBounds && this.position.y + charHeight > this.screenBounds.y + this.screenBounds.height) {
                this.position.y = this.screenBounds.y + this.screenBounds.height - charHeight;
                this.velocity.y *= -this.bounce;
                this.isSitting = true;
                this.sittingTarget = { type: 'screen-bottom' };
            }
        }

        // Apply position to window
        this.windowManager.setCharacterPosition(
            Math.round(this.position.x),
            Math.round(this.position.y)
        );
    }

    /**
     * Make character jump
     */
    jump(force = 15) {
        this.isSitting = false;
        this.sittingTarget = null;
        this.velocity.y = -force;
        this.velocity.x = (Math.random() - 0.5) * 5;
    }

    /**
     * Push character in a direction
     */
    push(x, y) {
        this.isSitting = false;
        this.velocity.x += x;
        this.velocity.y += y;
    }

    /**
     * Teleport to position
     */
    teleport(x, y) {
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };
        this.isSitting = false;
    }

    /**
     * Drop from current position with gravity
     */
    drop() {
        this.isSitting = false;
        this.sittingTarget = null;
        this.velocity.y = 0;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            position: { ...this.position },
            velocity: { ...this.velocity },
            isSitting: this.isSitting,
            sittingTarget: this.sittingTarget
        };
    }

    /**
     * Enable/disable gravity
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (enabled) {
            this.startPhysicsLoop();
        }
    }

    /**
     * Cleanup
     */
    dispose() {
        this.isEnabled = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

export default GravitySittingService;
