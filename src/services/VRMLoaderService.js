/**
 * VRMLoaderService.js
 *
 * Manages the loading, parsing, state, and destruction of VRM 3D humanoid avatars
 * using three.js and @pixiv/three-vrm. Integrates a recursive, leak-free WebGL
 * texture and geometry deep-disposal routine.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

export class VRMLoaderService {
    constructor() {
        this.loader = new GLTFLoader();
        this.loader.register((parser) => new VRMLoaderPlugin(parser));
        this.currentVRM = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.isInitialized = false;

        this.expressionMap = {
            happy: ['happy', 'joy', 'smile'],
            sad: ['sad', 'sorrow'],
            angry: ['angry'],
            surprised: ['surprised'],
            neutral: ['neutral'],
            aa: ['aa', 'a'],
            ih: ['ih', 'i'],
            ou: ['ou', 'o'],
            ee: ['ee', 'e'],
            oh: ['oh', 'u'],
            blink: ['blink', 'blinkLeft', 'blinkRight']
        };

        console.log('[VRMLoaderService] Service initialized');
    }

    /**
     * Initializes service state.
     */
    async init() {
        if (this.isInitialized) return { success: true };
        this.isInitialized = true;
        return { success: true };
    }

    /**
     * Loads a VRM humanoid model asynchronously from an asset URL.
     */
    async loadVRM(url) {
        if (!url) {
            throw new Error('A valid asset URL is required to load a VRM model');
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    try {
                        const vrm = gltf.userData.vrm;
                        if (!vrm) {
                            throw new Error('GLTF userData does not contain VRM structure');
                        }

                        // Run three-vrm skeletal mesh and skeleton combination routines
                        VRMUtils.removeUnnecessaryVertices(gltf.scene);
                        VRMUtils.removeUnnecessaryJoints(gltf.scene);
                        VRMUtils.combineSkeletons(gltf.scene);
                        VRMUtils.combineMorphs(vrm);

                        // Disable frustum culling to prevent models from disappearing near screen edges
                        vrm.scene.traverse((obj) => {
                            obj.frustumCulled = false;
                        });

                        // Reorient model to face camera direction
                        vrm.scene.rotation.y = Math.PI;

                        // Dispose of old active model before referencing new avatar
                        this.dispose();

                        this.currentVRM = vrm;
                        this.mixer = new THREE.AnimationMixer(vrm.scene);

                        console.log('[VRMLoaderService] VRM avatar loaded successfully');
                        resolve({
                            vrm,
                            scene: vrm.scene,
                            mixer: this.mixer,
                            meta: vrm.meta
                        });
                    } catch (error) {
                        console.error('[VRMLoaderService] Processing loaded GLTF model failed:', error);
                        reject(error);
                    }
                },
                (progress) => {
                    const pct = ((progress.loaded / progress.total) * 100).toFixed(1);
                    console.log(`[VRMLoaderService] Asset load progress: ${pct}%`);
                },
                (error) => {
                    console.error('[VRMLoaderService] Asset network load failed:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Triggers active frame delta steps for bones and expression mixers.
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
     * Applies standard facial expression weights.
     */
    setExpression(expressionType, weight = 1.0) {
        if (!this.currentVRM?.expressionManager) return false;

        const expressionManager = this.currentVRM.expressionManager;
        const possibleNames = this.expressionMap[expressionType] || [expressionType];

        for (const name of possibleNames) {
            try {
                expressionManager.setValue(name, weight);
                return true;
            } catch (e) {
                // Check fallbacks if preset doesn't match
            }
        }
        return false;
    }

    /**
     * Resets all facial expression weights to neutral.
     */
    resetExpressions() {
        if (!this.currentVRM?.expressionManager) return;

        const expressionManager = this.currentVRM.expressionManager;
        if (expressionManager.resetValues) {
            expressionManager.resetValues();
        }
    }

    /**
     * Hooks tracking vectors to LookAt constraints.
     */
    lookAt(target) {
        if (!this.currentVRM?.lookAt) return;
        this.currentVRM.lookAt.target = target;
    }

    /**
     * Triggers clean blink durations.
     */
    async blink(duration = 150) {
        this.setExpression('blink', 1.0);
        await new Promise(r => setTimeout(r, duration));
        this.setExpression('blink', 0.0);
    }

    getExpressionNames() {
        if (!this.currentVRM?.expressionManager) return [];
        return Object.keys(this.currentVRM.expressionManager.expressionMap || {});
    }

    /**
     * Implements a leak-free recursive disposal routine, destroying WebGL textures,
     * materials, geometries, and maps safely.
     */
    dispose() {
        if (this.mixer) {
            try {
                this.mixer.stopAllAction();
                this.mixer.uncacheRoot(this.mixer.getRoot());
            } catch (e) {}
            this.mixer = null;
        }

        if (this.currentVRM) {
            const scene = this.currentVRM.scene;

            // Perform custom recursive WebGL texture, buffer, and geometry disposal
            scene.traverse((obj) => {
                if (obj.isMesh) {
                    if (obj.geometry) {
                        try { obj.geometry.dispose(); } catch (e) {}
                    }

                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach((mat) => this.disposeMaterial(mat));
                        } else {
                            this.disposeMaterial(obj.material);
                        }
                    }
                }
            });

            // Call pixiv native scene disposer to flush skeletal springs
            try {
                VRMUtils.deepDispose(scene);
            } catch (e) {}

            this.currentVRM = null;
        }

        console.log('[VRMLoaderService] Active VRM asset resources disposed completely');
    }

    /**
     * Deep-disposes singular materials and maps.
     */
    disposeMaterial(material) {
        if (!material) return;

        try {
            // Traverse material map entries
            const maps = [
                'map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap',
                'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'
            ];

            maps.forEach((mapName) => {
                if (material[mapName] && typeof material[mapName].dispose === 'function') {
                    material[mapName].dispose();
                }
            });

            if (typeof material.dispose === 'function') {
                material.dispose();
            }
        } catch (error) {
            console.error('[VRMLoaderService] Material disposal error:', error);
        }
    }

    /**
     * Resets active loader service contexts.
     */
    async reset() {
        this.dispose();
        this.currentVRM = null;
        this.mixer = null;
        return { success: true };
    }

    /**
     * Returns a snapshot of the current loaded asset health state.
     */
    getState() {
        return {
            initialized: this.isInitialized,
            loaded: !!this.currentVRM,
            avatarMeta: this.currentVRM?.meta || null,
            hasMixer: !!this.mixer,
            expressionsCount: this.getExpressionNames().length
        };
    }
}

export default VRMLoaderService;
