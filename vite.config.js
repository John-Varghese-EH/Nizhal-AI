import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    root: './src/renderer',
    publicDir: '../../public',
    base: './',

    // Tauri: prevent Vite from obscuring Rust errors
    clearScreen: false,

    server: {
        port: 1420,
        strictPort: true,
        host: true,
        watch: {
            // Tell Vite to ignore watching src-tauri
            ignored: ['**/src-tauri/**']
        }
    },

    // Tauri env prefix support
    envPrefix: ['VITE_', 'TAURI_'],

    build: {
        outDir: '../../dist',
        emptyOutDir: true,
        // Tauri uses Chromium on Windows, WebKit on macOS and Linux
        target: process.env.TAURI_ENV_PLATFORM === 'windows'
            ? 'chrome105'
            : 'safari13',
        // Don't minify for debug builds
        minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
        sourcemap: !!process.env.TAURI_ENV_DEBUG,
        chunkSizeWarningLimit: 1500, // Increase warning limit for 3D/AI heavy libraries
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/renderer/index.html'),
                character: path.resolve(__dirname, 'src/renderer/character.html')
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('@react-three') || id.includes('three')) {
                            return 'three-vendor';
                        }
                        if (id.includes('@pixiv/three-vrm')) {
                            return 'vrm-vendor';
                        }
                        if (id.includes('livekit') || id.includes('webrtc')) {
                            return 'livekit-vendor';
                        }
                        if (id.includes('framer-motion')) {
                            return 'animation-vendor';
                        }
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'react-vendor';
                        }
                        return 'vendor'; // Unclassified node_modules
                    }
                }
            }
        }
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src/renderer'),
            '@components': path.resolve(__dirname, './src/renderer/components'),
            '@styles': path.resolve(__dirname, './src/renderer/styles'),
            '@lib': path.resolve(__dirname, './src/lib')
        }
    },

    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'three']
    }
});
