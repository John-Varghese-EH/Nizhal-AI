/**
 * VRMAnimationService.js
 *
 * Handles procedural bone animations and poses for 3D VRM humanoid avatars
 * using three-vrm's VRMHumanoid API. Includes framerate throttling controls
 * to optimize GPU resources in background companion states.
 */

import * as THREE from 'three';

export const VRM_BONES = {
    HIPS: 'hips',
    SPINE: 'spine',
    CHEST: 'chest',
    UPPER_CHEST: 'upperChest',
    NECK: 'neck',
    HEAD: 'head',
    LEFT_SHOULDER: 'leftShoulder',
    LEFT_UPPER_ARM: 'leftUpperArm',
    LEFT_LOWER_ARM: 'leftLowerArm',
    LEFT_HAND: 'leftHand',
    RIGHT_SHOULDER: 'rightShoulder',
    RIGHT_UPPER_ARM: 'rightUpperArm',
    RIGHT_LOWER_ARM: 'rightLowerArm',
    RIGHT_HAND: 'rightHand',
    LEFT_UPPER_LEG: 'leftUpperLeg',
    LEFT_LOWER_LEG: 'leftLowerLeg',
    LEFT_FOOT: 'leftFoot',
    RIGHT_UPPER_LEG: 'rightUpperLeg',
    RIGHT_LOWER_LEG: 'rightLowerLeg',
    RIGHT_FOOT: 'rightFoot'
};

export const POSES = {
    idle: {
        name: 'idle',
        duration: 0.5,
        bones: {
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0, y: 0, z: 0.3 },
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0, y: 0, z: -0.3 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.LEFT_HAND]: { x: 0, y: 0, z: 0.1 },
            [VRM_BONES.RIGHT_HAND]: { x: 0, y: 0, z: -0.1 },
            [VRM_BONES.LEFT_UPPER_LEG]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.RIGHT_UPPER_LEG]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.HEAD]: { x: 0, y: 0, z: 0 }
        }
    },
    sitting: {
        name: 'sitting',
        duration: 0.8,
        bones: {
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0.2, y: 0, z: 0.5 },
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0.2, y: 0, z: -0.5 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: -0.8, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -0.8, y: 0, z: 0 },
            [VRM_BONES.LEFT_UPPER_LEG]: { x: -1.57, y: 0.1, z: 0 },
            [VRM_BONES.RIGHT_UPPER_LEG]: { x: -1.57, y: -0.1, z: 0 },
            [VRM_BONES.LEFT_LOWER_LEG]: { x: 1.57, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_LEG]: { x: 1.57, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: -0.1, y: 0, z: 0 },
            [VRM_BONES.HEAD]: { x: 0.05, y: 0, z: 0 }
        }
    },
    waving: {
        name: 'waving',
        duration: 0.4,
        isGesture: true,
        returnToIdle: true,
        gestureDuration: 2.0,
        bones: {
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0, y: 0, z: -2.5 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -0.8, y: 0, z: 0 },
            [VRM_BONES.RIGHT_HAND]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.HEAD]: { x: 0, y: 0.15, z: 0.05 }
        }
    },
    stretching: {
        name: 'stretching',
        duration: 0.6,
        isGesture: true,
        returnToIdle: true,
        gestureDuration: 3.0,
        bones: {
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0, y: 0.3, z: 2.8 },
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0, y: -0.3, z: -2.8 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: 0, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: 0.15, y: 0, z: 0 },
            [VRM_BONES.HEAD]: { x: -0.2, y: 0, z: 0 }
        }
    },
    lookingAround: {
        name: 'lookingAround',
        duration: 0.4,
        isGesture: true,
        returnToIdle: true,
        gestureDuration: 3.0,
        bones: {
            [VRM_BONES.HEAD]: { x: 0, y: 0.15, z: 0 },
            [VRM_BONES.NECK]: { x: 0, y: 0.08, z: 0 }
        },
        animation: {
            type: 'sequence',
            keyframes: [
                { time: 0, bones: { [VRM_BONES.HEAD]: { y: 0 } } },
                { time: 0.3, bones: { [VRM_BONES.HEAD]: { y: 0.2 } } },
                { time: 0.6, bones: { [VRM_BONES.HEAD]: { y: 0 } } },
                { time: 0.9, bones: { [VRM_BONES.HEAD]: { y: -0.2 } } },
                { time: 1.0, bones: { [VRM_BONES.HEAD]: { y: 0 } } }
            ]
        }
    },
    sleeping: {
        name: 'sleeping',
        duration: 1.0,
        bones: {
            [VRM_BONES.HEAD]: { x: 0.3, y: 0.1, z: 0.15 },
            [VRM_BONES.NECK]: { x: 0.1, y: 0, z: 0 },
            [VRM_BONES.SPINE]: { x: 0.1, y: 0, z: 0.05 },
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0.3, y: 0, z: 0.5 },
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0.3, y: 0, z: -0.5 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: -0.4, y: 0, z: 0 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -0.4, y: 0, z: 0 }
        }
    },
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
    thinking: {
        name: 'thinking',
        duration: 0.5,
        bones: {
            [VRM_BONES.RIGHT_UPPER_ARM]: { x: 0.8, y: 0, z: -1.2 },
            [VRM_BONES.RIGHT_LOWER_ARM]: { x: -1.8, y: 0, z: 0 },
            [VRM_BONES.HEAD]: { x: 0.1, y: -0.1, z: 0 },
            [VRM_BONES.LEFT_UPPER_ARM]: { x: 0.3, y: 0, z: 0.6 },
            [VRM_BONES.LEFT_LOWER_ARM]: { x: -0.5, y: 0, z: 0 }
        }
    }
};

export const IDLE_GESTURES = ['waving', 'stretching', 'lookingAround'];

export class VRMAnimationService {
    constructor() {
        this.vrm = null;
        this.currentPose = 'idle';
        this.targetPose = 'idle';
        this.transitionProgress = 1.0;
        this.transitionDuration = 0.5;
        this.transitionTime = 0;

        // Rotation tracking maps
        this.currentBoneRotations = {};
        this.targetBoneRotations = {};
        this.initialBoneRotations = {};
        this.initialBonePositions = {};

        // Active gesture state
        this.isPlayingGesture = false;
        this.gestureTimer = 0;
        this.gestureEndTime = 0;
        this.gestureReturnPose = 'idle';

        // Timing configurations
        this.idleGestureTimer = 0;
        this.nextGestureTime = this._randomGestureDelay();
        this.enableIdleGestures = true;
        this.isThrottled = false;

        this.time = 0;
        this.dancePhase = 0;
        this.danceIntensity = 0;
        this.isSitting = false;

        this.onPoseChange = null;
        this.isInitialized = false;

        console.log('[VRMAnimationService] Service initialized');
    }

    /**
     * Initializes service and setups structural parameters.
     */
    async init() {
        if (this.isInitialized) return { success: true };
        this.isInitialized = true;
        return { success: true };
    }

    /**
     * Integrates active VRM skeleton for dynamic rotation manipulations.
     */
    initialize(vrm) {
        if (!vrm || !vrm.humanoid) {
            console.error('[VRMAnimationService] Invalid VRM or humanoid target provided');
            return false;
        }

        this.vrm = vrm;

        // Read rest/initial rotations and positions cleanly to prevent absolute offsets drifting
        this._storeInitialSkeletonState();
        this.setPose('idle', true);

        return true;
    }

    /**
     * Stores resting rotations and local positions.
     */
    _storeInitialSkeletonState() {
        if (!this.vrm?.humanoid) return;

        Object.values(VRM_BONES).forEach(boneName => {
            const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
            if (bone) {
                this.initialBoneRotations[boneName] = {
                    x: bone.rotation.x,
                    y: bone.rotation.y,
                    z: bone.rotation.z
                };
                this.initialBonePositions[boneName] = {
                    x: bone.position.x,
                    y: bone.position.y,
                    z: bone.position.z
                };
                this.currentBoneRotations[boneName] = { ...this.initialBoneRotations[boneName] };
            }
        });
    }

    /**
     * Sets target pose with smooth cubic easing interpolation.
     */
    setPose(poseName, immediate = false) {
        const pose = POSES[poseName];
        if (!pose) {
            console.warn(`[VRMAnimationService] Pose ${poseName} not found`);
            return;
        }

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

        if (pose.isGesture) {
            this.isPlayingGesture = true;
            this.gestureTimer = 0;
            this.gestureEndTime = pose.gestureDuration || 2.0;
        }

        this.currentPose = poseName;
        this.onPoseChange?.(poseName);
    }

    _calculateTargetRotations(pose) {
        this.targetBoneRotations = {};

        Object.values(VRM_BONES).forEach(boneName => {
            if (pose.bones[boneName]) {
                const initial = this.initialBoneRotations[boneName] || { x: 0, y: 0, z: 0 };
                this.targetBoneRotations[boneName] = {
                    x: initial.x + pose.bones[boneName].x,
                    y: initial.y + pose.bones[boneName].y,
                    z: initial.z + pose.bones[boneName].z
                };
            } else {
                this.targetBoneRotations[boneName] = { ...this.currentBoneRotations[boneName] };
            }
        });
    }

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

    triggerRandomGesture() {
        if (this.isPlayingGesture || !this.enableIdleGestures || this.isThrottled) return;

        const gesture = IDLE_GESTURES[Math.floor(Math.random() * IDLE_GESTURES.length)];
        this.gestureReturnPose = this.currentPose;
        this.setPose(gesture);
    }

    /**
     * Stepper loop called every render frame.
     */
    update(deltaTime) {
        if (!this.vrm?.humanoid) return;

        // When throttled (e.g. app hidden), step animations at a relaxed 10fps speed
        if (this.isThrottled && Math.random() > 0.16) return;

        this.time += deltaTime;

        // Transition interpolators
        if (this.transitionProgress < 1.0) {
            this.transitionTime += deltaTime;
            this.transitionProgress = Math.min(1.0, this.transitionTime / this.transitionDuration);
            const easedProgress = this._easeInOutCubic(this.transitionProgress);
            this._applyInterpolatedPose(easedProgress);
        }

        // Active keyframe sequences
        if (this.isPlayingGesture) {
            this.gestureTimer += deltaTime;

            const pose = POSES[this.currentPose];
            if (pose?.animation?.type === 'sequence') {
                this._updateAnimatedGesture(pose.animation, this.gestureTimer / pose.gestureDuration);
            }

            if (this.gestureTimer >= this.gestureEndTime) {
                this.isPlayingGesture = false;
                if (POSES[this.currentPose]?.returnToIdle) {
                    this.setPose(this.gestureReturnPose);
                }
            }
        }

        // Random gesture timers
        if (!this.isPlayingGesture && this.currentPose === 'idle' && this.enableIdleGestures && !this.isThrottled) {
            this.idleGestureTimer += deltaTime;
            if (this.idleGestureTimer >= this.nextGestureTime) {
                this.idleGestureTimer = 0;
                this.nextGestureTime = this._randomGestureDelay();
                if (Math.random() < 0.3) {
                    this.triggerRandomGesture();
                }
            }
        }

        this._applyMicroAnimations(deltaTime);

        if (this.currentPose === 'dancing') {
            this._applyDanceAnimation(deltaTime);
        }
    }

    /**
     * Micro life swaying and chest scales. Evaluated from absolute poses to prevent drift.
     */
    _applyMicroAnimations(deltaTime) {
        if (!this.vrm?.humanoid || this.isThrottled) return;
        if (this.isPlayingGesture || this.currentPose === 'sleeping' || this.currentPose === 'dancing') {
            return;
        }

        const t = this.time;

        const head = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.HEAD);
        if (head) {
            const baseX = this.currentBoneRotations[VRM_BONES.HEAD]?.x || 0;
            const baseY = this.currentBoneRotations[VRM_BONES.HEAD]?.y || 0;
            head.rotation.x = baseX + Math.sin(t * 0.3) * 0.008;
            head.rotation.y = baseY + Math.sin(t * 0.2) * 0.005;
        }

        const chest = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.CHEST);
        if (chest) {
            const breathPhase = Math.sin(t * 0.8) * 0.5 + 0.5;
            const breathAmount = breathPhase * 0.003;
            chest.scale.set(1 + breathAmount, 1 + breathAmount * 0.5, 1 + breathAmount);
        }

        const leftHand = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.LEFT_HAND);
        const rightHand = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.RIGHT_HAND);
        if (leftHand) {
            const baseX = this.currentBoneRotations[VRM_BONES.LEFT_HAND]?.x || 0;
            leftHand.rotation.x = baseX + Math.sin(t * 0.4 + 0.5) * 0.01;
        }
        if (rightHand) {
            const baseX = this.currentBoneRotations[VRM_BONES.RIGHT_HAND]?.x || 0;
            rightHand.rotation.x = baseX + Math.sin(t * 0.35) * 0.01;
        }
    }

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

    _updateAnimatedGesture(animation, normalizedTime) {
        if (!this.vrm?.humanoid || animation.type !== 'sequence') return;

        const keyframes = animation.keyframes;
        let prevFrame = keyframes[0];
        let nextFrame = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
            if (normalizedTime >= keyframes[i].time && normalizedTime < keyframes[i + 1].time) {
                prevFrame = keyframes[i];
                nextFrame = keyframes[i + 1];
                break;
            }
        }

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
     * Dance animation loops. Calculates offset from initial rest vectors to prevent position drifting.
     */
    _applyDanceAnimation(deltaTime) {
        if (!this.vrm?.humanoid) return;

        this.dancePhase += deltaTime * 4;

        const intensity = this.danceIntensity || 1;
        const bounce = Math.abs(Math.sin(this.dancePhase)) * 0.1 * intensity;
        const armSwing = Math.sin(this.dancePhase * 2) * 0.3 * intensity;

        const hips = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.HIPS);
        const leftArm = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.LEFT_UPPER_ARM);
        const rightArm = this.vrm.humanoid.getNormalizedBoneNode(VRM_BONES.RIGHT_UPPER_ARM);

        if (hips) {
            const initialHipsPos = this.initialBonePositions[VRM_BONES.HIPS] || { x: 0, y: 0, z: 0 };
            hips.position.y = initialHipsPos.y + bounce;
        }
        if (leftArm) {
            leftArm.rotation.z += armSwing;
        }
        if (rightArm) {
            rightArm.rotation.z -= armSwing;
        }
    }

    setDanceIntensity(intensity) {
        this.danceIntensity = Math.max(0, Math.min(1, intensity));
    }

    setSitting(isSitting) {
        if (this.isSitting === isSitting) return;

        this.isSitting = isSitting;
        if (isSitting) {
            this.setPose('sitting');
        } else {
            this.setPose('idle');
        }
    }

    setIdleGesturesEnabled(enabled) {
        this.enableIdleGestures = enabled;
    }

    /**
     * Set resource throttling limits to downscale calculations.
     */
    setThrottled(throttled) {
        this.isThrottled = throttled;
        console.log('[VRMAnimationService] CPU throttling active:', throttled);
    }

    _randomGestureDelay() {
        return 10 + Math.random() * 20;
    }

    _easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    getCurrentPose() {
        return this.currentPose;
    }

    isInGesture() {
        return this.isPlayingGesture;
    }

    /**
     * Wipes reference attributes.
     */
    dispose() {
        this.vrm = null;
        this.currentBoneRotations = {};
        this.targetBoneRotations = {};
        this.initialBoneRotations = {};
        this.initialBonePositions = {};
        this.isInitialized = false;
    }

    /**
     * Clean resets.
     */
    async reset() {
        this.dispose();
        this.currentPose = 'idle';
        this.targetPose = 'idle';
        this.transitionProgress = 1.0;
        return { success: true };
    }

    /**
     * Exposes service runtime metadata.
     */
    getState() {
        return {
            initialized: this.isInitialized,
            pose: this.currentPose,
            isPlayingGesture: this.isPlayingGesture,
            throttled: this.isThrottled,
            hasVRMTarget: !!this.vrm
        };
    }
}

let instance = null;

export function getVRMAnimationService() {
    if (!instance) {
        instance = new VRMAnimationService();
    }
    return instance;
}

export default VRMAnimationService;
