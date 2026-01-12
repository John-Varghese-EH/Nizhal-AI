/**
 * AdvancedAnimationEngine.js
 * 
 * Intelligent animation controller that selects animations based on:
 * - Scenario context (time of day, activity, mood)
 * - Interactive triggers (clicks, hovers, drags)
 * - Weighted random selection (avoids repeats)
 * - Smooth transitions with priority queuing
 */

import * as THREE from 'three';
import { getAnimationLibrary } from './AnimationLibrary';

/**
 * Animation priority levels
 */
const AnimationPriority = {
    LOW: 0,        // Background idle animations
    NORMAL: 1,     // Standard state animations
    HIGH: 2,       // User interactions
    URGENT: 3      // Important reactions (greeting, surprise)
};

/**
 * Scenario types for intelligent selection
 */
const ScenarioType = {
    IDLE: 'idle',
    GREETING: 'greeting',
    CONVERSATION: 'conversation',
    WORKING: 'working',
    CELEBRATING: 'celebrating',
    THINKING: 'thinking',
    RELAXING: 'relaxing'
};

/**
 * Interactive trigger types
 */
const InteractionType = {
    CLICK: 'click',
    DOUBLE_CLICK: 'double_click',
    HOVER: 'hover',
    DRAG_START: 'drag_start',
    DRAG_END: 'drag_end',
    LONG_PRESS: 'long_press'
};

/**
 * AdvancedAnimationEngine - Intelligent animation controller
 */
export class AdvancedAnimationEngine {
    constructor() {
        this.vrm = null;
        this.mixer = null;
        this.library = getAnimationLibrary();

        // Animation state
        this.currentAnimation = null;
        this.animationQueue = [];
        this.isPlaying = false;
        this.isInitialized = false;

        // Smart selection state
        this.recentAnimations = [];  // Track last 5 played animations
        this.maxRecentHistory = 5;
        this.currentScenario = ScenarioType.IDLE;

        // Timing
        this.lastAnimationChange = Date.now();
        this.idleCycleDuration = 25000 + Math.random() * 15000; // 25-40 seconds
        this.lastIdleCycleTime = Date.now();

        // Blending
        this.blendDuration = 0.5; // seconds for smooth transitions

        // Animation cache
        this.loadedAnimations = new Map();
        this.loadingPromises = new Map();

        // GLTF loader (lazy loaded)
        this.GLTFLoader = null;
        this.loaderReady = false;

        // Callbacks
        this.onAnimationStart = null;
        this.onAnimationEnd = null;

        console.log('[AdvancedAnimationEngine] Created');
    }

    /**
     * Initialize with VRM model
     */
    initialize(vrm) {
        if (!vrm) {
            console.error('[AdvancedAnimationEngine] Cannot initialize without VRM');
            return false;
        }

        this.vrm = vrm;
        this.mixer = new THREE.AnimationMixer(vrm.scene);
        this.isInitialized = true;

        // Set up mixer events
        this.mixer.addEventListener('finished', (e) => {
            this._onAnimationFinished(e);
        });

        console.log('[AdvancedAnimationEngine] Initialized with VRM:', vrm.meta?.name);

        // Start with idle animation
        this.setScenario(ScenarioType.IDLE);

        return true;
    }

    /**
     * Ensure GLTF loader is ready
     */
    async _ensureLoader() {
        if (this.loaderReady) return true;

        try {
            const loaderModule = await import('three/examples/jsm/loaders/GLTFLoader.js');
            this.GLTFLoader = loaderModule.GLTFLoader;
            this.loaderReady = true;
            return true;
        } catch (error) {
            console.error('[AdvancedAnimationEngine] Failed to load GLTFLoader:', error);
            return false;
        }
    }

    /**
     * Load a VRMA animation file
     */
    async loadAnimation(url, name) {
        // Return cached if already loaded
        if (this.loadedAnimations.has(name)) {
            return this.loadedAnimations.get(name);
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const loadPromise = this._loadAnimationInternal(url, name);
        this.loadingPromises.set(name, loadPromise);

        try {
            const result = await loadPromise;
            this.loadingPromises.delete(name);
            return result;
        } catch (error) {
            this.loadingPromises.delete(name);
            throw error;
        }
    }

    async _loadAnimationInternal(url, name) {
        if (!this.vrm || !await this._ensureLoader()) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const loader = new this.GLTFLoader();
            loader.crossOrigin = 'anonymous';

            // Register VRMA parser
            loader.register((parser) => new VRMALoaderPlugin(parser));

            loader.load(
                url,
                (gltf) => {
                    const vrmAnimations = gltf.userData.vrmAnimations;

                    if (!vrmAnimations || vrmAnimations.length === 0) {
                        console.warn('[AdvancedAnimationEngine] No VRM animations in', url);
                        resolve(null);
                        return;
                    }

                    const vrmAnimation = vrmAnimations[0];
                    const clip = this._createAnimationClip(vrmAnimation, this.vrm);

                    if (!clip) {
                        resolve(null);
                        return;
                    }

                    const action = this.mixer.clipAction(clip);

                    const animData = {
                        name,
                        clip,
                        action,
                        duration: clip.duration
                    };

                    this.loadedAnimations.set(name, animData);
                    console.log(`[AdvancedAnimationEngine] Loaded: ${name} (${clip.duration.toFixed(2)}s)`);
                    resolve(animData);
                },
                undefined,
                (error) => {
                    console.error('[AdvancedAnimationEngine] Load error:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Create THREE.AnimationClip from VRMAnimation
     */
    _createAnimationClip(vrmAnimation, vrm) {
        const tracks = [];

        // Humanoid bone tracks
        for (const [boneName, origTrack] of vrmAnimation.humanoidTracks.rotation.entries()) {
            const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
            if (!bone) continue;

            const track = new THREE.QuaternionKeyframeTrack(
                `${bone.name}.quaternion`,
                origTrack.times,
                origTrack.values
            );
            tracks.push(track);
        }

        // Translation tracks
        for (const [boneName, origTrack] of vrmAnimation.humanoidTracks.translation.entries()) {
            const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
            if (!bone) continue;

            const track = new THREE.VectorKeyframeTrack(
                `${bone.name}.position`,
                origTrack.times,
                origTrack.values
            );
            tracks.push(track);
        }

        if (tracks.length === 0) {
            return null;
        }

        return new THREE.AnimationClip('VRMAClip', vrmAnimation.duration, tracks);
    }

    /**
     * Set the current scenario for intelligent animation selection
     */
    async setScenario(scenario) {
        this.currentScenario = scenario;
        console.log(`[AdvancedAnimationEngine] Scenario: ${scenario}`);

        // Select appropriate animation for scenario
        const animConfig = this._selectAnimationForScenario(scenario);
        if (animConfig) {
            await this.playAnimation(animConfig.name, {
                priority: AnimationPriority.NORMAL,
                loop: animConfig.loop
            });
        }
    }

    /**
     * Handle interactive triggers
     */
    async handleInteraction(interactionType) {
        console.log(`[AdvancedAnimationEngine] Interaction: ${interactionType}`);

        const animConfig = this._selectAnimationForInteraction(interactionType);
        if (animConfig) {
            await this.playAnimation(animConfig.name, {
                priority: AnimationPriority.HIGH,
                loop: false,
                returnToIdle: true
            });
        }
    }

    /**
     * Play an animation by name
     */
    async playAnimation(name, options = {}) {
        const {
            priority = AnimationPriority.NORMAL,
            loop = true,
            fadeIn = this.blendDuration,
            returnToIdle = false
        } = options;

        // Get animation config from library
        const animConfig = this.library.getAnimation(name);
        if (!animConfig) {
            console.warn(`[AdvancedAnimationEngine] Animation not found: ${name}`);
            return false;
        }

        // Load if needed
        let animData = this.loadedAnimations.get(name);
        if (!animData) {
            animData = await this.loadAnimation(animConfig.path, name);
            if (!animData) return false;
        }

        // Fade out current animation
        if (this.currentAnimation && this.currentAnimation !== name) {
            const current = this.loadedAnimations.get(this.currentAnimation);
            if (current?.action) {
                current.action.fadeOut(fadeIn);
            }
        }

        // Play new animation
        const { action } = animData;
        action.reset();
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        action.clampWhenFinished = !loop;
        action.fadeIn(fadeIn);
        action.play();

        // Track animation
        this.currentAnimation = name;
        this.isPlaying = true;
        this.lastAnimationChange = Date.now();
        this._addToRecentHistory(name);

        // Return to idle after one-shot
        if (returnToIdle && !loop) {
            setTimeout(() => {
                this.setScenario(ScenarioType.IDLE);
            }, animData.duration * 1000 + 200);
        }

        console.log(`[AdvancedAnimationEngine] Playing: ${name}`);
        this.onAnimationStart?.(name);

        return true;
    }

    /**
     * Play a random animation from the library
     */
    async playRandom() {
        const allAnims = this.library.getAllAnimationNames();
        const available = allAnims.filter(name => !this.recentAnimations.includes(name));

        if (available.length === 0) {
            // All animations played recently, pick any
            const randomIndex = Math.floor(Math.random() * allAnims.length);
            return this.playAnimation(allAnims[randomIndex]);
        }

        const randomIndex = Math.floor(Math.random() * available.length);
        return this.playAnimation(available[randomIndex]);
    }

    /**
     * Select animation based on scenario
     */
    _selectAnimationForScenario(scenario) {
        switch (scenario) {
            case ScenarioType.GREETING:
                return this.library.getRandomFromCategory('greeting') ||
                    this.library.getAnimation('hello');

            case ScenarioType.THINKING:
                return this.library.getAnimation('thinking') ||
                    this.library.getAnimation('humidai');

            case ScenarioType.CELEBRATING:
                return this.library.getRandomFromCategory('dance') ||
                    this.library.getAnimation('cheer');

            case ScenarioType.RELAXING:
                return this.library.getRandomFromCategory('action') ||
                    this.library.getAnimation('smartphone');

            case ScenarioType.IDLE:
            default:
                // Smart idle selection - avoid recent animations
                return this._selectSmartIdle();
        }
    }

    /**
     * Select animation based on interaction
     */
    _selectAnimationForInteraction(interaction) {
        switch (interaction) {
            case InteractionType.CLICK:
                return this.library.getAnimation('greeting') ||
                    this.library.getRandomFromCategory('greeting');

            case InteractionType.DOUBLE_CLICK:
                return this.library.getRandomFromCategory('dance') ||
                    this.library.getAnimation('spin');

            case InteractionType.HOVER:
                return this.library.getAnimation('peace_sign') ||
                    this.library.getAnimation('show_full_body');

            case InteractionType.DRAG_START:
                return this.library.getAnimation('surprise') ||
                    this.library.getAnimation('gatan');

            case InteractionType.DRAG_END:
                return this.library.getAnimation('model_pose') ||
                    this.library.getRandomFromCategory('pose');

            case InteractionType.LONG_PRESS:
                return this.library.getRandomFromCategory('special');

            default:
                return null;
        }
    }

    /**
     * Smart idle selection - weighted random avoiding recent plays
     */
    _selectSmartIdle() {
        const idleAnims = this.library.getCategory('idle');
        const poseAnims = this.library.getCategory('pose');
        const allIdle = [...idleAnims, ...poseAnims];

        // Filter out recently played
        const available = allIdle.filter(anim =>
            !this.recentAnimations.includes(anim.name)
        );

        if (available.length === 0) {
            // Clear history and pick any
            this.recentAnimations = [];
            return allIdle[Math.floor(Math.random() * allIdle.length)];
        }

        return available[Math.floor(Math.random() * available.length)];
    }

    /**
     * Track recent animations to avoid repetition
     */
    _addToRecentHistory(name) {
        this.recentAnimations.push(name);
        if (this.recentAnimations.length > this.maxRecentHistory) {
            this.recentAnimations.shift();
        }
    }

    /**
     * Handle animation finished event
     */
    _onAnimationFinished(event) {
        this.onAnimationEnd?.(this.currentAnimation);

        // If non-looping animation finished, return to idle
        if (this.currentScenario !== ScenarioType.IDLE) {
            return;
        }

        // Cycle to next idle animation
        this._selectSmartIdle();
    }

    /**
     * Update loop - call every frame
     */
    update(delta) {
        if (!this.isInitialized) return;

        // Update mixer
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Idle animation cycling
        const now = Date.now();
        if (this.currentScenario === ScenarioType.IDLE) {
            if (now - this.lastIdleCycleTime > this.idleCycleDuration) {
                this.lastIdleCycleTime = now;
                this.idleCycleDuration = 25000 + Math.random() * 15000;

                const nextIdle = this._selectSmartIdle();
                if (nextIdle && nextIdle.name !== this.currentAnimation) {
                    this.playAnimation(nextIdle.name, { priority: AnimationPriority.LOW });
                }
            }
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            currentAnimation: this.currentAnimation,
            currentScenario: this.currentScenario,
            isPlaying: this.isPlaying,
            loadedCount: this.loadedAnimations.size,
            recentAnimations: [...this.recentAnimations]
        };
    }

    /**
     * Pause all animations
     */
    pause() {
        if (this.currentAnimation) {
            const animData = this.loadedAnimations.get(this.currentAnimation);
            if (animData?.action) {
                animData.action.paused = true;
            }
        }
        this.isPlaying = false;
    }

    /**
     * Resume animations
     */
    resume() {
        if (this.currentAnimation) {
            const animData = this.loadedAnimations.get(this.currentAnimation);
            if (animData?.action) {
                animData.action.paused = false;
            }
        }
        this.isPlaying = true;
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        this.pause();

        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }

        this.loadedAnimations.clear();
        this.loadingPromises.clear();
        this.vrm = null;
        this.isInitialized = false;

        console.log('[AdvancedAnimationEngine] Disposed');
    }
}

/**
 * VRMALoaderPlugin - GLTFLoader plugin for VRMA files
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

        const humanBones = defExtension.humanoid?.humanBones;
        if (humanBones) {
            Object.entries(humanBones).forEach(([name, bone]) => {
                const node = bone?.node;
                if (node != null) {
                    humanoidIndexToName.set(node, name);
                }
            });
        }

        return { humanoidIndexToName };
    }

    _parseAnimation(animationClip, defAnimation, nodeMap) {
        const tracks = animationClip.tracks;
        const defChannels = defAnimation.channels;

        const result = {
            duration: animationClip.duration,
            humanoidTracks: {
                translation: new Map(),
                rotation: new Map()
            }
        };

        defChannels.forEach((channel, iChannel) => {
            const { node, path } = channel.target;
            const origTrack = tracks[iChannel];

            if (!origTrack) return;

            const boneName = nodeMap.humanoidIndexToName.get(node);
            if (boneName) {
                if (path === 'rotation') {
                    result.humanoidTracks.rotation.set(boneName, origTrack);
                } else if (path === 'translation') {
                    result.humanoidTracks.translation.set(boneName, origTrack);
                }
            }
        });

        return result;
    }
}

// Singleton instance
let engineInstance = null;

export function getAdvancedAnimationEngine() {
    if (!engineInstance) {
        engineInstance = new AdvancedAnimationEngine();
    }
    return engineInstance;
}

// Export constants
export { AnimationPriority, ScenarioType, InteractionType };
export default AdvancedAnimationEngine;
