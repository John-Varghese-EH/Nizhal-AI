/**
 * MouseInteractionService.js
 * 
 * Tracks global mouse position and provides interaction triggers for VRM avatar.
 * Features:
 * - Global cursor position tracking (across entire screen via Electron)
 * - Local cursor position (within app window)
 * - Proximity detection for hand grabbing
 * - Head/eye follow calculations
 */

import * as THREE from 'three';

// Interaction zones
const INTERACTION_ZONES = {
    HEAD: { radius: 0.3, trigger: 'headPat' },
    LEFT_HAND: { radius: 0.25, trigger: 'grabLeft' },
    RIGHT_HAND: { radius: 0.25, trigger: 'grabRight' },
    BODY: { radius: 0.4, trigger: 'poke' }
};

/**
 * MouseInteractionService - Handles cursor tracking and interaction triggers
 */
export class MouseInteractionService {
    constructor() {
        // Cursor positions
        this.screenPosition = { x: 0, y: 0 }; // Global screen position
        this.normalizedPosition = { x: 0, y: 0 }; // -1 to 1 range
        this.worldPosition = new THREE.Vector3(); // 3D world position

        // Avatar reference points
        this.avatarPosition = new THREE.Vector3(0, 0, 0);
        this.headPosition = new THREE.Vector3(0, 1.5, 0);
        this.leftHandPosition = new THREE.Vector3(-0.3, 1.0, 0);
        this.rightHandPosition = new THREE.Vector3(0.3, 1.0, 0);

        // Tracking state
        this.isTracking = false;
        this.lastUpdateTime = 0;
        this.updateInterval = 16; // ~60fps

        // Interaction state
        this.currentInteraction = null;
        this.interactionCallbacks = new Set();

        // Look-at calculations
        this.lookAtTarget = new THREE.Vector3(0, 1.5, 2);
        this.smoothLookAt = new THREE.Vector3(0, 1.5, 2);
        this.lookAtSmoothing = 0.1;

        // Hand grab state
        this.isGrabbingLeft = false;
        this.isGrabbingRight = false;
        this.grabThreshold = 0.3;

        // Window bounds (for character positioning)
        this.windowBounds = { x: 0, y: 0, width: 200, height: 300 };

        // Bind methods
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onElectronMouseUpdate = this._onElectronMouseUpdate.bind(this);
    }

    /**
     * Initialize tracking
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        const {
            windowBounds = this.windowBounds,
            useElectronTracking = true
        } = options;

        this.windowBounds = windowBounds;

        // Start browser mouse tracking
        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', this._onMouseMove);
        }

        // Start Electron global mouse tracking if available
        if (useElectronTracking && window.nizhal?.on) {
            window.nizhal.on('mouse:position', this._onElectronMouseUpdate);
            // Request mouse tracking from main process
            window.nizhal.invoke('mouse:startTracking').catch(() => {
                console.log('[MouseInteraction] Electron mouse tracking not available');
            });
        }

        this.isTracking = true;
        console.log('[MouseInteractionService] Initialized');
        return true;
    }

    /**
     * Handle browser mouse move events
     */
    _onMouseMove(event) {
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateInterval) return;
        this.lastUpdateTime = now;

        // Normalize to -1 to 1 range
        this.normalizedPosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.normalizedPosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update look-at target
        this._updateLookAtTarget();

        // Check for interactions
        this._checkInteractions();
    }

    /**
     * Handle Electron global mouse position updates
     */
    _onElectronMouseUpdate(data) {
        const { x, y, screenWidth, screenHeight } = data;

        this.screenPosition.x = x;
        this.screenPosition.y = y;

        // Calculate position relative to character window
        const relX = x - this.windowBounds.x;
        const relY = y - this.windowBounds.y;

        // Normalize relative to window
        this.normalizedPosition.x = (relX / this.windowBounds.width) * 2 - 1;
        this.normalizedPosition.y = -(relY / this.windowBounds.height) * 2 + 1;

        // Update look-at target
        this._updateLookAtTarget();

        // Check for interactions
        this._checkInteractions();
    }

    /**
     * Update look-at target based on cursor position
     */
    _updateLookAtTarget() {
        // Convert normalized position to world space
        // Cursor position maps to a point in front of the avatar
        this.lookAtTarget.set(
            this.normalizedPosition.x * 2, // Horizontal range
            1.5 + this.normalizedPosition.y * 0.5, // Vertical range centered on head
            2 // Fixed depth in front of avatar
        );

        // Smooth interpolation
        this.smoothLookAt.lerp(this.lookAtTarget, this.lookAtSmoothing);
    }

    /**
     * Check for cursor proximity interactions
     */
    _checkInteractions() {
        // Convert normalized cursor to approximate world position
        const cursorWorld = new THREE.Vector3(
            this.normalizedPosition.x * 0.5 + this.avatarPosition.x,
            1.0 + this.normalizedPosition.y * 0.8,
            0.5
        );

        // Check head proximity (for head pats)
        const headDist = cursorWorld.distanceTo(this.headPosition);
        if (headDist < INTERACTION_ZONES.HEAD.radius) {
            this._triggerInteraction(INTERACTION_ZONES.HEAD.trigger, headDist);
            return;
        }

        // Check left hand proximity
        const leftHandDist = cursorWorld.distanceTo(this.leftHandPosition);
        if (leftHandDist < INTERACTION_ZONES.LEFT_HAND.radius) {
            this.isGrabbingLeft = true;
            this._triggerInteraction(INTERACTION_ZONES.LEFT_HAND.trigger, leftHandDist);
            return;
        } else {
            this.isGrabbingLeft = false;
        }

        // Check right hand proximity  
        const rightHandDist = cursorWorld.distanceTo(this.rightHandPosition);
        if (rightHandDist < INTERACTION_ZONES.RIGHT_HAND.radius) {
            this.isGrabbingRight = true;
            this._triggerInteraction(INTERACTION_ZONES.RIGHT_HAND.trigger, rightHandDist);
            return;
        } else {
            this.isGrabbingRight = false;
        }

        // No interaction
        this.currentInteraction = null;
    }

    /**
     * Trigger an interaction event
     */
    _triggerInteraction(type, distance) {
        if (this.currentInteraction !== type) {
            this.currentInteraction = type;
            console.log(`[MouseInteraction] Triggered: ${type}`);

            // Notify callbacks
            this.interactionCallbacks.forEach(cb => {
                try {
                    cb({ type, distance });
                } catch (e) {
                    console.error('[MouseInteraction] Callback error:', e);
                }
            });
        }
    }

    /**
     * Get look-at direction for VRM
     * @returns {THREE.Vector3} Target position for look-at
     */
    getLookAtTarget() {
        return this.smoothLookAt.clone();
    }

    /**
     * Get head rotation based on cursor position
     * @returns {Object} - { yaw, pitch } in radians
     */
    getHeadRotation() {
        // Calculate angles based on cursor position
        const yaw = this.normalizedPosition.x * 0.4; // Max 0.4 radians (~23 degrees)
        const pitch = this.normalizedPosition.y * 0.2; // Max 0.2 radians (~11 degrees)

        return { yaw, pitch };
    }

    /**
     * Get eye rotation based on cursor position
     * @returns {Object} - { leftYaw, leftPitch, rightYaw, rightPitch } in radians
     */
    getEyeRotation() {
        // Eyes can move more than head
        const yaw = this.normalizedPosition.x * 0.5;
        const pitch = this.normalizedPosition.y * 0.3;

        return {
            leftYaw: yaw,
            leftPitch: pitch,
            rightYaw: yaw,
            rightPitch: pitch
        };
    }

    /**
     * Get hand reach target when grabbing cursor
     * @param {'left'|'right'} hand - Which hand
     * @returns {THREE.Vector3|null} - Target position for hand, or null if not grabbing
     */
    getHandReachTarget(hand) {
        if (hand === 'left' && this.isGrabbingLeft) {
            return new THREE.Vector3(
                this.normalizedPosition.x * 0.4,
                1.0 + this.normalizedPosition.y * 0.3,
                0.3
            );
        }
        if (hand === 'right' && this.isGrabbingRight) {
            return new THREE.Vector3(
                this.normalizedPosition.x * 0.4,
                1.0 + this.normalizedPosition.y * 0.3,
                0.3
            );
        }
        return null;
    }

    /**
     * Update avatar bone positions for IK calculations
     * @param {VRM} vrm - VRM instance
     */
    updateAvatarPositions(vrm) {
        if (!vrm?.humanoid) return;

        // Get head bone world position
        const headBone = vrm.humanoid.getNormalizedBoneNode('head');
        if (headBone) {
            headBone.getWorldPosition(this.headPosition);
        }

        // Get hand bone world positions
        const leftHand = vrm.humanoid.getNormalizedBoneNode('leftHand');
        if (leftHand) {
            leftHand.getWorldPosition(this.leftHandPosition);
        }

        const rightHand = vrm.humanoid.getNormalizedBoneNode('rightHand');
        if (rightHand) {
            rightHand.getWorldPosition(this.rightHandPosition);
        }

        // Get avatar root position
        if (vrm.scene) {
            vrm.scene.getWorldPosition(this.avatarPosition);
        }
    }

    /**
     * Set window bounds for global mouse tracking
     * @param {Object} bounds - { x, y, width, height }
     */
    setWindowBounds(bounds) {
        this.windowBounds = bounds;
    }

    /**
     * Subscribe to interaction events
     * @param {Function} callback - Called with { type, distance }
     * @returns {Function} - Unsubscribe function
     */
    onInteraction(callback) {
        this.interactionCallbacks.add(callback);
        return () => this.interactionCallbacks.delete(callback);
    }

    /**
     * Check if cursor is near the avatar
     * @returns {boolean}
     */
    isCursorNearAvatar() {
        // Consider cursor near if normalized position is within reasonable bounds
        return Math.abs(this.normalizedPosition.x) < 1.5 &&
            Math.abs(this.normalizedPosition.y) < 1.5;
    }

    /**
     * Stop tracking
     */
    stop() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('mousemove', this._onMouseMove);
        }

        if (window.nizhal?.invoke) {
            window.nizhal.invoke('mouse:stopTracking').catch(() => { });
        }

        this.isTracking = false;
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        this.stop();
        this.interactionCallbacks.clear();
        console.log('[MouseInteractionService] Disposed');
    }
}

// Singleton instance
let mouseInteractionServiceInstance = null;

export const getMouseInteractionService = () => {
    if (!mouseInteractionServiceInstance) {
        mouseInteractionServiceInstance = new MouseInteractionService();
    }
    return mouseInteractionServiceInstance;
};

export default MouseInteractionService;
