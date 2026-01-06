import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    root: './src/renderer',
    publicDir: '../../public', // Point to project root's public folder for VRM files
    base: './',
    build: {
        outDir: '../../dist',
        emptyOutDir: true,
        sourcemap: process.env.NODE_ENV === 'development',
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/renderer/index.html'),
                character: path.resolve(__dirname, 'src/renderer/character.html')
            },
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'animation': ['framer-motion'],
                    'three': ['three', '@react-three/fiber']
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src/renderer'),
            '@components': path.resolve(__dirname, './src/renderer/components'),
            '@styles': path.resolve(__dirname, './src/renderer/styles')
        }
    },
    server: {
        port: 5173,
        strictPort: true,
        host: true
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'three']
    }
});
