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
     */
    async createCharacterWindow(preloadPath) {
        this.characterWindow = new BrowserWindow({
            width: 400,   // Larger to fit VRM models
            height: 600,  // Taller for full character display with legs
            x: screen.getPrimaryDisplay().workArea.width - 420,
            y: screen.getPrimaryDisplay().workArea.height - 620,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: true,
            hasShadow: false,
            focusable: true,
            backgroundColor: '#00000000',
            webPreferences: {
                preload: preloadPath,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            }
        });

        // Character window specific settings
        this.characterWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

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

        // Enable dragging
        this.characterWindow.webContents.on('did-finish-load', () => {
            this.characterWindow.webContents.send('window:ready', 'character');
        });

        return this.characterWindow;
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
            }
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
     * Snap character to corner
     */
    snapCharacterToCorner(corner) {
        if (!this.characterWindow || this.characterWindow.isDestroyed()) return;

        const display = screen.getPrimaryDisplay();
        const { width, height } = display.workArea;
        const winBounds = this.characterWindow.getBounds();
        const padding = 20;

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
                y = height - winBounds.height - padding;
                break;
            case 'bottom-right':
                x = width - winBounds.width - padding;
                y = height - winBounds.height - padding;
                break;
        }

        this.characterWindow.setPosition(Math.round(x), Math.round(y));
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
     * Start system idle detection
     */
    startIdleDetection() {
        IdleDetection.start({
            onIdle: () => {
                console.log('System Idle - Sleeping...');
                this.sendToCharacter('system:idle');
            },
            onActive: () => {
                console.log('System Active - Waking up...');
                this.sendToCharacter('system:resume');
            }
        });
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
