/**
 * SpringBonePhysics - Simple spring physics for hair/clothing simulation
 * Lightweight alternative to full DynamicBone for web use
 */
export class SpringBonePhysics {
    constructor(options = {}) {
        this.stiffness = options.stiffness ?? 0.1;
        this.damping = options.damping ?? 0.8;
        this.gravity = options.gravity ?? -9.8;
        this.windStrength = options.windStrength ?? 0;
        this.windDirection = options.windDirection ?? { x: 1, y: 0, z: 0 };

        this.bones = [];
        this.isActive = true;
    }

    /**
     * Add a bone chain to simulate
     * @param {Object} bone - { transform, initialRotation, parent }
     */
    addBone(bone) {
        this.bones.push({
            transform: bone.transform,
            initialRotation: bone.initialRotation?.clone() || bone.transform.rotation.clone(),
            velocity: { x: 0, y: 0, z: 0 },
            parent: bone.parent
        });
    }

    /**
     * Update physics simulation
     * @param {number} delta - Time delta in seconds
     */
    update(delta) {
        if (!this.isActive) return;

        const dt = Math.min(delta, 0.033); // Cap at ~30fps for stability

        for (const bone of this.bones) {
            if (!bone.transform) continue;

            // Calculate forces
            const gravityForce = this.gravity * 0.01;
            const windForce = this.windStrength * Math.sin(Date.now() * 0.001) * 0.01;

            // Spring force towards initial rotation
            const springX = (bone.initialRotation.x - bone.transform.rotation.x) * this.stiffness;
            const springZ = (bone.initialRotation.z - bone.transform.rotation.z) * this.stiffness;

            // Apply forces
            bone.velocity.x += springX + windForce * this.windDirection.x;
            bone.velocity.z += springZ + gravityForce;

            // Apply damping
            bone.velocity.x *= this.damping;
            bone.velocity.z *= this.damping;

            // Update rotation
            bone.transform.rotation.x += bone.velocity.x * dt;
            bone.transform.rotation.z += bone.velocity.z * dt;

            // Clamp to reasonable limits
            const limit = 0.5;
            bone.transform.rotation.x = Math.max(-limit, Math.min(limit, bone.transform.rotation.x));
            bone.transform.rotation.z = Math.max(-limit, Math.min(limit, bone.transform.rotation.z));
        }
    }

    /**
     * Apply an impulse (e.g., from movement)
     * @param {Object} impulse - { x, y, z } velocity impulse
     */
    applyImpulse(impulse) {
        for (const bone of this.bones) {
            bone.velocity.x += impulse.x * 0.1;
            bone.velocity.z += impulse.z * 0.1;
        }
    }

    /**
     * Set wind parameters
     * @param {number} strength - Wind strength
     * @param {Object} direction - Wind direction { x, y, z }
     */
    setWind(strength, direction = { x: 1, y: 0, z: 0 }) {
        this.windStrength = strength;
        this.windDirection = direction;
    }

    /**
     * Reset all bones to initial state
     */
    reset() {
        for (const bone of this.bones) {
            if (bone.transform && bone.initialRotation) {
                bone.transform.rotation.copy(bone.initialRotation);
                bone.velocity = { x: 0, y: 0, z: 0 };
            }
        }
    }

    dispose() {
        this.bones = [];
        this.isActive = false;
    }
}

/**
 * IdleAnimationController - Manages idle animations and micro-movements
 */
export class IdleAnimationController {
    constructor() {
        this.state = 'idle';
        this.breathingPhase = 0;
        this.swayPhase = 0;
        this.blinkTimer = 0;
        this.nextBlinkTime = 3 + Math.random() * 4;

        this.callbacks = {
            onBlink: null,
            onStateChange: null
        };
    }

    /**
     * Update idle animations
     * @param {number} delta - Time delta
     * @returns {Object} Animation values { breathing, swayX, swayY, shouldBlink }
     */
    update(delta) {
        // Breathing animation (smooth sine wave)
        this.breathingPhase += delta * 0.8;
        const breathing = Math.sin(this.breathingPhase) * 0.02;

        // Subtle body sway
        this.swayPhase += delta * 0.3;
        const swayX = Math.sin(this.swayPhase) * 0.01;
        const swayY = Math.sin(this.swayPhase * 1.3) * 0.005;

        // Blinking
        this.blinkTimer += delta;
        let shouldBlink = false;
        if (this.blinkTimer >= this.nextBlinkTime) {
            shouldBlink = true;
            this.blinkTimer = 0;
            this.nextBlinkTime = 2 + Math.random() * 4;
            this.callbacks.onBlink?.();
        }

        return {
            breathing,
            swayX,
            swayY,
            shouldBlink,
            state: this.state
        };
    }

    /**
     * Set current animation state
     * @param {string} state - 'idle', 'listening', 'thinking', 'speaking', 'happy'
     */
    setState(state) {
        if (this.state !== state) {
            this.state = state;
            this.callbacks.onStateChange?.(state);
        }
    }

    /**
     * Get animation parameters for current state
     * @returns {Object} Animation parameters
     */
    getStateParams() {
        const stateParams = {
            idle: { breathingSpeed: 0.8, swayAmount: 1, expressionIntensity: 0.3 },
            listening: { breathingSpeed: 1.0, swayAmount: 0.5, expressionIntensity: 0.5 },
            thinking: { breathingSpeed: 0.6, swayAmount: 0.3, expressionIntensity: 0.4 },
            speaking: { breathingSpeed: 1.2, swayAmount: 0.7, expressionIntensity: 0.6 },
            happy: { breathingSpeed: 1.4, swayAmount: 1.2, expressionIntensity: 1.0 }
        };
        return stateParams[this.state] || stateParams.idle;
    }

    /**
     * Set callback for events
     * @param {string} event - 'onBlink', 'onStateChange'
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }
}

export default { SpringBonePhysics, IdleAnimationController };
