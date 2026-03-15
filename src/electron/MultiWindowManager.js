import { BrowserWindow, Tray, Menu, nativeImage, screen, app } from 'electron';
import path from 'path';
import WindowDetectionService from './WindowDetection.js';
import IdleDetection from './IdleDetection.js';

/**
 * MultiWindowManager - Manages separate Character and Chat windows
 */
export class MultiWindowManager {
    constructor(isDev = false) {
        this.isDev = isDev;
        this.characterWindow = null;
        this.chatWindow = null;
        this.tray = null;
        this.isCharacterVisible = true;
        this.isChatVisible = false;

        // Settings
        this.enableWindowDetection = false;

        // Init idle detection immediately (monitor user activity)
        this.startIdleDetection();
    }

    /**
     * Create the character overlay window (transparent, always-on-top)
     * Enhanced for better OS integration and productivity
     */
    async createCharacterWindow(preloadPath) {
        const display = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = display.workArea;

        // Calculate optimal window size based on screen resolution
        // Target: 15% of screen height, minimum 400px, maximum 700px
        const targetHeight = Math.max(400, Math.min(700, Math.round(screenHeight * 0.35)));
        const targetWidth = Math.round(targetHeight * 0.65); // Maintain aspect ratio

        // Position at bottom right with some padding
        const padding = 20;
        const posX = screenWidth - targetWidth - padding;
        const posY = screenHeight - targetHeight - padding;

        this.characterWindow = new BrowserWindow({
            width: targetWidth,
            height: targetHeight,
            x: posX,
            y: posY,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: true,
            hasShadow: false,
            focusable: true,
            backgroundColor: '#00000000',
            type: 'toolbar', // Better OS integration on macOS
            vibrancy: 'under-window', // macOS blur effect
            visualEffectState: 'active', // macOS visual state
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
                // Performance optimizations
                backgroundThrottling: false,
                offscreen: false,
                spellcheck: false
            },
            icon: path.join(process.cwd(), 'assets', 'icon.png')
        });

        // Enhanced window properties for better OS integration
        this.characterWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        this.characterWindow.setAlwaysOnTop(true, 'floating', 1);
        
        // Set app user model ID for Windows (better taskbar integration)
        if (process.platform === 'win32') {
            app.setAppUserModelId('Nizhal AI');
        }

        // Enable click-through on transparent pixels
        // This allows clicks to pass through empty areas but still interact with the character
        this.characterWindow.setIgnoreMouseEvents(true, { forward: true });

        // Load character view
        if (this.isDev) {
            await this.characterWindow.loadURL('http://localhost:5173/character.html');
        } else {
            await this.characterWindow.loadFile(path.join(process.cwd(), 'dist', 'character.html'));
        }

        // Handle window events
        this.characterWindow.on('closed', () => {
            this.characterWindow = null;
        });

        // Enable dragging and notify of window size
        this.characterWindow.webContents.on('did-finish-load', () => {
            this.characterWindow.webContents.send('window:ready', 'character');
            this.characterWindow.webContents.send('window:resize', { width: targetWidth, height: targetHeight });
            // Send performance mode info
            this.characterWindow.webContents.send('system:performanceMode', {
                isLowEnd: global.isLowEndMode || false
            });
        });

        // Window blur/focus handling for productivity
        this.characterWindow.on('blur', () => {
            this.characterWindow.webContents.send('window:blur');
        });
        
        this.characterWindow.on('focus', () => {
            this.characterWindow.webContents.send('window:focus');
        });

        return this.characterWindow;
    }

    /**
     * Toggle click-through mode for character window
     * Enhanced with visual feedback and smart behavior
     * @param {boolean} ignore - If true, enables click-through
     */
    setCharacterClickThrough(ignore) {
        if (this.characterWindow) {
            if (ignore) {
                // Enable click-through with forwarding (clicks pass through transparent areas)
                this.characterWindow.setIgnoreMouseEvents(true, { forward: true });
                this.characterWindow.webContents.send('character:interactionMode', 'clickthrough');
            } else {
                // Disable click-through (window captures all clicks)
                this.characterWindow.setIgnoreMouseEvents(false);
                this.characterWindow.webContents.send('character:interactionMode', 'interactive');
            }
        }
    }

    /**
     * Create the chat/settings window (standard app window)
     */
    async createChatWindow(preloadPath) {
        this.chatWindow = new BrowserWindow({
            width: 400,
            height: 600,
            minWidth: 320,
            minHeight: 480,
            frame: false,
            transparent: false,
            alwaysOnTop: false,
            show: false, // Start hidden
            backgroundColor: '#0a0a0f',
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            },
            icon: path.join(process.cwd(), 'assets', 'icon.png')
        });

        // Load chat view
        if (this.isDev) {
            await this.chatWindow.loadURL('http://localhost:5173/');
        } else {
            await this.chatWindow.loadFile(path.join(process.cwd(), 'dist', 'index.html'));
        }

        this.chatWindow.on('closed', () => {
            this.chatWindow = null;
            this.isChatVisible = false;
        });

        this.chatWindow.on('close', (e) => {
            // Hide instead of close if character is still visible
            if (this.characterWindow && !this.characterWindow.isDestroyed()) {
                e.preventDefault();
                this.chatWindow.hide();
                this.isChatVisible = false;
            }
        });

        this.chatWindow.webContents.on('did-finish-load', () => {
            this.chatWindow.webContents.send('window:ready', 'chat');
        });

        return this.chatWindow;
    }

    /**
     * Create system tray icon
     */
    createTray(iconPath, onShowChat, onShowCharacter, onQuit) {
        // Create tray icon
        const icon = nativeImage.createFromPath(iconPath);
        this.tray = new Tray(icon.resize({ width: 16, height: 16 }));

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show Chat',
                click: () => {
                    this.showChatWindow();
                    onShowChat?.();
                }
            },
            {
                label: 'Show/Hide Character',
                click: () => {
                    this.toggleCharacterWindow();
                    onShowCharacter?.();
                }
            },
            { type: 'separator' },
            {
                label: 'Settings',
                click: () => {
                    this.showChatWindow();
                    this.chatWindow?.webContents.send('navigate', 'settings');
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => {
                    onQuit?.();
                    app.quit();
                }
            }
        ]);

        this.tray.setToolTip('Nizhal AI');
        this.tray.setContextMenu(contextMenu);

        // Click tray to toggle chat
        this.tray.on('click', () => {
            this.toggleChatWindow();
        });

        return this.tray;
    }

    /**
     * Show chat window (create if needed)
     */
    showChatWindow() {
        if (this.chatWindow && !this.chatWindow.isDestroyed()) {
            this.chatWindow.show();
            this.chatWindow.focus();
            this.isChatVisible = true;
        }
    }

    /**
     * Hide chat window
     */
    hideChatWindow() {
        if (this.chatWindow && !this.chatWindow.isDestroyed()) {
            this.chatWindow.hide();
            this.isChatVisible = false;
        }
    }

    /**
     * Toggle chat window visibility
     */
    toggleChatWindow() {
        if (this.isChatVisible) {
            this.hideChatWindow();
        } else {
            this.showChatWindow();
        }
    }

    /**
     * Show character window
     */
    showCharacterWindow() {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            this.characterWindow.show();
            this.isCharacterVisible = true;
        }
    }

    /**
     * Hide character window
     */
    hideCharacterWindow() {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            this.characterWindow.hide();
            this.isCharacterVisible = false;
        }
    }

    /**
     * Toggle character window visibility
     */
    toggleCharacterWindow() {
        if (this.isCharacterVisible) {
            this.hideCharacterWindow();
        } else {
            this.showCharacterWindow();
        }
    }

    /**
     * Send message to character window
     */
    sendToCharacter(channel, ...args) {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            this.characterWindow.webContents.send(channel, ...args);
        }
    }

    /**
     * Send message to chat window
     */
    sendToChat(channel, ...args) {
        if (this.chatWindow && !this.chatWindow.isDestroyed()) {
            this.chatWindow.webContents.send(channel, ...args);
        }
    }

    /**
     * Broadcast to all windows
     */
    broadcast(channel, ...args) {
        this.sendToCharacter(channel, ...args);
        this.sendToChat(channel, ...args);
    }

    /**
     * Set character window always on top
     */
    setCharacterAlwaysOnTop(enable) {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            this.characterWindow.setAlwaysOnTop(enable, 'floating', 1);
        }
    }

    /**
     * Set character window click-through
     */
    setCharacterClickThrough(enable) {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            this.characterWindow.setIgnoreMouseEvents(enable, { forward: true });
        }
    }

    /**
     * Get character window position
     */
    getCharacterPosition() {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            return this.characterWindow.getBounds();
        }
        return null;
    }

    /**
     * Set character window position
     */
    setCharacterPosition(x, y) {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            this.characterWindow.setPosition(Math.round(x), Math.round(y));
        }
    }

    /**
     * Set character window size
     */
    setCharacterSize(width, height) {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            this.characterWindow.setSize(Math.round(width), Math.round(height));
            this.characterWindow.webContents.send('window:resize', { width, height });
        }
    }

    /**
     * Snap character to corner with smart positioning
     * Enhanced to avoid blocking important UI elements
     */
    snapCharacterToCorner(corner) {
        if (!this.characterWindow || this.characterWindow.isDestroyed()) return;

        const display = screen.getPrimaryDisplay();
        const { width, height } = display.workArea;
        const winBounds = this.characterWindow.getBounds();
        const padding = 20;
        const taskbarHeight = process.platform === 'win32' ? 48 : 0; // Windows taskbar estimation

        let x = 0;
        let y = 0;

        switch (corner) {
            case 'top-left':
                x = padding;
                y = padding;
                break;
            case 'top-right':
                x = width - winBounds.width - padding;
                y = padding;
                break;
            case 'bottom-left':
                x = padding;
                y = height - winBounds.height - padding - taskbarHeight;
                break;
            case 'bottom-right':
                x = width - winBounds.width - padding;
                y = height - winBounds.height - padding - taskbarHeight;
                break;
        }

        this.characterWindow.setPosition(Math.round(x), Math.round(y));
        // Notify renderer of position change for smooth transitions
        this.characterWindow.webContents.send('window:position', { x: Math.round(x), y: Math.round(y), corner });
    }

    /**
     * Start window detection loop
     */
    startWindowDetection() {
        if (this.enableWindowDetection) return;
        this.enableWindowDetection = true;

        WindowDetectionService.start((data) => {
            // Send data to character window if visible
            if (this.characterWindow && !this.characterWindow.isDestroyed() && this.characterWindow.isVisible()) {
                // Add character window bounds to data so renderer knows where it is relative to others
                const charBounds = this.characterWindow.getBounds();
                this.sendToCharacter('window:update', {
                    ...data,
                    character: charBounds
                });
            }
        });
    }

    /**
     * Stop window detection loop
     */
    stopWindowDetection() {
        this.enableWindowDetection = false;
        WindowDetectionService.stop();
    }

    /**
     * Move character to top-left corner (used when maximizing main window)
     */
    moveCharacterToTopLeft() {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            const currentBounds = this.characterWindow.getBounds();
            this.originalCharacterPosition = { x: currentBounds.x, y: currentBounds.y };

            // Move to top-left with some padding
            this.characterWindow.setPosition(20, 20, true);
            this.characterWindow.setAlwaysOnTop(true, 'screen-saver'); // Ensure it stays on top of full screen
        }
    }

    /**
     * Restore character to previous position
     */
    restoreCharacterPosition() {
        if (this.characterWindow && !this.characterWindow.isDestroyed() && this.originalCharacterPosition) {
            this.characterWindow.setPosition(
                this.originalCharacterPosition.x,
                this.originalCharacterPosition.y,
                true
            );
            this.characterWindow.setAlwaysOnTop(true, 'floating'); // Reset z-order
        }
    }

    /**
     * Start system idle detection
     */
    startIdleDetection() {
        IdleDetection.start({
            onIdle: () => {
                console.log('System Idle - Expanding to fullscreen screensaver...');

                if (this.characterWindow && !this.characterWindow.isDestroyed()) {
                    // Save current bounds to restore later
                    if (!this.previousBounds) {
                        this.previousBounds = this.characterWindow.getBounds();
                    }

                    // Get primary display size
                    const display = screen.getPrimaryDisplay();
                    const { width, height } = display.workArea;

                    // Set to full screen (transparent overlay)
                    this.characterWindow.setBounds({ x: 0, y: 0, width, height }, true);
                    this.characterWindow.setAlwaysOnTop(true, 'screen-saver'); // Higher priority

                    // Notify renderer
                    this.sendToCharacter('system:idle', { isFullscreen: true });
                }
            },
            onActive: () => {
                console.log('System Active - Restoring window...');
                this._restoreFromIdle();
            },
            onSuspend: () => {
                console.log('System Suspend - Character will wait...');
            },
            onResume: () => {
                console.log('System Resume - Restoring character...');
                // Restore window after resume with delay for desktop to fully load
                setTimeout(() => this._restoreCharacterWindow(), 1500);
            },
            onLockScreen: () => {
                console.log('Screen Locked');
                // Remember visibility state before lock
                this._wasVisibleBeforeLock = this.isCharacterVisible;
            },
            onUnlockScreen: () => {
                console.log('Screen Unlocked - Restoring character...');
                this._restoreFromIdle();

                // Restore window after unlock with delay for desktop to be ready
                setTimeout(() => {
                    if (this._wasVisibleBeforeLock !== false) {
                        this._restoreCharacterWindow();
                    }
                }, 1000);
            }
        });
    }

    /**
     * Restore window from idle fullscreen state
     */
    _restoreFromIdle() {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            // Restore previous bounds if they exist
            if (this.previousBounds) {
                this.characterWindow.setBounds(this.previousBounds, true);
                this.previousBounds = null; // Reset
            }

            this.characterWindow.setAlwaysOnTop(true, 'floating'); // Reset priority
            this.sendToCharacter('system:resume');
        }
    }

    /**
     * Restore character window visibility and always-on-top state
     */
    _restoreCharacterWindow() {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            // Force show the window
            this.characterWindow.show();
            this.isCharacterVisible = true;

            // Re-apply always on top (Windows sometimes loses this)
            this.characterWindow.setAlwaysOnTop(true, 'floating', 1);

            // Bring to front
            this.characterWindow.moveTop();

            console.log('[MultiWindowManager] Character window restored');

            // Notify renderer to refresh
            this.sendToCharacter('system:resume');
        }
    }

    /**
     * Cleanup all windows and tray
     */
    destroy() {
        if (this.characterWindow && !this.characterWindow.isDestroyed()) {
            this.characterWindow.destroy();
        }
        if (this.chatWindow && !this.chatWindow.isDestroyed()) {
            this.chatWindow.destroy();
        }
        if (this.tray) {
            this.tray.destroy();
        }
    }
}

export default MultiWindowManager;
