/**
 * ExpressionController - Dynamic expressions based on character movement and state
 * Tracks mouse position, velocity, and triggers appropriate expressions
 */
export class ExpressionController {
    constructor() {
        this.currentExpression = 'neutral';
        this.expressionIntensity = 0;
        this.callbacks = new Set();

        // Movement tracking
        this.lastPosition = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };

        // Expression timers
        this.expressionTimer = null;
        this.blinkTimer = null;
        this.nextBlinkTime = 3000 + Math.random() * 4000;

        // State
        this.isMoving = false;
        this.isFalling = false;
        this.isSpinning = false;
        this.isDragging = false;

        // Expression queue
        this.expressionQueue = [];

        // Expression mappings (extended for emotion system)
        this.expressionMap = {
            neutral: { eyes: 'normal', mouth: 'neutral', brows: 'normal' },
            happy: { eyes: 'happy', mouth: 'smile', brows: 'raised' },
            surprised: { eyes: 'wide', mouth: 'o', brows: 'raised' },
            dizzy: { eyes: 'spiral', mouth: 'wavy', brows: 'normal' },
            scared: { eyes: 'wide', mouth: 'small', brows: 'worried' },
            sleepy: { eyes: 'closed', mouth: 'neutral', brows: 'relaxed' },
            excited: { eyes: 'sparkle', mouth: 'grin', brows: 'raised' },
            thinking: { eyes: 'look_up', mouth: 'hmm', brows: 'raised' },
            // New emotions for AI personality modes
            sad: { eyes: 'down', mouth: 'frown', brows: 'worried' },
            concerned: { eyes: 'soft', mouth: 'slight_frown', brows: 'worried' },
            playful: { eyes: 'wink', mouth: 'smirk', brows: 'raised' }
        };
    }

    /**
     * Initialize the controller
     */
    initialize() {
        this.startBlinkLoop();
    }

    /**
     * Update position and calculate movement expressions
     * @param {Object} position - { x, y } current position
     */
    updatePosition(position) {
        const now = Date.now();

        // Calculate velocity
        const dx = position.x - this.lastPosition.x;
        const dy = position.y - this.lastPosition.y;

        const lastVelocity = { ...this.velocity };
        this.velocity = { x: dx, y: dy };

        // Calculate acceleration
        this.acceleration = {
            x: this.velocity.x - lastVelocity.x,
            y: this.velocity.y - lastVelocity.y
        };

        // Detect movement states
        const speed = Math.sqrt(dx * dx + dy * dy);
        this.isMoving = speed > 5;
        this.isFalling = dy > 10;
        this.isSpinning = Math.abs(dx) > 20;

        // Trigger expressions based on movement
        if (this.isFalling && dy > 30) {
            this.setExpression('scared', 1.0);
        } else if (this.isSpinning) {
            this.setExpression('dizzy', 0.8);
        } else if (this.isMoving && speed > 15) {
            this.setExpression('excited', 0.6);
        } else if (!this.isMoving && !this.expressionQueue.length) {
            this.fadeToNeutral();
        }

        this.lastPosition = { ...position };
    }

    /**
     * Set expression with duration
     */
    setExpression(expression, intensity = 1.0, duration = 2000) {
        if (!this.expressionMap[expression]) return;

        this.currentExpression = expression;
        this.expressionIntensity = intensity;

        this.notifyListeners();

        // Auto-reset after duration
        if (this.expressionTimer) {
            clearTimeout(this.expressionTimer);
        }

        if (duration > 0) {
            this.expressionTimer = setTimeout(() => {
                this.fadeToNeutral();
            }, duration);
        }
    }

    /**
     * Gradually return to neutral expression
     */
    fadeToNeutral() {
        if (this.currentExpression === 'neutral') return;

        // Smooth fade
        const fade = () => {
            this.expressionIntensity -= 0.1;
            if (this.expressionIntensity <= 0) {
                this.currentExpression = 'neutral';
                this.expressionIntensity = 0;
            }
            this.notifyListeners();

            if (this.expressionIntensity > 0) {
                requestAnimationFrame(fade);
            }
        };

        fade();
    }

    /**
     * Start the blinking loop
     */
    startBlinkLoop() {
        const blink = () => {
            // Trigger blink
            const prevExpression = this.currentExpression;
            this.triggerBlink();

            // Schedule next blink
            this.nextBlinkTime = 2000 + Math.random() * 5000;
            this.blinkTimer = setTimeout(blink, this.nextBlinkTime);
        };

        this.blinkTimer = setTimeout(blink, this.nextBlinkTime);
    }

    /**
     * Trigger a single blink
     */
    triggerBlink() {
        this.callbacks.forEach(cb => cb({
            type: 'blink',
            expression: this.currentExpression,
            intensity: this.expressionIntensity
        }));
    }

    /**
     * Trigger expression for specific events (extended for emotion system)
     */
    onEvent(event) {
        switch (event) {
            // Interaction events
            case 'pickup':
                this.setExpression('surprised', 1.0, 500);
                break;
            case 'drop':
                this.setExpression('scared', 0.8, 1500);
                break;
            case 'pat':
                this.setExpression('happy', 1.0, 3000);
                break;
            case 'poke':
                this.setExpression('surprised', 0.6, 1000);
                break;
            case 'dance':
                this.setExpression('excited', 1.0, 0); // No auto-reset
                break;
            case 'sit':
                this.setExpression('neutral', 0.5, 0);
                break;
            // AI state events
            case 'thinking':
                this.setExpression('thinking', 0.8, 0);
                break;
            case 'speaking':
                this.setExpression('happy', 0.5, 0);
                break;
            // Emotion events (from NizhalAI / QuickMenu)
            case 'happy':
                this.setExpression('happy', 0.9, 5000);
                break;
            case 'sad':
                this.setExpression('sad', 0.7, 5000);
                break;
            case 'excited':
                this.setExpression('excited', 1.0, 5000);
                break;
            case 'concerned':
                this.setExpression('concerned', 0.6, 5000);
                break;
            case 'playful':
                this.setExpression('playful', 0.8, 5000);
                break;
            case 'neutral':
                this.fadeToNeutral();
                break;
            default:
                // Try to set as expression directly if it exists in the map
                if (this.expressionMap[event]) {
                    this.setExpression(event, 0.8, 5000);
                }
        }
    }

    /**
     * Get current expression data
     */
    getExpression() {
        return {
            name: this.currentExpression,
            intensity: this.expressionIntensity,
            details: this.expressionMap[this.currentExpression],
            isMoving: this.isMoving,
            isFalling: this.isFalling
        };
    }

    /**
     * Subscribe to expression changes
     */
    onExpressionChange(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.callbacks.forEach(cb => cb({
            type: 'expression',
            expression: this.currentExpression,
            intensity: this.expressionIntensity,
            details: this.expressionMap[this.currentExpression]
        }));
    }

    /**
     * Set dragging state
     */
    setDragging(isDragging) {
        this.isDragging = isDragging;
        if (isDragging) {
            this.onEvent('pickup');
        } else {
            this.onEvent('drop');
        }
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.expressionTimer) clearTimeout(this.expressionTimer);
        if (this.blinkTimer) clearTimeout(this.blinkTimer);
        this.callbacks.clear();
    }
}

export default ExpressionController;
