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

        // Interactive hit-testing (pixel raycaster)
        this.raycaster = new THREE.Raycaster();
        this.mouseVec = new THREE.Vector2();
    }

    /**
     * Test if a client screen coordinate (clientX, clientY) hits the 3D model.
     * Returns true if pointer intersects any mesh of the VRM model, false for empty space.
     */
    hitTestAt(clientX, clientY) {
        if (!this.vrm || !this.vrm.scene || !this.camera || !this.canvas) return false;
        const rect = this.canvas.getBoundingClientRect();
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
            return false;
        }

        // Convert client pixels to Normalized Device Coordinates (-1 to +1)
        this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouseVec, this.camera);
        const intersects = this.raycaster.intersectObject(this.vrm.scene, true);
        return intersects.length > 0;
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
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0.0);
        this.renderer.autoClear = true;
        this.renderer.autoClearColor = true;
        this.renderer.autoClearDepth = true;
        this.renderer.autoClearStencil = true;
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
        if (this.vrm) {
            this.fitModelToCamera(this.vrm);
        }
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

        // Compute exact bounding box of the loaded VRM
        const bbox = new THREE.Box3().setFromObject(vrm.scene);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);

        // Fallbacks if bounding box is unpopulated or invalid
        const modelHeight = (size.y > 0.3 && size.y < 5.0) ? size.y : 1.45;
        const centerY = (center.y > 0.2 && center.y < 3.0) ? center.y : (modelHeight * 0.5);

        // Fit ratio: ~86% of the window height so character fills the window with natural margins
        const targetFillRatio = 0.86;
        const aspect = this.camera.aspect || 1.0;
        
        // Calculate the required visible height in world units
        const verticalFovRad = (this.camera.fov * Math.PI) / 180;
        
        // Fit both height and width safely with padding
        const requiredHeight = modelHeight / targetFillRatio;
        const requiredWidth = (size.x > 0.1 ? size.x : (modelHeight * 0.45)) / targetFillRatio;
        
        const distForHeight = (requiredHeight / 2) / Math.tan(verticalFovRad / 2);
        const distForWidth = (requiredWidth / (2 * aspect)) / Math.tan(verticalFovRad / 2);
        
        const distance = Math.max(distForHeight, distForWidth);

        // Focal point: center of the model (X=0, Y=centerY, Z=0)
        // Camera positioned straight ahead looking at the model center
        this.camera.position.set(0.0, centerY, distance);
        this.camera.lookAt(new THREE.Vector3(0.0, centerY, 0.0));
        this.camera.updateProjectionMatrix();
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

            const isIdle = !this.vrm?.expressionManager?.getValue?.('aa') && 
                           (!this.animationService || this.animationService.currentState === 'idle');

            if (this.animationService) {
                try {
                    this.animationService.update(delta);
                } catch (updateErr) {
                    // Fail silently or log once
                }
            }

            if (this.vrm) {
                // Natural weightless floating motion: subtle breathing oscillation
                if (isIdle && this.vrm.scene) {
                    const elapsed = this.clock.getElapsedTime();
                    // Gentle vertical breathing wave (amplitude ~8mm, cycle ~3.2s)
                    const hoverOffset = Math.sin(elapsed * 1.95) * 0.008;
                    const subtleTilt = Math.sin(elapsed * 0.98) * 0.004;
                    this.vrm.scene.position.y = hoverOffset;
                    this.vrm.scene.rotation.z = subtleTilt;
                }
                this.vrm.update(delta);
            }

            if (this.renderer && this.scene && this.camera) {
                // Explicitly clear all buffers before render to prevent ghosting/frame accumulation
                this.renderer.clear(true, true, true);
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
