/**
 * vite.config.js — Multi-entry build for the Nizhal browser extension
 *
 * Builds three separate entry points:
 *   1. sidebar.html  → React sidebar UI
 *   2. background.js → Service Worker (WebSocket bridge)
 *   3. content.js    → Content script (page context extraction)
 *
 * Also generates the correct manifest.json for the target browser
 * (Chrome/Brave/Edge = Manifest V3 sidePanel, Firefox = sidebar_action).
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Detect target browser from env. Defaults to 'chrome'.
 * Set BROWSER_TARGET=firefox to build for Firefox.
 */
const BROWSER_TARGET = process.env.BROWSER_TARGET || 'chrome';

/**
 * Post-build plugin: writes the manifest.json for the target browser.
 */
function manifestPlugin() {
    return {
        name: 'generate-manifest',
        closeBundle() {
            const outDir = path.resolve(__dirname, 'dist');

            // ── Shared manifest fields ──
            const shared = {
                name: 'Nizhal AI',
                description: 'Your AI desktop companion — right in your browser sidebar.',
                version: '1.0.0',
                icons: {
                    16: 'icons/icon-16.png',
                    48: 'icons/icon-48.png',
                    128: 'icons/icon-128.png',
                },
            };

            let manifest;

            if (BROWSER_TARGET === 'firefox') {
                // ── Firefox: Manifest V2 with sidebar_action ──
                manifest = {
                    ...shared,
                    manifest_version: 2,
                    permissions: ['activeTab', 'storage'],
                    sidebar_action: {
                        default_title: 'Nizhal AI',
                        default_panel: 'sidebar.html',
                        default_icon: 'icons/icon-48.png',
                    },
                    background: {
                        scripts: ['background.js'],
                        type: 'module',
                    },
                    content_scripts: [
                        {
                            matches: ['<all_urls>'],
                            js: ['content.js'],
                            run_at: 'document_idle',
                        },
                    ],
                    content_security_policy:
                        "script-src 'self'; connect-src 'self' ws://localhost:* http://localhost:*; object-src 'self';",
                    browser_specific_settings: {
                        gecko: {
                            id: 'extension@nizhal.ai',
                            strict_min_version: '109.0',
                        },
                    },
                };
            } else {
                // ── Chromium (Chrome, Edge, Brave, Opera): Manifest V3 ──
                manifest = {
                    ...shared,
                    manifest_version: 3,
                    permissions: ['activeTab', 'sidePanel', 'storage'],
                    side_panel: {
                        default_path: 'sidebar.html',
                    },
                    background: {
                        service_worker: 'background.js',
                        type: 'module',
                    },
                    content_scripts: [
                        {
                            matches: ['<all_urls>'],
                            js: ['content.js'],
                            run_at: 'document_idle',
                        },
                    ],
                    content_security_policy: {
                        extension_pages:
                            "script-src 'self'; connect-src 'self' ws://localhost:* http://localhost:*; object-src 'self';",
                    },
                    action: {
                        default_title: 'Open Nizhal AI Sidebar',
                        default_icon: {
                            16: 'icons/icon-16.png',
                            48: 'icons/icon-48.png',
                            128: 'icons/icon-128.png',
                        },
                    },
                };
            }

            fs.writeFileSync(
                path.join(outDir, 'manifest.json'),
                JSON.stringify(manifest, null, 2)
            );

            // Copy icons directory to dist
            const iconsSrc = path.resolve(__dirname, 'public/icons');
            const iconsDest = path.join(outDir, 'icons');
            if (fs.existsSync(iconsSrc)) {
                fs.mkdirSync(iconsDest, { recursive: true });
                for (const file of fs.readdirSync(iconsSrc)) {
                    fs.copyFileSync(
                        path.join(iconsSrc, file),
                        path.join(iconsDest, file)
                    );
                }
            }

            console.log(`\n✓ Manifest generated for: ${BROWSER_TARGET.toUpperCase()}\n`);

            // Flatten sidebar.html — Vite nests it under src/sidebar/
            const nestedHtml = path.join(outDir, 'src', 'sidebar', 'sidebar.html');
            const flatHtml = path.join(outDir, 'sidebar.html');
            if (fs.existsSync(nestedHtml)) {
                let htmlContent = fs.readFileSync(nestedHtml, 'utf8');
                // Replace relative paths assuming HTML is now at root
                htmlContent = htmlContent.replace(/\.\.\/\.\.\//g, './');
                fs.writeFileSync(flatHtml, htmlContent, 'utf8');
                // Clean up nested directory
                fs.rmSync(path.join(outDir, 'src'), { recursive: true, force: true });
                console.log('✓ sidebar.html flattened to dist root and paths resolved to relative root');
            }
        },
    };
}

export default defineConfig({
    plugins: [react(), manifestPlugin()],
    base: '',

    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: process.env.NODE_ENV === 'development',

        rollupOptions: {
            input: {
                sidebar: path.resolve(__dirname, 'src/sidebar/sidebar.html'),
                background: path.resolve(__dirname, 'src/background/background.js'),
                content: path.resolve(__dirname, 'src/content/content.js'),
            },
            output: {
                // Extensions need flat output — no hashed filenames
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name].js',
                assetFileNames: 'assets/[name][extname]',
            },
        },
    },

    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, 'src/shared'),
            '@sidebar': path.resolve(__dirname, 'src/sidebar'),
        },
    },
});
