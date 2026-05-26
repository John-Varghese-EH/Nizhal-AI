import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { getVRMAAnimationService } from './VRMAAnimationService';

export class ThreeCanvasController {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.vrm = null;
        this.clock = new THREE.Clock();
        this.animationFrameId = null;
        this.resizeObserver = null;
        this.loadStatus = 'idle'; // 'idle', 'loading', 'loaded', 'error'
        this.onStatusChange = null;
        this.animationService = null;
        this.loadSessionId = 0;
        this.currentUrl = null;
        
        // Debugging Metrics
        this.fps = 0;
        this.lastFpsUpdate = 0;
        this.frameCount = 0;
        this.onFpsUpdate = null;
    }

    mount(container) {
        if (!container) return;
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        this.container.appendChild(this.canvas);

        this.setupScene();
        this.setupResizeObserver();
        this.startLoop();
    }

    setupScene() {
        const width = this.container.clientWidth || 300;
        const height = this.container.clientHeight || 400;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20.0);
        this.camera.position.set(0.0, 1.2, 2.5); // Torso/head zoom level

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(0, 5, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
        fillLight.position.set(-5, 2, -2);
        this.scene.add(fillLight);
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    this.resize(width, height);
                }
            }
        });
        this.resizeObserver.observe(this.container);
    }

    resize(width, height) {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    async loadVRM(url) {
        if (!this.scene) return;
        
        // Prevent loading the exact same URL if already loaded or loading
        if (this.currentUrl === url && (this.loadStatus === 'loaded' || this.loadStatus === 'loading')) {
            return;
        }

        this.currentUrl = url;
        this.setStatus('loading');
        this.unloadVRM();

        const loadSessionId = ++this.loadSessionId;

        try {
            const loader = new GLTFLoader();
            loader.crossOrigin = 'anonymous';
            loader.register((parser) => new VRMLoaderPlugin(parser, {
                autoUpdateHumanBones: true
            }));

            loader.load(
                url,
                (gltf) => {
                    // Check if this load call is still the active one
                    if (loadSessionId !== this.loadSessionId) {
                        console.log('[ThreeCanvasController] Load cancelled because a newer model started loading.');
                        // Clean up the unused loaded assets
                        const vrm = gltf.userData.vrm;
                        if (vrm) {
                            vrm.scene.traverse((obj) => {
                                if (obj.geometry) obj.geometry.dispose();
                                if (obj.material) {
                                    if (Array.isArray(obj.material)) {
                                        obj.material.forEach(m => m.dispose());
                                    } else {
                                        obj.material.dispose();
                                    }
                                }
                            });
                        }
                        return;
                    }

                    const vrm = gltf.userData.vrm;
                    if (vrm) {
                        // Check if viewer has been disposed/unmounted during async load
                        if (!this.scene) {
                            console.log('[ThreeCanvasController] Model loaded but scene has already been disposed.');
                            return;
                        }
                        this.vrm = vrm;
                        
                        // Disable frustum culling to prevent model popping
                        vrm.scene.traverse((obj) => {
                            obj.frustumCulled = false;
                        });

                        // Rotate model to face camera
                        vrm.scene.rotation.y = Math.PI;

                        this.scene.add(vrm.scene);
                        this.fitModelToCamera(vrm);

                        // Initialize VRMA Animation Service
                        try {
                            this.animationService = getVRMAAnimationService();
                            this.animationService.initialize(vrm);
                            this.animationService.setState('idle');
                        } catch (animError) {
                            console.error('[ThreeCanvasController] Error setting up VRMA Animation Service:', animError);
                        }

                        this.setStatus('loaded');
                        console.log('[ThreeCanvasController] VRM successfully loaded:', vrm.meta?.name || url);
                    } else {
                        throw new Error('GLTF loaded but VRM plugin could not find VRM metadata.');
                    }
                },
                (progress) => {
                    // Progress handler
                },
                (error) => {
                    if (loadSessionId === this.loadSessionId) {
                        console.error('[ThreeCanvasController] Error loading VRM model:', error);
                        this.setStatus('error');
                    }
                }
            );
        } catch (e) {
            if (loadSessionId === this.loadSessionId) {
                console.error('[ThreeCanvasController] Exception loading VRM:', e);
                this.setStatus('error');
            }
        }
    }

    unloadVRM() {
        this.currentUrl = null;
        if (this.animationService) {
            try {
                this.animationService.dispose();
            } catch (err) {
                console.error('[ThreeCanvasController] Error disposing animationService:', err);
            }
            this.animationService = null;
        }
        if (this.vrm) {
            if (this.scene) {
                this.scene.remove(this.vrm.scene);
            }
            this.vrm.scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            this.vrm = null;
        }
    }

    fitModelToCamera(vrm) {
        if (!vrm || !this.camera) return;

        // Try to get actual head node position from humanoid bones
        let headHeight = 1.45; // Generous fallback
        try {
            const headNode = vrm.humanoid?.getNormalizedBoneNode?.('head') || vrm.humanoid?.getRawBoneNode?.('head');
            if (headNode) {
                const worldPosition = new THREE.Vector3();
                headNode.getWorldPosition(worldPosition);
                if (worldPosition.y > 0.5 && worldPosition.y < 3.0) {
                    headHeight = worldPosition.y;
                }
            }
        } catch (e) {
            console.warn('[ThreeCanvasController] Failed to resolve head bone node height, using fallback.');
        }

        // Stable camera and target focus setup with generous zoom-out margins.
        // We set distance to a highly padded range and lower the focal target slightly
        // towards the core torso center (Y = headHeight * 0.48), creating a solid safety margin 
        // on the left, right, top, and bottom borders for high-energy skeletal movements.
        const targetY = headHeight * 0.48; 
        const distance = Math.max(headHeight * 1.72, 2.55); // Generous full-body padding margins

        this.camera.position.set(0.0, headHeight * 0.64, distance);
        this.camera.lookAt(new THREE.Vector3(0.0, targetY, 0.0));
    }

    startLoop() {
        const render = (time) => {
            this.animationFrameId = requestAnimationFrame(render);
            
            const delta = this.clock.getDelta();
            
            // FPS Diagnostics tracking
            this.frameCount++;
            if (time - this.lastFpsUpdate >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / (time - this.lastFpsUpdate));
                this.frameCount = 0;
                this.lastFpsUpdate = time;
                if (this.onFpsUpdate) this.onFpsUpdate(this.fps);
            }

            if (this.animationService) {
                try {
                    this.animationService.update(delta);
                } catch (updateErr) {
                    // Fail silently or log once
                }
            }

            if (this.vrm) {
                this.vrm.update(delta);
            }

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        this.lastFpsUpdate = performance.now();
        this.animationFrameId = requestAnimationFrame(render);
    }

    stopLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    setStatus(status) {
        this.loadStatus = status;
        if (this.onStatusChange) this.onStatusChange(status);
    }

    dispose() {
        this.stopLoop();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.unloadVRM();
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.container = null;
        this.scene = null;
        this.camera = null;
    }
}
