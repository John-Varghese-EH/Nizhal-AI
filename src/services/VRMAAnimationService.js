/**
 * VRMAAnimationService.js
 * 
 * Loads and plays VRMA (VRM Animation) files for humanoid bone animations.
 * Based on @pixiv/three-vrm-animation implementation from Mate-Engine.
 * 
 * VRMA files contain:
 * - Humanoid bone rotation/translation tracks
 * - Expression (blend shape) tracks
 * - LookAt direction tracks
 */

import * as THREE from 'three';
import { getAnimationLibrary } from './AnimationLibrary';

// Animation state
const AnimationState = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    BLENDING: 'blending'
};

/**
 * VRMAnimation - Represents a single VRM Animation
 * Mirrors the structure from @pixiv/three-vrm-animation
 */
class VRMAnimation {
    constructor() {
        this.duration = 0.0;
        this.restHipsPosition = new THREE.Vector3();

        this.humanoidTracks = {
            translation: new Map(), // Map<'hips', VectorKeyframeTrack>
            rotation: new Map()     // Map<VRMHumanBoneName, QuaternionKeyframeTrack>
        };

        this.expressionTracks = {
            preset: new Map(),  // Map<VRMExpressionPresetName, NumberKeyframeTrack>
            custom: new Map()   // Map<string, NumberKeyframeTrack>
        };

        this.lookAtTrack = null; // QuaternionKeyframeTrack | null
    }
}

/**
 * VRMLookAtQuaternionProxy - Proxy object for lookAt animation
 */
class VRMLookAtQuaternionProxy extends THREE.Object3D {
    constructor(lookAt) {
        super();
        this._lookAt = lookAt;
        this._quaternion = new THREE.Quaternion();
    }

    get quaternion() {
        return this._quaternion;
    }

    set quaternion(value) {
        this._quaternion.copy(value);
        // Apply to lookAt 
        if (this._lookAt) {
            // Convert quaternion to euler angles for lookAt
            const euler = new THREE.Euler().setFromQuaternion(value, 'YXZ');
            this._lookAt.yaw = THREE.MathUtils.radToDeg(euler.y);
            this._lookAt.pitch = THREE.MathUtils.radToDeg(euler.x);
        }
    }
}

/**
 * VRMAAnimationService - Manages VRMA animation loading and playback
 */
export class VRMAAnimationService {
    constructor() {
        this.vrm = null;
        this.mixer = null;
        this.animations = new Map(); // name -> { vrmAnimation, clip, action }
        this.currentAnimation = null;
        this.state = AnimationState.IDLE;
        this.lookAtProxy = null;

        // Blending - longer duration for smoother transitions
        this.blendDuration = 0.5; // seconds (increased from 0.3 for smoother transitions)
        this.clock = new THREE.Clock();

        // Loader dependencies (lazy loaded)
        this.GLTFLoader = null;
        this.VRMAnimationLoaderPlugin = null;
        this.loaderReady = false;

        // Animation library integration
        this.library = getAnimationLibrary();
        this.currentState = 'idle';
        this.isInitialized = false;
        this.loadingAnimations = new Set();

        // Watchdog timer to prevent spam
        this.lastWatchdogTime = 0;
        this.watchdogCooldown = 2.0; // Only check every 2 seconds

        // Random animation cycling
        this.animationCycleTimer = 0;
        this.animationCycleDuration = 20 + Math.random() * 20; // 20-40 seconds per animation
        this.enableRandomCycling = true;

        // Fallback pose applied flag
        this.fallbackPoseApplied = false;
    }

    /**
     * Initialize service with a VRM instance
     * @param {VRM} vrm - The loaded VRM model
     */
    initialize(vrm) {
        if (!vrm) {
            console.error('[VRMAAnimationService] Cannot initialize without VRM');
            return false;
        }

        this.vrm = vrm;
        this.mixer = new THREE.AnimationMixer(vrm.scene);

        // Create lookAt proxy if VRM has lookAt
        if (vrm.lookAt) {
            this.lookAtProxy = new VRMLookAtQuaternionProxy(vrm.lookAt);
            this.lookAtProxy.name = 'VRMLookAtQuaternionProxy';
            vrm.scene.add(this.lookAtProxy);
        }

        this.isInitialized = true;
        console.log('[VRMAAnimationService] Initialized with VRM:', vrm.meta?.name);

        // Auto-load idle animations on init
        this._loadStateAnimations('idle');

        return true;
    }

    /**
     * Lazy load GLTF loader dependencies
     */
    async _ensureLoader() {
        if (this.loaderReady) return true;

        try {
            // Dynamic import for code splitting
            const [loaderModule] = await Promise.all([
                import('three/examples/jsm/loaders/GLTFLoader.js')
            ]);

            this.GLTFLoader = loaderModule.GLTFLoader;
            this.loaderReady = true;
            return true;
        } catch (error) {
            console.error('[VRMAAnimationService] Failed to load dependencies:', error);
            return false;
        }
    }

    /**
     * Load a VRMA animation file
     * @param {string} url - URL to the .vrma file
     * @param {string} name - Name to identify this animation
     * @returns {Promise<boolean>}
     */
    async loadAnimation(url, name) {
        if (!this.vrm) {
            console.error('[VRMAAnimationService] VRM not initialized');
            return false;
        }

        if (!await this._ensureLoader()) {
            return false;
        }

        return new Promise((resolve, reject) => {
            const loader = new this.GLTFLoader();
            loader.crossOrigin = 'anonymous';

            // Register custom VRMA parser
            loader.register((parser) => {
                return new VRMALoaderPlugin(parser);
            });

            loader.load(
                url,
                (gltf) => {
                    const vrmAnimations = gltf.userData.vrmAnimations;

                    if (!vrmAnimations || vrmAnimations.length === 0) {
                        console.warn('[VRMAAnimationService] No VRM animations found in', url);
                        resolve(false);
                        return;
                    }

                    // Use first animation (VRMA files typically contain one)
                    const vrmAnimation = vrmAnimations[0];

                    // Create THREE.AnimationClip from VRMAnimation
                    const clip = this._createAnimationClip(vrmAnimation, this.vrm);

                    if (!clip) {
                        console.error('[VRMAAnimationService] Failed to create animation clip');
                        resolve(false);
                        return;
                    }

                    // Create action
                    const action = this.mixer.clipAction(clip);

                    // Store animation
                    this.animations.set(name, {
                        vrmAnimation,
                        clip,
                        action,
                        duration: clip.duration
                    });

                    console.log(`[VRMAAnimationService] Loaded animation: ${name} (${clip.duration.toFixed(2)}s)`);
                    resolve(true);
                },
                (progress) => {
                    console.log(`[VRMAAnimationService] Loading ${name}: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                },
                (error) => {
                    console.error('[VRMAAnimationService] Load error:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Create THREE.AnimationClip from VRMAnimation
     * Based on createVRMAnimationClip from @pixiv/three-vrm-animation
     */
    _createAnimationClip(vrmAnimation, vrm) {
        const tracks = [];

        // Humanoid bone tracks
        const humanoidTracks = this._createHumanoidTracks(vrmAnimation, vrm.humanoid, vrm.meta?.metaVersion || '1');
        tracks.push(...humanoidTracks.translation.values());
        tracks.push(...humanoidTracks.rotation.values());

        // Expression tracks
        if (vrm.expressionManager) {
            const expressionTracks = this._createExpressionTracks(vrmAnimation, vrm.expressionManager);
            tracks.push(...expressionTracks.preset.values());
            tracks.push(...expressionTracks.custom.values());
        }

        // LookAt track
        if (vrm.lookAt && this.lookAtProxy && vrmAnimation.lookAtTrack) {
            const lookAtTrack = vrmAnimation.lookAtTrack.clone();
            lookAtTrack.name = `${this.lookAtProxy.name}.quaternion`;
            tracks.push(lookAtTrack);
        }

        if (tracks.length === 0) {
            console.warn('[VRMAAnimationService] No tracks created from VRM animation');
            return null;
        }

        return new THREE.AnimationClip('VRMAClip', vrmAnimation.duration, tracks);
    }

    /**
     * Create humanoid bone tracks from VRMAnimation
     */
    _createHumanoidTracks(vrmAnimation, humanoid, metaVersion) {
        const translation = new Map();
        const rotation = new Map();

        // Rotation tracks
        for (const [name, origTrack] of vrmAnimation.humanoidTracks.rotation.entries()) {
            const bone = humanoid.getNormalizedBoneNode(name);
            if (!bone) continue;

            const track = new THREE.QuaternionKeyframeTrack(
                `${bone.name}.quaternion`,
                origTrack.times,
                // Handle VRM 0.x vs 1.0 coordinate system differences
                origTrack.values.map((v, i) => (metaVersion === '0' && i % 2 === 0 ? -v : v))
            );
            rotation.set(name, track);
        }

        // Translation tracks (only for hips)
        for (const [name, origTrack] of vrmAnimation.humanoidTracks.translation.entries()) {
            const bone = humanoid.getNormalizedBoneNode(name);
            if (!bone) continue;

            // Scale translation based on avatar height
            const animationY = vrmAnimation.restHipsPosition.y || 1;
            const humanoidY = humanoid.normalizedRestPose?.hips?.position?.[1] || 1;
            const scale = humanoidY / animationY;

            const track = origTrack.clone();
            track.values = track.values.map((v, i) => (metaVersion === '0' && i % 3 !== 1 ? -v : v) * scale);
            track.name = `${bone.name}.position`;
            translation.set(name, track);
        }

        return { translation, rotation };
    }

    /**
     * Create expression tracks from VRMAnimation
     */
    _createExpressionTracks(vrmAnimation, expressionManager) {
        const preset = new Map();
        const custom = new Map();

        // Preset expressions
        for (const [name, origTrack] of vrmAnimation.expressionTracks.preset.entries()) {
            const trackName = expressionManager.getExpressionTrackName?.(name);
            if (trackName) {
                const track = origTrack.clone();
                track.name = trackName;
                preset.set(name, track);
            }
        }

        // Custom expressions
        for (const [name, origTrack] of vrmAnimation.expressionTracks.custom.entries()) {
            const trackName = expressionManager.getExpressionTrackName?.(name);
            if (trackName) {
                const track = origTrack.clone();
                track.name = trackName;
                custom.set(name, track);
            }
        }

        return { preset, custom };
    }

    play(name, options = {}) {
        const animation = this.animations.get(name);
        if (!animation) {
            console.warn(`[VRMAAnimationService] Animation not found: ${name}`);
            return false;
        }

        // Prevent restarting the same looping animation if it's already playing
        if (this.currentAnimation === name && this.state === AnimationState.PLAYING) {
            const currentAction = animation.action;
            if (currentAction && currentAction.isRunning() && currentAction.loop === THREE.LoopRepeat) {
                // It's already playing and looping, perfectly fine to do nothing
                // Just update timeScale if needed
                if (options.timeScale) currentAction.timeScale = options.timeScale;
                return true;
            }
        }

        const {
            loop = THREE.LoopRepeat,
            fadeIn = this.blendDuration,
            timeScale = 1.0
        } = options;

        const newAction = animation.action;

        // Setup the new action
        newAction.enabled = true;
        newAction.setEffectiveTimeScale(timeScale);
        newAction.setEffectiveWeight(1); // Default to 1, crossFade will adjust if needed
        newAction.setLoop(loop, Infinity);

        // Handle Cross-fading
        if (this.currentAnimation && this.currentAnimation !== name) {
            const current = this.animations.get(this.currentAnimation);
            const currentAction = current?.action;

            if (currentAction && currentAction.isRunning()) {
                // Reset new action to start
                newAction.reset();
                newAction.play();

                // Crossfade: transitions weights from current -> new
                // This ensures total weight stays around 1.0, preventing T-pose dips
                currentAction.crossFadeTo(newAction, fadeIn, true);
            } else {
                // Old action not running, just fade in new one from 0
                newAction.reset();
                newAction.play();
                newAction.fadeIn(fadeIn);
            }
        } else {
            // No previous animation (or restarting same one), fade in from rest pose
            newAction.reset();
            newAction.play();
            newAction.fadeIn(fadeIn);
        }

        this.currentAnimation = name;
        this.state = AnimationState.PLAYING;

        console.log(`[VRMAAnimationService] Playing: ${name} (Crossfade: ${fadeIn}s)`);
        return true;
    }

    /**
     * Stop current animation
     */
    stop(fadeOut = this.blendDuration) {
        if (this.currentAnimation) {
            const animation = this.animations.get(this.currentAnimation);
            if (animation?.action) {
                animation.action.fadeOut(fadeOut);
            }
            this.currentAnimation = null;
        }
        this.state = AnimationState.IDLE;
    }

    /**
     * Pause current animation
     */
    pause() {
        if (this.currentAnimation) {
            const animation = this.animations.get(this.currentAnimation);
            if (animation?.action) {
                animation.action.paused = true;
            }
            this.state = AnimationState.PAUSED;
        }
    }

    /**
     * Resume paused animation
     */
    resume() {
        if (this.currentAnimation && this.state === AnimationState.PAUSED) {
            const animation = this.animations.get(this.currentAnimation);
            if (animation?.action) {
                animation.action.paused = false;
            }
            this.state = AnimationState.PLAYING;
        }
    }

    /**
     * Update animation mixer (call every frame)
     * @param {number} delta - Time since last frame in seconds
     */
    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Animation watchdog - prevent T-pose by ensuring animation is always playing
        // Only run check every few seconds to avoid spam
        this.lastWatchdogTime += delta;
        if (this.lastWatchdogTime >= this.watchdogCooldown) {
            this.lastWatchdogTime = 0;

            if (this.isInitialized && this.vrm) {
                // Check if current animation is still active
                if (this.currentAnimation) {
                    const animation = this.animations.get(this.currentAnimation);
                    if (animation?.action) {
                        // If animation has stopped (not running), restart idle or apply fallback
                        if (!animation.action.isRunning() && this.state === AnimationState.PLAYING) {
                            console.log('[VRMAAnimationService] Animation stopped, restarting');
                            this._playRandomAnimation().catch(() => this._applyNaturalRestPose());
                        }
                    }
                } else if (this.state !== AnimationState.PLAYING) {
                    // No animation playing at all - try random or apply fallback pose
                    console.log('[VRMAAnimationService] No animation, trying random');
                    this._playRandomAnimation().catch(() => this._applyNaturalRestPose());
                }
            }
        }

        // Random animation cycling - change animation every 20-40 seconds
        if (this.enableRandomCycling && this.isInitialized && this.currentState === 'idle') {
            this.animationCycleTimer += delta;
            if (this.animationCycleTimer >= this.animationCycleDuration) {
                this.animationCycleTimer = 0;
                this.animationCycleDuration = 20 + Math.random() * 20; // Reset to new random duration
                console.log('[VRMAAnimationService] Cycling to random animation');
                this._playRandomAnimation().catch(() => { });
            }
        }
    }

    /**
     * Play a random animation from the library
     */
    async _playRandomAnimation() {
        const allAnims = this.library.getAllAnimationNames();
        if (allAnims.length === 0) {
            throw new Error('No animations available');
        }

        // Pick a random animation
        const randomName = allAnims[Math.floor(Math.random() * allAnims.length)];
        const animConfig = this.library.getAnimation(randomName);

        if (!animConfig) {
            throw new Error(`Animation ${randomName} not found`);
        }

        // Load if needed
        if (!this.hasAnimation(animConfig.name)) {
            const loaded = await this.loadAnimation(animConfig.path, animConfig.name);
            if (!loaded) throw new Error(`Failed to load ${animConfig.name}`);
        }

        // Play it
        return this.play(animConfig.name, {
            loop: animConfig.loop ? THREE.LoopRepeat : THREE.LoopOnce,
            fadeIn: this.blendDuration
        });
    }

    /**
     * Apply a natural rest pose to prevent T-pose when no animation is playing
     * This sets bones to a relaxed standing position with arms down
     */
    _applyNaturalRestPose() {
        if (!this.vrm?.humanoid || this.fallbackPoseApplied) return;

        console.log('[VRMAAnimationService] Applying natural rest pose (fallback)');

        // Natural rest pose bone rotations - arms DOWN at sides
        const restPose = {
            leftUpperArm: { x: 0.1, y: 0, z: 1.2 },    // Arms down at sides
            rightUpperArm: { x: 0.1, y: 0, z: -1.2 },
            leftLowerArm: { x: 0.1, y: 0, z: 0 },      // Slight natural bend
            rightLowerArm: { x: 0.1, y: 0, z: 0 },
            leftHand: { x: 0, y: 0, z: 0 },            // Hands relaxed
            rightHand: { x: 0, y: 0, z: 0 },
            spine: { x: 0, y: 0, z: 0 },
            head: { x: 0, y: 0, z: 0 }
        };

        // Apply rotations to bones
        for (const [boneName, rotation] of Object.entries(restPose)) {
            try {
                const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
                if (bone) {
                    bone.rotation.set(rotation.x, rotation.y, rotation.z);
                }
            } catch (e) {
                // Bone might not exist in this model
            }
        }

        this.fallbackPoseApplied = true;
    }




    /**
     * Get list of loaded animation names
     */
    getAnimationNames() {
        return Array.from(this.animations.keys());
    }

    /**
     * Check if an animation is loaded
     */
    hasAnimation(name) {
        return this.animations.has(name);
    }

    /**
     * Get current animation state
     */
    getState() {
        return {
            state: this.state,
            currentAnimation: this.currentAnimation,
            animationCount: this.animations.size,
            currentAvatarState: this.currentState
        };
    }

    /**
     * Set avatar state and play appropriate animation
     * @param {string} avatarState - Avatar state (idle, speaking, dancing, etc.)
     * @param {Object} options - Play options
     */
    async setState(avatarState, options = {}) {
        if (!this.isInitialized) {
            console.warn('[VRMAAnimationService] Not initialized yet');
            return false;
        }

        this.currentState = avatarState;

        // Get appropriate animation for this state
        const animConfig = this.library.getAnimationForState(avatarState);
        if (!animConfig) {
            console.warn(`[VRMAAnimationService] No animation found for state: ${avatarState}`);
            return false;
        }

        console.log(`[VRMAAnimationService] Setting state: ${avatarState}, animation: ${animConfig.name}`);

        try {
            // Load animation if not already loaded
            if (!this.hasAnimation(animConfig.name)) {
                const loaded = await this.loadAnimation(animConfig.path, animConfig.name);
                if (!loaded) {
                    console.warn(`[VRMAAnimationService] Failed to load animation: ${animConfig.name}`);
                    return false;
                }
            }

            // Play the animation
            const playOptions = {
                loop: animConfig.loop ? THREE.LoopRepeat : THREE.LoopOnce,
                fadeIn: options.fadeIn ?? this.blendDuration,
                timeScale: options.timeScale ?? 1.0,
                ...options
            };

            return this.play(animConfig.name, playOptions);
        } catch (err) {
            console.error(`[VRMAAnimationService] Error setting state ${avatarState}:`, err);
            return false;
        }
    }


    /**
     * Preload animations for a specific state
     * @param {string} avatarState - Avatar state to preload animations for
     */
    async _loadStateAnimations(avatarState) {
        const mapping = this.library.stateMap[avatarState];
        if (!mapping) return;

        const category = this.library.catalog[mapping.category];
        if (!category) return;

        // Load all animations in the category (in background)
        for (const animConfig of category) {
            if (!this.hasAnimation(animConfig.name) && !this.loadingAnimations.has(animConfig.name)) {
                this.loadingAnimations.add(animConfig.name);
                this.loadAnimation(animConfig.path, animConfig.name)
                    .then(() => this.loadingAnimations.delete(animConfig.name))
                    .catch(() => this.loadingAnimations.delete(animConfig.name));
            }
        }
    }

    /**
     * Play random idle gesture
     */
    async playRandomGesture() {
        const gestures = this.library.getIdleGestures();
        if (gestures.length === 0) return false;

        const gesture = gestures[Math.floor(Math.random() * gestures.length)];

        if (!this.hasAnimation(gesture.name)) {
            await this.loadAnimation(gesture.path, gesture.name);
        }

        // Store current animation to return to
        const previousAnimation = this.currentAnimation;

        // Play gesture once
        this.play(gesture.name, { loop: THREE.LoopOnce, fadeIn: 0.3 });

        // Return to previous animation after gesture completes
        setTimeout(() => {
            if (previousAnimation && this.hasAnimation(previousAnimation)) {
                this.play(previousAnimation, { loop: THREE.LoopRepeat, fadeIn: 0.3 });
            }
        }, (gesture.duration || 3) * 1000);

        return true;
    }

    /**
     * Play a dance animation (random if no name specified)
     * @param {string} danceName - Optional specific dance name
     */
    async playDance(danceName = null) {
        let dance;
        if (danceName) {
            dance = this.library.getAnimation(danceName);
        } else {
            dance = this.library.getRandomFromCategory('dance');
        }

        if (!dance) {
            console.warn('[VRMAAnimationService] No dance animation found');
            return false;
        }

        if (!this.hasAnimation(dance.name)) {
            await this.loadAnimation(dance.path, dance.name);
        }

        this.currentState = 'dancing';
        return this.play(dance.name, { loop: THREE.LoopRepeat, fadeIn: 0.5 });
    }

    // ═══════════════════════════════════════════════════════════════
    // EMOTION-BASED ANIMATION SYSTEM
    // ═══════════════════════════════════════════════════════════════

    /**
     * Emotion to animation mapping
     * Maps emotions to appropriate animation categories/names
     */
    static EMOTION_ANIMATIONS = {
        happy: {
            animations: ['02_Greeting', '11_Hello', '17_Smile_World', '18_Lovely_World'],
            category: 'greeting',
            expression: 'happy',
            expressionIntensity: 0.8
        },
        excited: {
            animations: ['05_Spin', '03_Peace_Sign', '14_Gekirei', '19_Cute_Sparkle_World'],
            category: 'action',
            expression: 'happy',
            expressionIntensity: 1.0
        },
        sad: {
            animations: ['09_Dogeza', '15_Gatan'],
            category: 'emotion',
            expression: 'sad',
            expressionIntensity: 0.7
        },
        thinking: {
            animations: ['08_Motion_Pose', '12_Smartphone'],
            category: 'idle',
            expression: 'neutral',
            expressionIntensity: 0.5,
            lookUp: true
        },
        neutral: {
            animations: ['17_Smile_World', '18_Lovely_World', '20_Connected_World'],
            category: 'idle',
            expression: 'neutral',
            expressionIntensity: 0.3
        },
        concerned: {
            animations: ['15_Gatan', '09_Dogeza'],
            category: 'emotion',
            expression: 'sad',
            expressionIntensity: 0.5
        },
        playful: {
            animations: ['05_Spin', '03_Peace_Sign', '04_Shoot'],
            category: 'action',
            expression: 'happy',
            expressionIntensity: 0.6
        }
    };

    /**
     * Set emotion and trigger appropriate animation and expression
     * @param {string} emotion - Emotion name (happy, sad, excited, thinking, neutral, etc.)
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - Whether animation was successfully triggered
     */
    async setEmotion(emotion, options = {}) {
        if (!this.isInitialized) {
            console.warn('[VRMAAnimationService] Not initialized');
            return false;
        }

        const emotionConfig = VRMAAnimationService.EMOTION_ANIMATIONS[emotion] ||
            VRMAAnimationService.EMOTION_ANIMATIONS.neutral;

        console.log(`[VRMAAnimationService] Setting emotion: ${emotion}`);

        try {
            // 1. Pick a random animation for this emotion
            const animationName = emotionConfig.animations[
                Math.floor(Math.random() * emotionConfig.animations.length)
            ];

            // 2. Try to find and load the animation
            let animConfig = this.library.getAnimation(animationName);
            if (!animConfig) {
                // Fall back to category
                animConfig = this.library.getRandomFromCategory(emotionConfig.category);
            }

            if (animConfig && !this.hasAnimation(animConfig.name)) {
                await this.loadAnimation(animConfig.path, animConfig.name);
            }

            // 3. Play the animation with smooth blend
            if (animConfig && this.hasAnimation(animConfig.name)) {
                const blendDuration = options.blendDuration ?? 0.8; // Smooth 0.8s blend
                this.play(animConfig.name, {
                    loop: options.loop ?? THREE.LoopRepeat,
                    fadeIn: blendDuration
                });
            }

            // 4. Apply facial expression with smooth blending
            if (this.vrm?.expressionManager) {
                await this._blendToExpression(
                    emotionConfig.expression,
                    emotionConfig.expressionIntensity,
                    options.expressionDuration ?? 2000 // 2 second morph
                );
            }

            // 5. Apply lookAt if specified
            if (emotionConfig.lookUp && this.vrm?.lookAt) {
                this.vrm.lookAt.pitch = -15; // Look slightly up
            }

            this.currentEmotion = emotion;
            return true;

        } catch (error) {
            console.error(`[VRMAAnimationService] Error setting emotion ${emotion}:`, error);
            return false;
        }
    }

    /**
     * Smoothly blend to a target expression over duration
     * @param {string} expressionName - VRM expression preset name
     * @param {number} targetIntensity - Target expression weight (0-1)
     * @param {number} duration - Blend duration in milliseconds
     */
    async _blendToExpression(expressionName, targetIntensity, duration = 2000) {
        if (!this.vrm?.expressionManager) return;

        const manager = this.vrm.expressionManager;
        const startTime = Date.now();
        const startIntensity = manager.getValue(expressionName) || 0;
        const delta = targetIntensity - startIntensity;

        // Reset other expressions gradually
        const otherExpressions = ['happy', 'sad', 'angry', 'surprised', 'relaxed'];
        const otherStartValues = {};
        otherExpressions.forEach(exp => {
            if (exp !== expressionName) {
                otherStartValues[exp] = manager.getValue(exp) || 0;
            }
        });

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Smooth easing (ease-in-out)
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                // Blend main expression
                manager.setValue(expressionName, startIntensity + delta * eased);

                // Fade out other expressions
                otherExpressions.forEach(exp => {
                    if (exp !== expressionName && otherStartValues[exp]) {
                        manager.setValue(exp, otherStartValues[exp] * (1 - eased));
                    }
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }

    /**
     * Get current emotion
     */
    getCurrentEmotion() {
        return this.currentEmotion || 'neutral';
    }

    /**
     * Subscribe to emotion changes from the global state
     * @param {function} getEmotionFn - Function that returns current emotion from state
     */
    subscribeToEmotionChanges(getEmotionFn) {
        if (typeof getEmotionFn !== 'function') return;

        // Check for emotion changes periodically
        setInterval(async () => {
            try {
                const newEmotion = await getEmotionFn();
                if (newEmotion && newEmotion !== this.currentEmotion) {
                    this.setEmotion(newEmotion);
                }
            } catch (e) {
                // Ignore errors
            }
        }, 500); // Check every 500ms
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        this.stop(0);

        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }

        if (this.lookAtProxy && this.vrm?.scene) {
            this.vrm.scene.remove(this.lookAtProxy);
        }

        this.animations.clear();
        this.vrm = null;
        this.lookAtProxy = null;
        this.currentAnimation = null;
        this.currentState = 'idle';
        this.currentEmotion = 'neutral';
        this.isInitialized = false; // Allow reinitialization with new VRM
        this.fallbackPoseApplied = false;
        this.loadingAnimations.clear();

        console.log('[VRMAAnimationService] Disposed');
    }
}

/**
 * VRMALoaderPlugin - GLTFLoader plugin for loading VRMA files
 * Simplified version of @pixiv/three-vrm-animation's VRMAnimationLoaderPlugin
 */
class VRMALoaderPlugin {
    constructor(parser) {
        this.parser = parser;
    }

    get name() {
        return 'VRMC_vrm_animation';
    }

    async afterRoot(gltf) {
        const defGltf = gltf.parser.json;
        const defExtensionsUsed = defGltf.extensionsUsed;

        // Check if VRMA extension is present
        if (!defExtensionsUsed || !defExtensionsUsed.includes(this.name)) {
            return;
        }

        const defExtension = defGltf.extensions?.[this.name];
        if (!defExtension) {
            return;
        }

        // Parse node mappings
        const nodeMap = this._createNodeMap(defExtension);

        // Parse animations
        const clips = gltf.animations;
        const animations = clips.map((clip, iAnimation) => {
            const defAnimation = defGltf.animations[iAnimation];
            return this._parseAnimation(clip, defAnimation, nodeMap);
        });

        gltf.userData.vrmAnimations = animations;
    }

    _createNodeMap(defExtension) {
        const humanoidIndexToName = new Map();
        const expressionsIndexToName = new Map();

        // Humanoid bones
        const humanBones = defExtension.humanoid?.humanBones;
        if (humanBones) {
            Object.entries(humanBones).forEach(([name, bone]) => {
                const node = bone?.node;
                if (node != null) {
                    humanoidIndexToName.set(node, name);
                }
            });
        }

        // Expressions - preset
        const preset = defExtension.expressions?.preset;
        if (preset) {
            Object.entries(preset).forEach(([name, expression]) => {
                const node = expression?.node;
                if (node != null) {
                    expressionsIndexToName.set(node, name);
                }
            });
        }

        // Expressions - custom
        const custom = defExtension.expressions?.custom;
        if (custom) {
            Object.entries(custom).forEach(([name, expression]) => {
                const { node } = expression;
                expressionsIndexToName.set(node, name);
            });
        }

        // LookAt
        const lookAtIndex = defExtension.lookAt?.node ?? null;

        return { humanoidIndexToName, expressionsIndexToName, lookAtIndex };
    }

    _parseAnimation(animationClip, defAnimation, nodeMap) {
        const tracks = animationClip.tracks;
        const defChannels = defAnimation.channels;

        const result = new VRMAnimation();
        result.duration = animationClip.duration;

        defChannels.forEach((channel, iChannel) => {
            const { node, path } = channel.target;
            const origTrack = tracks[iChannel];

            if (node == null) return;

            // Humanoid bones
            const boneName = nodeMap.humanoidIndexToName.get(node);
            if (boneName != null) {
                if (path === 'translation') {
                    if (boneName === 'hips') {
                        result.humanoidTracks.translation.set(boneName, origTrack.clone());
                    }
                } else if (path === 'rotation') {
                    result.humanoidTracks.rotation.set(boneName, origTrack.clone());
                }
                return;
            }

            // Expressions
            const expressionName = nodeMap.expressionsIndexToName.get(node);
            if (expressionName != null) {
                if (path === 'translation') {
                    const times = origTrack.times;
                    const values = new Float32Array(origTrack.values.length / 3);
                    for (let i = 0; i < values.length; i++) {
                        values[i] = origTrack.values[3 * i];
                    }
                    const newTrack = new THREE.NumberKeyframeTrack(
                        `${expressionName}.weight`,
                        times,
                        values
                    );

                    // Check if preset or custom
                    const presetNames = ['happy', 'angry', 'sad', 'relaxed', 'surprised',
                        'aa', 'ih', 'ou', 'ee', 'oh', 'blink',
                        'blinkLeft', 'blinkRight', 'lookUp', 'lookDown',
                        'lookLeft', 'lookRight', 'neutral'];

                    if (presetNames.includes(expressionName)) {
                        result.expressionTracks.preset.set(expressionName, newTrack);
                    } else {
                        result.expressionTracks.custom.set(expressionName, newTrack);
                    }
                }
                return;
            }

            // LookAt
            if (node === nodeMap.lookAtIndex) {
                if (path === 'rotation') {
                    result.lookAtTrack = origTrack.clone();
                }
            }
        });

        return result;
    }
}

// Singleton instance
let vrmaAnimationServiceInstance = null;

export const getVRMAAnimationService = () => {
    if (!vrmaAnimationServiceInstance) {
        vrmaAnimationServiceInstance = new VRMAAnimationService();
    }
    return vrmaAnimationServiceInstance;
};

export default VRMAAnimationService;
