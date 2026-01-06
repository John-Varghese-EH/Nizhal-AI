import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

/**
 * VRMLoaderService - Handles loading and managing VRM avatars
 * Supports VRM 0.x and 1.0 formats with expressions, look-at, and spring bones
 */
export class VRMLoaderService {
    constructor() {
        this.loader = new GLTFLoader();
        this.loader.register((parser) => new VRMLoaderPlugin(parser));
        this.currentVRM = null;
        this.mixer = null;
        this.clock = new THREE.Clock();

        // Expression presets for emotions
        this.expressionMap = {
            happy: ['happy', 'joy', 'smile'],
            sad: ['sad', 'sorrow'],
            angry: ['angry'],
            surprised: ['surprised'],
            neutral: ['neutral'],
            // Lip sync visemes
            aa: ['aa', 'a'],
            ih: ['ih', 'i'],
            ou: ['ou', 'o'],
            ee: ['ee', 'e'],
            oh: ['oh', 'u'],
            blink: ['blink', 'blinkLeft', 'blinkRight']
        };
    }

    /**
     * Load a VRM model from URL or file path
     * @param {string} url - URL or path to VRM file
     * @returns {Promise<Object>} - VRM instance with utilities
     */
    async loadVRM(url) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    const vrm = gltf.userData.vrm;

                    if (!vrm) {
                        reject(new Error('No VRM data found in model'));
                        return;
                    }

                    // Optimize the model
                    VRMUtils.removeUnnecessaryVertices(gltf.scene);
                    VRMUtils.removeUnnecessaryJoints(gltf.scene);
                    VRMUtils.combineSkeletons(gltf.scene);
                    VRMUtils.combineMorphs(vrm);

                    // Disable frustum culling to prevent model disappearing
                    vrm.scene.traverse((obj) => {
                        obj.frustumCulled = false;
                    });

                    // Rotate to face camera
                    vrm.scene.rotation.y = Math.PI;

                    // Store reference
                    this.currentVRM = vrm;

                    // Create animation mixer
                    this.mixer = new THREE.AnimationMixer(vrm.scene);

                    console.log('VRM loaded successfully:', {
                        expressionNames: vrm.expressionManager?.expressionMap ?
                            Object.keys(vrm.expressionManager.expressionMap) : [],
                        hasLookAt: !!vrm.lookAt,
                        hasSpringBone: !!vrm.springBoneManager
                    });

                    resolve({
                        vrm,
                        scene: vrm.scene,
                        mixer: this.mixer,
                        meta: vrm.meta
                    });
                },
                (progress) => {
                    console.log(`Loading VRM: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                },
                (error) => {
                    console.error('VRM load error:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Update VRM animations and physics
     * @param {number} delta - Time since last frame
     */
    update(delta) {
        if (this.currentVRM) {
            this.currentVRM.update(delta);
        }
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }

    /**
     * Set expression by name (with fallback)
     * @param {string} expressionType - Expression type (happy, sad, etc.)
     * @param {number} weight - Expression weight 0-1
     */
    setExpression(expressionType, weight = 1.0) {
        if (!this.currentVRM?.expressionManager) return;

        const expressionManager = this.currentVRM.expressionManager;
        const possibleNames = this.expressionMap[expressionType] || [expressionType];

        for (const name of possibleNames) {
            try {
                expressionManager.setValue(name, weight);
                return true;
            } catch {
                continue;
            }
        }
        return false;
    }

    /**
     * Reset all expressions to neutral
     */
    resetExpressions() {
        if (!this.currentVRM?.expressionManager) return;

        const expressionManager = this.currentVRM.expressionManager;
        if (expressionManager.resetValues) {
            expressionManager.resetValues();
        }
    }

    /**
     * Set look-at target position
     * @param {THREE.Vector3} target - Target position to look at
     */
    lookAt(target) {
        if (!this.currentVRM?.lookAt) return;
        this.currentVRM.lookAt.target = target;
    }

    /**
     * Trigger blink animation
     * @param {number} duration - Blink duration in ms
     */
    async blink(duration = 150) {
        this.setExpression('blink', 1.0);
        await new Promise(r => setTimeout(r, duration));
        this.setExpression('blink', 0.0);
    }

    /**
     * Get available expression names
     * @returns {string[]} Array of expression names
     */
    getExpressionNames() {
        if (!this.currentVRM?.expressionManager) return [];
        return Object.keys(this.currentVRM.expressionManager.expressionMap || {});
    }

    /**
     * Dispose of current VRM and free memory
     */
    dispose() {
        if (this.currentVRM) {
            VRMUtils.deepDispose(this.currentVRM.scene);
            this.currentVRM = null;
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }
    }
}

export default VRMLoaderService;
