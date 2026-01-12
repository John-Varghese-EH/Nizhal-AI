/**
 * AvatarStateController.js
 * 
 * Manages animation states for VRM avatars similar to Mate-Engine's
 * AvatarAnimatorController. Controls transitions between idle, dragging,
 * sitting, dancing, sleeping, and emotional states.
 */

// Animation States
export const AvatarState = {
    IDLE: 'idle',
    DRAGGING: 'dragging',
    SITTING: 'sitting',
    SITTING_WINDOW: 'sitting_window',
    SITTING_TASKBAR: 'sitting_taskbar',
    DANCING: 'dancing',
    SLEEPING: 'sleeping',
    // Emotional states
    HAPPY: 'happy',
    SAD: 'sad',
    EXCITED: 'excited',
    EMBARRASSED: 'embarrassed',
    THINKING: 'thinking',
    SPEAKING: 'speaking'
};

// State transition rules - which states can transition to which
const TRANSITION_RULES = {
    [AvatarState.IDLE]: [AvatarState.DRAGGING, AvatarState.SITTING, AvatarState.SITTING_WINDOW, AvatarState.SITTING_TASKBAR, AvatarState.DANCING, AvatarState.SLEEPING, AvatarState.HAPPY, AvatarState.SAD, AvatarState.EXCITED, AvatarState.EMBARRASSED, AvatarState.THINKING, AvatarState.SPEAKING],
    [AvatarState.DRAGGING]: [AvatarState.IDLE, AvatarState.SITTING, AvatarState.SITTING_WINDOW, AvatarState.SITTING_TASKBAR],
    [AvatarState.SITTING]: [AvatarState.IDLE, AvatarState.DRAGGING, AvatarState.SLEEPING, AvatarState.HAPPY],
    [AvatarState.SITTING_WINDOW]: [AvatarState.IDLE, AvatarState.DRAGGING, AvatarState.SLEEPING],
    [AvatarState.SITTING_TASKBAR]: [AvatarState.IDLE, AvatarState.DRAGGING, AvatarState.SLEEPING],
    [AvatarState.DANCING]: [AvatarState.IDLE],
    [AvatarState.SLEEPING]: [AvatarState.IDLE, AvatarState.DRAGGING],
    [AvatarState.HAPPY]: [AvatarState.IDLE, AvatarState.DRAGGING],
    [AvatarState.SAD]: [AvatarState.IDLE, AvatarState.DRAGGING],
    [AvatarState.EXCITED]: [AvatarState.IDLE, AvatarState.DRAGGING],
    [AvatarState.EMBARRASSED]: [AvatarState.IDLE],
    [AvatarState.THINKING]: [AvatarState.IDLE, AvatarState.SPEAKING],
    [AvatarState.SPEAKING]: [AvatarState.IDLE, AvatarState.THINKING]
};

// State-specific animation parameters
export const STATE_ANIMATIONS = {
    [AvatarState.IDLE]: {
        breathingSpeed: 1.5,
        breathingAmplitude: 0.01,
        swaySpeed: 0.5,
        swayAmplitude: 0.003,
        expression: 'neutral',
        expressionWeight: 0.3
    },
    [AvatarState.DRAGGING]: {
        breathingSpeed: 0,
        breathingAmplitude: 0,
        swaySpeed: 0,
        swayAmplitude: 0,
        expression: 'surprised',
        expressionWeight: 0.6,
        floatSpeed: 3,
        floatAmplitude: 0.02
    },
    [AvatarState.SITTING]: {
        breathingSpeed: 1.2,
        breathingAmplitude: 0.008,
        swaySpeed: 0.3,
        swayAmplitude: 0.002,
        expression: 'relaxed',
        expressionWeight: 0.5,
        poseRotation: { x: 0, y: 0, z: 0 }
    },
    [AvatarState.SITTING_TASKBAR]: {
        breathingSpeed: 1.2,
        breathingAmplitude: 0.008,
        swaySpeed: 0.3,
        swayAmplitude: 0.002,
        expression: 'relaxed',
        expressionWeight: 0.5,
        legDangle: true
    },
    [AvatarState.SITTING_WINDOW]: {
        breathingSpeed: 1.2,
        breathingAmplitude: 0.008,
        swaySpeed: 0.4,
        swayAmplitude: 0.003,
        expression: 'relaxed',
        expressionWeight: 0.4,
        legDangle: true
    },
    [AvatarState.DANCING]: {
        breathingSpeed: 2.5,
        breathingAmplitude: 0.02,
        swaySpeed: 0,
        swayAmplitude: 0,
        expression: 'happy',
        expressionWeight: 0.8,
        bounceSpeed: 4,
        bounceAmplitude: 0.03
    },
    [AvatarState.SLEEPING]: {
        breathingSpeed: 0.8,
        breathingAmplitude: 0.015,
        swaySpeed: 0,
        swayAmplitude: 0,
        expression: 'blink',
        expressionWeight: 1.0,
        headTilt: -0.1
    },
    [AvatarState.HAPPY]: {
        breathingSpeed: 1.8,
        breathingAmplitude: 0.012,
        swaySpeed: 1,
        swayAmplitude: 0.005,
        expression: 'happy',
        expressionWeight: 0.9
    },
    [AvatarState.SAD]: {
        breathingSpeed: 1.0,
        breathingAmplitude: 0.008,
        swaySpeed: 0.2,
        swayAmplitude: 0.001,
        expression: 'sad',
        expressionWeight: 0.7
    },
    [AvatarState.EXCITED]: {
        breathingSpeed: 2.0,
        breathingAmplitude: 0.015,
        swaySpeed: 2,
        swayAmplitude: 0.008,
        expression: 'happy',
        expressionWeight: 1.0
    },
    [AvatarState.EMBARRASSED]: {
        breathingSpeed: 1.5,
        breathingAmplitude: 0.01,
        swaySpeed: 0.5,
        swayAmplitude: 0.003,
        expression: 'embarrassed',
        expressionWeight: 0.8
    },
    [AvatarState.THINKING]: {
        breathingSpeed: 1.2,
        breathingAmplitude: 0.01,
        swaySpeed: 0.3,
        swayAmplitude: 0.002,
        expression: 'neutral',
        expressionWeight: 0.5
    },
    [AvatarState.SPEAKING]: {
        breathingSpeed: 1.5,
        breathingAmplitude: 0.01,
        swaySpeed: 0.5,
        swayAmplitude: 0.003,
        expression: 'neutral',
        expressionWeight: 0.3,
        mouthAnimation: true
    }
};

/**
 * AvatarStateController - Manages avatar animation states and transitions
 */
export class AvatarStateController {
    constructor() {
        this.currentState = AvatarState.IDLE;
        this.previousState = null;
        this.stateStartTime = Date.now();
        this.transitionProgress = 1.0; // 0-1, 1 = complete
        this.transitionDuration = 300; // ms
        this.listeners = new Set();

        // Emotional state timeout (auto-return to idle)
        this.emotionalStateTimeout = null;
        this.emotionalStateDuration = 3000; // 3 seconds

        // State history for analytics/behavior
        this.stateHistory = [];
        this.maxHistoryLength = 50;
    }

    /**
     * Get current state
     */
    getState() {
        return this.currentState;
    }

    /**
     * Get animation parameters for current state
     */
    getAnimationParams() {
        const currentParams = STATE_ANIMATIONS[this.currentState] || STATE_ANIMATIONS[AvatarState.IDLE];

        // If transitioning, blend parameters
        if (this.transitionProgress < 1.0 && this.previousState) {
            const prevParams = STATE_ANIMATIONS[this.previousState] || STATE_ANIMATIONS[AvatarState.IDLE];
            return this._blendParams(prevParams, currentParams, this.transitionProgress);
        }

        return currentParams;
    }

    /**
     * Blend animation parameters during transitions
     */
    _blendParams(from, to, progress) {
        const eased = this._easeInOutCubic(progress);
        const blended = {};

        for (const key of Object.keys(to)) {
            if (typeof to[key] === 'number' && typeof from[key] === 'number') {
                blended[key] = from[key] + (to[key] - from[key]) * eased;
            } else {
                // For non-numeric values, switch at midpoint
                blended[key] = progress > 0.5 ? to[key] : from[key];
            }
        }

        return blended;
    }

    /**
     * Easing function for smooth transitions
     */
    _easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Check if transition is allowed
     */
    canTransitionTo(newState) {
        const allowed = TRANSITION_RULES[this.currentState];
        return allowed && allowed.includes(newState);
    }

    /**
     * Transition to a new state
     */
    setState(newState, options = {}) {
        const { force = false, duration = this.transitionDuration } = options;

        if (newState === this.currentState) return false;

        if (!force && !this.canTransitionTo(newState)) {
            console.warn(`[AvatarState] Cannot transition from ${this.currentState} to ${newState}`);
            return false;
        }

        // Clear any pending emotional timeout
        if (this.emotionalStateTimeout) {
            clearTimeout(this.emotionalStateTimeout);
            this.emotionalStateTimeout = null;
        }

        // Record history
        this._recordStateChange(newState);

        // Begin transition
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateStartTime = Date.now();
        this.transitionProgress = 0;
        this.transitionDuration = duration;

        // Notify listeners
        this._notifyListeners('stateChange', {
            from: this.previousState,
            to: this.currentState
        });

        // Set auto-return timeout for emotional states
        const emotionalStates = [AvatarState.HAPPY, AvatarState.SAD, AvatarState.EXCITED, AvatarState.EMBARRASSED];
        if (emotionalStates.includes(newState)) {
            this.emotionalStateTimeout = setTimeout(() => {
                this.setState(AvatarState.IDLE);
            }, this.emotionalStateDuration);
        }

        console.log(`[AvatarState] ${this.previousState} → ${this.currentState}`);
        return true;
    }

    /**
     * Update transition progress (call each frame)
     */
    update(deltaTime) {
        if (this.transitionProgress < 1.0) {
            const elapsed = Date.now() - this.stateStartTime;
            this.transitionProgress = Math.min(1.0, elapsed / this.transitionDuration);

            if (this.transitionProgress >= 1.0) {
                this._notifyListeners('transitionComplete', {
                    state: this.currentState
                });
            }
        }
    }

    /**
     * Record state change in history
     */
    _recordStateChange(newState) {
        this.stateHistory.push({
            from: this.currentState,
            to: newState,
            timestamp: Date.now()
        });

        // Trim history
        if (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners
     */
    _notifyListeners(event, data) {
        for (const listener of this.listeners) {
            try {
                listener(event, data);
            } catch (err) {
                console.error('[AvatarState] Listener error:', err);
            }
        }
    }

    /**
     * Get time in current state (ms)
     */
    getTimeInState() {
        return Date.now() - this.stateStartTime;
    }

    /**
     * Check if avatar is in an active/awake state
     */
    isAwake() {
        return this.currentState !== AvatarState.SLEEPING;
    }

    /**
     * Check if avatar is sitting (window or taskbar)
     */
    isSitting() {
        return this.currentState === AvatarState.SITTING ||
            this.currentState === AvatarState.SITTING_WINDOW ||
            this.currentState === AvatarState.SITTING_TASKBAR;
    }

    /**
     * Check if avatar is in emotional state
     */
    isEmotional() {
        const emotionalStates = [AvatarState.HAPPY, AvatarState.SAD, AvatarState.EXCITED, AvatarState.EMBARRASSED];
        return emotionalStates.includes(this.currentState);
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.emotionalStateTimeout) {
            clearTimeout(this.emotionalStateTimeout);
        }
        this.listeners.clear();
        this.stateHistory = [];
    }
}

// Singleton instance
let instance = null;

export function getAvatarStateController() {
    if (!instance) {
        instance = new AvatarStateController();
    }
    return instance;
}

export default AvatarStateController;
