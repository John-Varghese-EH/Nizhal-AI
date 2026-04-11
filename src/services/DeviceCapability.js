/**
 * DeviceCapability.js — Runtime device capability detection
 * 
 * Detects GPU, memory, and rendering capabilities to determine
 * the optimal rendering tier for the VRM avatar system.
 * 
 * Tiers:
 *   HIGH   — Full VRM 3D with shadows, particles, lip-sync, physics hair
 *   MEDIUM — Simplified VRM with reduced textures, no shadows/particles
 *   LOW    — 2D animated avatar (CSS sprites / Lottie), no Three.js at all
 */

import { Platform } from './PlatformBridge';

/**
 * Run a quick GPU benchmark by rendering a test scene
 * Returns estimated FPS capability
 */
function benchmarkGPU() {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (!gl) {
                resolve(0);
                return;
            }

            // Simple triangle benchmark — measure frame time
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, `
                attribute vec2 position;
                void main() { gl_Position = vec4(position, 0.0, 1.0); }
            `);
            gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, `
                precision mediump float;
                void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }
            `);
            gl.compileShader(fragmentShader);

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                0, 0.5, -0.5, -0.5, 0.5, -0.5
            ]), gl.STATIC_DRAW);

            const pos = gl.getAttribLocation(program, 'position');
            gl.enableVertexAttribArray(pos);
            gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

            // Render 100 frames and measure time
            const start = performance.now();
            for (let i = 0; i < 100; i++) {
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
            gl.finish(); // Sync
            const elapsed = performance.now() - start;

            // Cleanup
            gl.deleteProgram(program);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteBuffer(buffer);

            const estimatedFPS = Math.round(100 / (elapsed / 1000));
            resolve(estimatedFPS);
        } catch (e) {
            resolve(0);
        }
    });
}

/**
 * Get comprehensive device capability report
 */
export async function getDeviceCapabilities() {
    const memory = Platform.getDeviceMemoryGB(); // null if not available
    const tier = Platform.getDeviceTier();
    const isMobile = Platform.isMobile();
    const isTouch = Platform.isTouchDevice();

    // WebGL info
    let webglInfo = { supported: false, version: 0, renderer: 'unknown', maxTextureSize: 0 };
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            webglInfo = {
                supported: true,
                version: gl instanceof WebGL2RenderingContext ? 2 : 1,
                renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            };
        }
    } catch (e) { /* no webgl */ }

    // Quick GPU benchmark (only if WebGL is available)
    let gpuFPS = 0;
    if (webglInfo.supported) {
        gpuFPS = await benchmarkGPU();
    }

    return {
        tier,
        isMobile,
        isTouch,
        memory,
        webgl: webglInfo,
        gpuBenchmarkFPS: gpuFPS,
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            pixelRatio: window.devicePixelRatio,
        },
        recommendations: {
            use3D: tier !== 'low' && webglInfo.supported,
            useVRM: tier === 'high' || (tier === 'medium' && !isMobile),
            useSimplifiedVRM: tier === 'medium' && isMobile,
            use2D: tier === 'low' || !webglInfo.supported,
            maxParticles: tier === 'high' ? 100 : tier === 'medium' ? 30 : 0,
            textureSize: tier === 'high' ? 1024 : tier === 'medium' ? 512 : 256,
            enableShadows: tier === 'high' && !isMobile,
            enablePostProcessing: tier === 'high' && !isMobile,
        }
    };
}

/**
 * Get optimal VRM configuration based on device tier
 */
export function getOptimalVRMConfig(tier = null) {
    const t = tier || Platform.getDeviceTier();

    switch (t) {
        case 'high':
            return {
                enablePhysics: true,        // Hair/cloth physics
                enableLipSync: true,        // Lip sync animations
                enableBlink: true,          // Auto-blink
                enableBreathing: true,      // Breathing animation
                enableIK: true,             // Inverse kinematics
                enableShadow: true,
                enableParticles: true,
                textureQuality: 'high',     // 1024x1024
                polyLimit: null,            // No limit
                updateRate: 60,             // 60fps updates
                eyeTracking: true,          // Mouse/face tracking
            };
        case 'medium':
            return {
                enablePhysics: false,       // Disable physics (expensive)
                enableLipSync: true,        // Keep lip sync
                enableBlink: true,
                enableBreathing: true,
                enableIK: false,            // Disable IK
                enableShadow: false,
                enableParticles: false,
                textureQuality: 'medium',   // 512x512
                polyLimit: 20000,           // Reduce polygon count
                updateRate: 30,             // 30fps updates
                eyeTracking: true,
            };
        case 'low':
        default:
            return {
                enablePhysics: false,
                enableLipSync: false,
                enableBlink: false,
                enableBreathing: false,
                enableIK: false,
                enableShadow: false,
                enableParticles: false,
                textureQuality: 'low',      // 256x256
                polyLimit: 5000,
                updateRate: 15,             // 15fps updates
                eyeTracking: false,
            };
    }
}

export default {
    getDeviceCapabilities,
    getOptimalVRMConfig,
    benchmarkGPU,
};
