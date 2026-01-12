/**
 * VRMAnimationService.js
 * 
 * Manages bone-level animations for VRM avatars.
 * Provides procedural animations for idle, sitting, gestures, and state transitions.
 * Similar to Mate Engine's animation system but using three-vrm's VRMHumanoid API.
 */

import * as THREE from 'three';

// VRM Humanoid bone names (standard VRM 1.0 spec)
const VRM_BONES = {
    // Spine
    HIPS: 'hips',
    SPINE: 'spine',
    CHEST: 'chest',
    UPPER_CHEST: 'upperChest',
    NECK: 'neck',
    HEAD: 'head',

    // Left Arm
    LEFT_SHOULDER: 'leftShoulder',
    LEFT_UPPER_ARM: 'leftUpperArm',
    LEFT_LOWER_ARM: 'leftLowerArm',
    LEFT_HAND: 'leftHand',

    // Right Arm
    RIGHT_SHOULDER: 'rightShoulder',
    RIGHT_UPPER_ARM: 'rightUpperArm',
    RIGHT_LOWER_ARM: 'rightLowerArm',
    RIGHT_HAND: 'rightHand',

    // Left Leg
    LEFT_UPPER_LEG: 'leftUpperLeg',
    LEFT_LOWER_LEG: 'leftLowerLeg',
    LEFT_FOOT: 'leftFoot',

    // Right Leg
    RIGHT_UPPER_LEG: 'rightUpperLeg',
    RIGHT_LOWER_LEG: 'rightLowerLeg',
    RIGHT_FOOT: 'rightFoot'
};

// Predefined poses with bone rotations (in radians)
// Each pose defines target rotations for specific bones
const POSES = {
    // Relaxed idle - arms at sides with relaxed hands
    idle: {
        name: 'idle',
        duration: 0.5,
        bones: {
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0, y: 0, z: 0.3 },    // Arms slightly away from body
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0, y: 0, z: -0.3 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.LEFT_HAND]: { x: 0, y: 0, z: 0.1 },         // Slight relaxed wrist bend
            [VRM_BONES.RIGHT_HAND]: { x: 0, y: 0, z: -0.1 },
            [VRM_BONES.LEFT_UPPER_LEG]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.RIGHT_UPPER_LEG]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.HEAD]: { x: 0, y: 0, z: 0 }
        }
    },

    // Sitting pose - for taskbar/window sitting
    sitting: {
        name: 'sitting',
        duration: 0.8,
        bones: {
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0.2, y: 0, z: 0.5 },   // Arms resting on legs
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0.2, y: 0, z: -0.5 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: -0.8, y: 0, z: 0 },   // Forearms bent
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -0.8, y: 0, z: 0 },
            [VRM_BONES.LEFT_UPPER_LEG]: { x: -1.57, y: 0.1, z: 0 }, // Legs at 90 degrees
            [VRM_BONES.RIGHT_UPPER_LEG]: { x: -1.57, y: -0.1, z: 0 },
            [VRM_BONES.LEFT_LOWER_LEG]: { x: 1.57, y: 0, z: 0 },   // Lower legs hanging down
            [VRM_BONES.RIGHT_LOWER_LEG]: { x: 1.57, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: -0.1, y: 0, z: 0 },            // Slight lean forward
            [VRM_BONES.HEAD]: { x: 0.05, y: 0, z: 0 }              // Looking slightly down
        }
    },

    // Waving gesture
    waving: {
        name: 'waving',
        duration: 0.4,
        isGesture: true,
        returnToIdle: true,
        gestureDuration: 2.0,
        bones: {
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0, y: 0, z: -2.5 },   // Arm up high
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -0.8, y: 0, z: 0 },   // Forearm bent for waving
            [VRM_BONES.RIGHT_HAND]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.HEAD]: { x: 0, y: 0.15, z: 0.05 }            // Looking at "person"
        }
    },

    // Stretching gesture
    stretching: {
        name: 'stretching',
        duration: 0.6,
        isGesture: true,
        returnToIdle: true,
        gestureDuration: 3.0,
        bones: {
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0, y: 0.3, z: 2.8 },   // Arms up
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0, y: -0.3, z: -2.8 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: 0.15, y: 0, z: 0 },             // Spine extended
            [VRM_BONES.HEAD]: { x: -0.2, y: 0, z: 0 }               // Head back
        }
    },

    // Looking around gesture - SUBTLE head movement
    lookingAround: {
        name: 'lookingAround',
        duration: 0.4,
        isGesture: true,
        returnToIdle: true,
        gestureDuration: 3.0,
        bones: {
            [VRM_BONES.HEAD]: { x: 0, y: 0.15, z: 0 },  // Reduced from 0.4
            [VRM_BONES.NECK]: { x: 0, y: 0.08, z: 0 }   // Reduced from 0.2
        },
        // Subtle look animation - gentle head turns
        animation: {
            type: 'sequence',
            keyframes: [
                { time: 0, bones: { [VRM_BONES.HEAD]: { y: 0 } } },
                { time: 0.3, bones: { [VRM_BONES.HEAD]: { y: 0.2 } } },   // Reduced from 0.5
                { time: 0.6, bones: { [VRM_BONES.HEAD]: { y: 0 } } },
                { time: 0.9, bones: { [VRM_BONES.HEAD]: { y: -0.2 } } },  // Reduced from -0.5
                { time: 1.0, bones: { [VRM_BONES.HEAD]: { y: 0 } } }
            ]
        }
    },

    // Sleeping pose
    sleeping: {
        name: 'sleeping',
        duration: 1.0,
        bones: {
            [VRM_BONES.HEAD]: { x: 0.3, y: 0.1, z: 0.15 },          // Head tilted/drooped
            [VRM_BONES.NECK]: { x: 0.1, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: 0.1, y: 0, z: 0.05 },
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0.3, y: 0, z: 0.5 },
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0.3, y: 0, z: -0.5 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: -0.4, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -0.4, y: 0, z: 0 }
        }
    },

    // Dancing pose (base - will be animated)
    dancing: {
        name: 'dancing',
        duration: 0.3,
        bones: {
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0, y: 0.3, z: 1.2 },
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0, y: -0.3, z: -1.2 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: -1.0, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -1.0, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: 0, y: 0, z: 0 }
        }
    },

    // Dragging pose - slight "held" appearance
    dragging: {
        name: 'dragging',
        duration: 0.2,
        bones: {
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0, y: 0, z: 0.8 },
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0, y: 0, z: -0.8 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: -0.3, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -0.3, y: 0, z: 0 },
            [VRM_BONES.LEFT_UPPER_LEG]: { x: 0.2, y: 0, z: 0 },
            [VRM_BONES.RIGHT_UPPER_LEG]: { x: 0.2, y: 0, z: 0 }
        }
    },

    // Thinking pose
    thinking: {
        name: 'thinking',
        duration: 0.5,
        bones: {
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0.8, y: 0, z: -1.2 },  // Hand to chin
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -1.8, y: 0, z: 0 },
            [VRM_BONES.HEAD]: { x: 0.1, y: -0.1, z: 0 },            // Slight tilt
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0.3, y: 0, z: 0.6 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: -0.5, y: 0, z: 0 }
        }
    }
};

// Idle gestures that can be triggered randomly
const IDLE_GESTURES = ['waving', 'stretching', 'lookingAround'];

/**
 * VRMAnimationService - Manages procedural bone animations for VRM models
 */
export class VRMAnimationService {
    constructor() {
        this.vrm = null;
        this.currentPose = 'idle';
        this.targetPose = 'idle';
        this.transitionProgress = 1.0; // 1.0 = fully at target pose
        this.transitionDuration = 0.5;
        this.transitionTime = 0;

        // Bone state tracking
        this.currentBoneRotations = {};
        this.targetBoneRotations = {};
        this.initialBoneRotations = {}; // Store initial rotations on load

        // Gesture state
        this.isPlayingGesture = false;
        this.gestureTimer = 0;
        this.gestureEndTime = 0;
        this.gestureReturnPose = 'idle';

        // Idle gesture timing
        this.idleGestureTimer = 0;
        this.nextGestureTime = this._randomGestureDelay();
        this.enableIdleGestures = true;

        // Animation state
        this.time = 0;
        this.breathingPhase = 0;
        this.swayPhase = 0;

        // Dance animation
        this.dancePhase = 0;
        this.danceIntensity = 0;

        // Sitting state
        this.isSitting = false;
        this.sittingTransition = 0;

        // Callbacks
        this.onPoseChange = null;
    }

    /**
     * Initialize with a VRM instance
     * @param {VRM} vrm - The loaded VRM model
     */
    initialize(vrm) {
        if (!vrm || !vrm.humanoid) {
            console.error('[VRMAnimationService] Invalid VRM or no humanoid');
            return false;
        }

        this.vrm = vrm;

        // Store initial bone rotations
        this._storeInitialRotations();

        // Set initial pose
        this.setPose('idle', true);

        console.log('[VRMAnimationService] Initialized with VRM');
        return true;
    }

    /**
     * Store the initial/rest bone rotations
     */
    _storeInitialRotations() {
        if (!this.vrm?.humanoid) return;

        Object.values(VRM_BONES).forEach(boneName => {
            const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
            if (bone) {
                this.initialBoneRotations[boneName] = {
                    x: bone.rotation.x,
                    y: bone.rotation.y,
                    z: bone.rotation.z
                };
                // Also set current rotations
                this.currentBoneRotations[boneName] = { ...this.initialBoneRotations[boneName] };
            }
        });
    }

    /**
     * Set the target pose (with transition)
     * @param {string} poseName - Name of the pose from POSES
     * @param {boolean} immediate - If true, skip transition
     */
    setPose(poseName, immediate = false) {
        const pose = POSES[poseName];
        if (!pose) {
            console.warn(`[VRMAnimationService] Unknown pose: ${poseName}`);
            return;
        }

        // Don't interrupt gestures unless forced
        if (this.isPlayingGesture && !immediate) {
            this.gestureReturnPose = poseName;
            return;
        }

        this.targetPose = poseName;
        this.transitionDuration = pose.duration;

        if (immediate) {
            this.transitionProgress = 1.0;
            this._applyPoseImmediately(pose);
        } else {
            this.transitionProgress = 0;
            this.transitionTime = 0;
            this._calculateTargetRotations(pose);
        }

        // Handle gesture specifics
        if (pose.isGesture) {
            this.isPlayingGesture = true;
            this.gestureTimer = 0;
            this.gestureEndTime = pose.gestureDuration || 2.0;
        }

        this.currentPose = poseName;
        this.onPoseChange?.(poseName);
    }

    /**
     * Calculate target bone rotations for a pose
     */
    _calculateTargetRotations(pose) {
        // Start with initial rotations
        this.targetBoneRotations = {};

        Object.values(VRM_BONES).forEach(boneName => {
            if (pose.bones[boneName]) {
                // Use pose-defined rotation
                this.targetBoneRotations[boneName] = {
                    x: (this.initialBoneRotations[boneName]?.x || 0) + pose.bones[boneName].x,
                    y: (this.initialBoneRotations[boneName]?.y || 0) + pose.bones[boneName].y,
                    z: (this.initialBoneRotations[boneName]?.z || 0) + pose.bones[boneName].z
                };
            } else {
                // Keep at initial/current
                this.targetBoneRotations[boneName] = { ...this.currentBoneRotations[boneName] };
            }
        });
    }

    /**
     * Apply a pose immediately without transition
     */
    _applyPoseImmediately(pose) {
        if (!this.vrm?.humanoid) return;

        Object.entries(pose.bones).forEach(([boneName, rotation]) => {
            const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
            if (bone) {
                const initial = this.initialBoneRotations[boneName] || { x: 0, y: 0, z: 0 };
                bone.rotation.x = initial.x + rotation.x;
                bone.rotation.y = initial.y + rotation.y;
                bone.rotation.z = initial.z + rotation.z;

                this.currentBoneRotations[boneName] = {
                    x: bone.rotation.x,
                    y: bone.rotation.y,
                    z: bone.rotation.z
                };
            }
        });
    }

    /**
     * Trigger a random idle gesture
     */
    triggerRandomGesture() {
        if (this.isPlayingGesture || !this.enableIdleGestures) return;

        const gesture = IDLE_GESTURES[Math.floor(Math.random() * IDLE_GESTURES.length)];
        this.gestureReturnPose = this.currentPose;
        this.setPose(gesture);
    }

    /**
     * Update animation (call every frame)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.vrm?.humanoid) return;

        this.time += deltaTime;

        // Update pose transition
        if (this.transitionProgress < 1.0) {
            this.transitionTime += deltaTime;
            this.transitionProgress = Math.min(1.0, this.transitionTime / this.transitionDuration);

            // Apply eased interpolation
            const easedProgress = this._easeInOutCubic(this.transitionProgress);
            this._applyInterpolatedPose(easedProgress);
        }

        // Handle gesture timing
        if (this.isPlayingGesture) {
            this.gestureTimer += deltaTime;

            // Special animated gestures (like looking around)
            const pose = POSES[this.currentPose];
            if (pose?.animation?.type === 'sequence') {
                this._updateAnimatedGesture(pose.animation, this.gestureTimer / pose.gestureDuration);
            }

            // End gesture and return to previous pose
            if (this.gestureTimer >= this.gestureEndTime) {
                this.isPlayingGesture = false;
                if (POSES[this.currentPose]?.returnToIdle) {
                    this.setPose(this.gestureReturnPose);
                }
            }
        }

        // Idle gesture timing (only when idle and not in gesture)
        if (!this.isPlayingGesture && this.currentPose === 'idle' && this.enableIdleGestures) {
            this.idleGestureTimer += deltaTime;
            if (this.idleGestureTimer >= this.nextGestureTime) {
                this.idleGestureTimer = 0;
                this.nextGestureTime = this._randomGestureDelay();
                // 30% chance to actually do a gesture
                if (Math.random() < 0.3) {
                    this.triggerRandomGesture();
                }
            }
        }

        // Apply continuous micro-animations for lifelike appearance
        this._applyMicroAnimations(deltaTime);

        // Dance animation overlay
        if (this.currentPose === 'dancing') {
            this._applyDanceAnimation(deltaTime);
        }
    }

    /**
     * Apply subtle micro-animations for human-like appearance
     * These are very subtle continuous movements that make the character feel alive
     * NOTE: Uses absolute values, NOT additive, to prevent rotation drift
     */
    _applyMicroAnimations(deltaTime) {
        if (!this.vrm?.humanoid) return;

        // Skip micro-animations during gestures or sleeping
        if (this.isPlayingGesture || this.currentPose === 'sleeping' || this.currentPose === 'dancing') {
            return;
        }

        const t = this.time;

        // === SUBTLE HEAD MICRO-MOVEMENTS ===
        // Very gentle, almost imperceptible head movements
        const head = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.HEAD);
        if (head) {
            const baseX = this.currentBoneRotations[VRM_BONES.HEAD]?.x || 0;
            const baseY = this.currentBoneRotations[VRM_BONES.HEAD]?.y || 0;

            // Micro head movements - tiny adjustments (absolute, not additive)
            const headMicroX = Math.sin(t * 0.3) * 0.008;
            const headMicroY = Math.sin(t * 0.2) * 0.005;

            // Set absolute rotation (base + micro), not additive
            head.rotation.x = baseX + headMicroX;
            head.rotation.y = baseY + headMicroY;
        }

        // === NATURAL BREATHING (chest expansion, not rotation) ===
        const chest = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.CHEST);
        if (chest) {
            // Slow breathing rhythm
            const breathPhase = Math.sin(t * 0.8) * 0.5 + 0.5; // 0 to 1
            const breathAmount = breathPhase * 0.003; // Very subtle
            // Chest expands slightly on inhale
            chest.scale.set(1 + breathAmount, 1 + breathAmount * 0.5, 1 + breathAmount);
        }

        // === SUBTLE WEIGHT SHIFTING - DISABLED (causes rotation drift) ===
        // Hips weight shifting disabled - it was causing sideways rotation

        // === FINGER/HAND MICRO-MOVEMENTS ===
        const leftHand = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.LEFT_HAND);
        const rightHand = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.RIGHT_HAND);
        if (leftHand) {
            const baseX = this.currentBoneRotations[VRM_BONES.LEFT_HAND]?.x || 0;
            const handMicro = Math.sin(t * 0.4 + 0.5) * 0.01;
            leftHand.rotation.x = baseX + handMicro;
        }
        if (rightHand) {
            const baseX = this.currentBoneRotations[VRM_BONES.RIGHT_HAND]?.x || 0;
            const handMicro = Math.sin(t * 0.35) * 0.01;
            rightHand.rotation.x = baseX + handMicro;
        }

        // === OCCASIONAL BLINK-LIKE EYE MOVEMENT via expressions ===
        // This is handled by the expression system, not bones
    }

    /**
     * Apply interpolated pose between current and target
     */
    _applyInterpolatedPose(progress) {
        if (!this.vrm?.humanoid) return;

        Object.values(VRM_BONES).forEach(boneName => {
            const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
            if (!bone) return;

            const current = this.currentBoneRotations[boneName] || { x: 0, y: 0, z: 0 };
            const target = this.targetBoneRotations[boneName] || current;

            bone.rotation.x = THREE.MathUtils.lerp(current.x, target.x, progress);
            bone.rotation.y = THREE.MathUtils.lerp(current.y, target.y, progress);
            bone.rotation.z = THREE.MathUtils.lerp(current.z, target.z, progress);
        });

        // Update current rotations when transition completes
        if (progress >= 1.0) {
            Object.values(VRM_BONES).forEach(boneName => {
                const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
                if (bone) {
                    this.currentBoneRotations[boneName] = {
                        x: bone.rotation.x,
                        y: bone.rotation.y,
                        z: bone.rotation.z
                    };
                }
            });
        }
    }

    /**
     * Update animated gestures with keyframes
     */
    _updateAnimatedGesture(animation, normalizedTime) {
        if (!this.vrm?.humanoid || animation.type !== 'sequence') return;

        const keyframes = animation.keyframes;

        // Find surrounding keyframes
        let prevFrame = keyframes[0];
        let nextFrame = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
            if (normalizedTime >= keyframes[i].time && normalizedTime < keyframes[i + 1].time) {
                prevFrame = keyframes[i];
                nextFrame = keyframes[i + 1];
                break;
            }
        }

        // Interpolate between keyframes
        const frameProgress = (normalizedTime - prevFrame.time) / (nextFrame.time - prevFrame.time);
        const easedProgress = this._easeInOutCubic(Math.max(0, Math.min(1, frameProgress)));

        Object.keys(prevFrame.bones || {}).forEach(boneName => {
            const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
            if (!bone) return;

            const prevBone = prevFrame.bones[boneName] || {};
            const nextBone = nextFrame.bones?.[boneName] || prevBone;

            if (prevBone.y !== undefined && nextBone.y !== undefined) {
                const initial = this.initialBoneRotations[boneName] || { y: 0 };
                bone.rotation.y = initial.y + THREE.MathUtils.lerp(prevBone.y, nextBone.y, easedProgress);
            }
        });
    }

    /**
     * Apply subtle breathing animation - DISABLED rotation component
     * Only keeping this for potential future vertical chest movement
     */
    _applyBreathingAnimation(deltaTime) {
        // Breathing rotation disabled - causes unwanted character rotation
        // Future: Could add subtle vertical chest movement instead
        return;
    }

    /**
     * Apply subtle sway animation - DISABLED (doesn't look natural on VRM)
     * Keeping the method for potential future use with better implementation
     */
    _applySwayAnimation(deltaTime) {
        // Sway animation disabled - doesn't look good on VRM characters
        // The bone-based breathing animation provides enough subtle movement
        return;
    }

    /**
     * Apply dance animation overlay
     */
    _applyDanceAnimation(deltaTime) {
        if (!this.vrm?.humanoid) return;

        this.dancePhase += deltaTime * 4; // Fast rhythm

        const intensity = this.danceIntensity || 1;
        const bounce = Math.abs(Math.sin(this.dancePhase)) * 0.1 * intensity;
        const armSwing = Math.sin(this.dancePhase * 2) * 0.3 * intensity;

        const hips = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.HIPS);
        const leftArm = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.LEFT_UPPER_ARM);
        const rightArm = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.RIGHT_UPPER_ARM);

        if (hips) {
            // Bouncing effect
            hips.position.y += bounce;
        }
        if (leftArm) {
            leftArm.rotation.z += armSwing;
        }
        if (rightArm) {
            rightArm.rotation.z -= armSwing;
        }
    }

    /**
     * Set dance intensity (0-1)
     */
    setDanceIntensity(intensity) {
        this.danceIntensity = Math.max(0, Math.min(1, intensity));
    }

    /**
     * Set sitting state (for taskbar sitting)
     */
    setSitting(isSitting) {
        if (this.isSitting === isSitting) return;

        this.isSitting = isSitting;
        if (isSitting) {
            this.setPose('sitting');
        } else {
            this.setPose('idle');
        }
    }

    /**
     * Enable/disable random idle gestures
     */
    setIdleGesturesEnabled(enabled) {
        this.enableIdleGestures = enabled;
    }

    /**
     * Get random delay for next gesture (10-30 seconds)
     */
    _randomGestureDelay() {
        return 10 + Math.random() * 20;
    }

    /**
     * Easing function for smooth transitions
     */
    _easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Get current pose name
     */
    getCurrentPose() {
        return this.currentPose;
    }

    /**
     * Check if currently playing a gesture
     */
    isInGesture() {
        return this.isPlayingGesture;
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        this.vrm = null;
        this.currentBoneRotations = {};
        this.targetBoneRotations = {};
        this.initialBoneRotations = {};
    }
}

// Singleton instance
let instance = null;

export function getVRMAnimationService() {
    if (!instance) {
        instance = new VRMAnimationService();
    }
    return instance;
}

export { POSES, VRM_BONES, IDLE_GESTURES };
export default VRMAnimationService;
