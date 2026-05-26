/**
 * PlatformBridge.js — Cross-platform abstraction layer for Nizhal AI
 * 
 * Provides a unified API for platform detection and feature availability.
 * The frontend uses this to adapt behavior based on desktop vs mobile,
 * device capability tier, and platform-specific feature support.
 */

import { invoke } from '@tauri-apps/api/core';

// Cache platform info after first fetch
let _platformInfo = null;
let _deviceTier = null;

/**
 * Get platform information from the Rust backend
 */
async function fetchPlatformInfo() {
    if (_platformInfo) return _platformInfo;
    try {
        _platformInfo = await invoke('get_platform_info');
    } catch (e) {
        console.warn('[PlatformBridge] Failed to get platform info, assuming desktop:', e);
        _platformInfo = {
            platform: 'windows',
            is_mobile: false,
            is_desktop: true,
            supports_overlay: true,
            supports_local_ai: true,
        };
    }
    return _platformInfo;
}

/**
 * Get device performance tier from Rust backend + WebGL detection
 * Returns: "high", "medium", or "low"
 */
async function fetchDeviceTier() {
    if (_deviceTier) return _deviceTier;

    // First check WebGL capability (fast, client-side)
    const webglTier = detectWebGLTier();

    // Then check system resources from Rust
    let systemTier = 'medium';
    try {
        systemTier = await invoke('get_device_tier');
    } catch (e) {
        console.warn('[PlatformBridge] Failed to get device tier:', e);
    }

    // Take the lower of the two (bottleneck determines tier)
    const tierOrder = { low: 0, medium: 1, high: 2 };
    let effectiveTier = tierOrder[webglTier] <= tierOrder[systemTier] ? webglTier : systemTier;

    // Desktop override: on desktop, if WebGL is supported, always default to at least 'medium' to enable 3D
    if (_platformInfo?.is_desktop && effectiveTier === 'low') {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (gl) {
                effectiveTier = 'medium';
                console.log('[PlatformBridge] Desktop override: elevating performance tier to medium to support 3D rendering');
            }
        } catch (e) {
            console.warn('[PlatformBridge] Desktop override check failed:', e);
        }
    }

    _deviceTier = effectiveTier;
    return _deviceTier;
}

/**
 * Detect WebGL capability tier from the browser/webview
 */
function detectWebGLTier() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        if (!gl) return 'low'; // No WebGL at all

        const isWebGL2 = gl instanceof WebGL2RenderingContext;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

        // Check for known low-end GPU indicators
        const lowEndGPUs = ['Mali-4', 'Mali-T', 'Adreno 3', 'Adreno 4', 'PowerVR SGX', 'VideoCore'];
        const isLowEndGPU = lowEndGPUs.some(gpu => renderer.includes(gpu));

        if (isLowEndGPU || maxTextureSize < 4096 || !isWebGL2) {
            return 'low';
        }

        // Check for mid-range indicators
        const midRangeGPUs = ['Adreno 5', 'Adreno 6', 'Mali-G5', 'Mali-G7', 'Apple A1'];
        const isMidRange = midRangeGPUs.some(gpu => renderer.includes(gpu));

        if (isMidRange || maxTextureSize < 8192) {
            return 'medium';
        }

        return 'high';
    } catch (e) {
        return 'low'; // Safe fallback
    }
}

/**
 * Detect available device memory (navigator.deviceMemory API)
 * Returns estimated RAM in GB, or null if not available
 */
function getDeviceMemoryGB() {
    if ('deviceMemory' in navigator) {
        return navigator.deviceMemory; // Returns 0.25, 0.5, 1, 2, 4, 8
    }
    return null;
}

/**
 * Check if the device has a touch screen
 */
function isTouchDevice() {
    return 'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
}

// ============================================================
// Main Platform API — exported for use throughout the app
// ============================================================

export const Platform = {
    /**
     * Initialize platform detection (call once on app boot)
     */
    async init() {
        try {
            await fetchPlatformInfo();
            await fetchDeviceTier();
            console.log(`[PlatformBridge] Platform: ${_platformInfo.platform}, Tier: ${_deviceTier}, Mobile: ${_platformInfo.is_mobile}`);
        } catch (error) {
            console.error('[PlatformBridge] Initialization failed:', error);
        }
    },

    /**
     * Return standard health status (READY, INITIALIZING, ERROR)
     */
    status() {
        return _platformInfo ? 'READY' : 'INITIALIZING';
    },

    /**
     * Standard cleanup releasing cached platform assets
     */
    dispose() {
        _platformInfo = null;
        _deviceTier = null;
        console.log('[PlatformBridge] Disposed and cached parameters cleared.');
    },

    // --- Platform checks ---
    isDesktop: () => _platformInfo?.is_desktop ?? true,
    isMobile: () => _platformInfo?.is_mobile ?? false,
    isAndroid: () => _platformInfo?.platform === 'android',
    isIOS: () => _platformInfo?.platform === 'ios',
    isWindows: () => _platformInfo?.platform === 'windows',
    isMacOS: () => _platformInfo?.platform === 'macos',
    getPlatform: () => _platformInfo?.platform ?? 'unknown',

    // --- Feature availability ---
    supportsOverlay: () => _platformInfo?.supports_overlay ?? true,
    supportsLocalAI: () => _platformInfo?.supports_local_ai ?? true,
    supportsMultiWindow: () => _platformInfo?.is_desktop ?? true,
    supportsGlobalShortcuts: () => _platformInfo?.is_desktop ?? true,
    supportsWindowPolling: () => _platformInfo?.platform === 'windows',

    // --- Device capability ---
    getDeviceTier: () => _deviceTier ?? 'medium',
    isHighEnd: () => _deviceTier === 'high',
    isMidRange: () => _deviceTier === 'medium',
    isLowEnd: () => _deviceTier === 'low',
    isTouchDevice,
    getDeviceMemoryGB,

    // --- Rendering decisions ---
    /**
     * Should we load the full Three.js/VRM 3D pipeline?
     * Only on HIGH and MEDIUM tier devices
     */
    shouldUse3D: () => {
        const tier = _deviceTier ?? 'medium';
        return tier === 'high' || tier === 'medium';
    },

    /**
     * Should we use the lightweight 2D avatar fallback?
     * On LOW tier devices or when explicitly requested
     */
    shouldUse2D: () => {
        return (_deviceTier ?? 'medium') === 'low';
    },

    /**
     * Get recommended Three.js render settings based on device tier
     */
    getRenderSettings: () => {
        const tier = _deviceTier ?? 'medium';
        switch (tier) {
            case 'high':
                return {
                    pixelRatio: Math.min(window.devicePixelRatio, 2),
                    shadows: true,
                    antialias: true,
                    particleCount: 100,
                    textureSize: 1024,
                    fps: 60,
                    postProcessing: true,
                };
            case 'medium':
                return {
                    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
                    shadows: false,
                    antialias: false,
                    particleCount: 30,
                    textureSize: 512,
                    fps: 30,
                    postProcessing: false,
                };
            case 'low':
            default:
                return {
                    pixelRatio: 1,
                    shadows: false,
                    antialias: false,
                    particleCount: 0,
                    textureSize: 256,
                    fps: 30,
                    postProcessing: false,
                };
        }
    },

    /**
     * Get AI provider defaults for current platform
     * Mobile: cloud-only (no Ollama/LMStudio/OpenWebUI)
     * Desktop: all providers available
     */
    getDefaultAIProviders: () => {
        if (_platformInfo?.is_mobile) {
            return ['groq', 'gemini', 'huggingface', 'together', 'openai', 'anthropic', 'custom'];
        }
        return ['groq', 'gemini', 'huggingface', 'together', 'ollama', 'lmstudio', 'openwebui', 'openai', 'anthropic', 'custom'];
    },

    // --- Raw platform info ---
    getRawInfo: () => ({ ..._platformInfo }),
};

export default Platform;
