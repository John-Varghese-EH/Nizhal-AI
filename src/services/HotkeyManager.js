import { globalShortcut } from 'electron';
// Note: In renderer, we might need IPC to register global shortcuts or use 'mousetrap'/'react-hotkeys-hook' for local.
// Since requirement says "Global Shortcuts", these usually need Main process registration or heavy IPC.
// We'll write a Service that communicates with Main via IPC to toggle these.

/**
 * HotkeyManager - Handles User Productivity Shortcuts
 * 
 * Shortcuts:
 * - Ctrl+Shift+Z: Zen Mode (Toggle minimal UI)
 * - Ctrl+Shift+T: Time Report (Voice announcement)
 * - Ctrl+Shift+H: Health Check (Posture reminder)
 */
class HotkeyManager {
    constructor() {
        this.zenMode = false;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;

        // Listen for shortcuts triggered from Main Process
        // (Assuming Main process registers globalShortcut and sends event)
        window.nizhal?.on?.('hotkey:zen', () => this.toggleZenMode());
        window.nizhal?.on?.('hotkey:time', () => this.announceTime());
        window.nizhal?.on?.('hotkey:health', () => this.checkHealth());

        console.log('[HotkeyManager] Initialized. Waiting for main process triggers.');
        this.initialized = true;
    }

    toggleZenMode() {
        this.zenMode = !this.zenMode;
        console.log(`[HotkeyManager] Zen Mode: ${this.zenMode}`);

        // 1. Play sound
        this._playSound(this.zenMode ? 'zen_enter' : 'zen_exit');

        // 2. Notify User via Avatar
        if (this.zenMode) {
            window.nizhal?.invoke?.('avatar:speak', "Entering Zen Mode. Focusing...");
            // Hide distractions (implementation depends on UI architecture)
            // e.g. set opacity of non-essential windows to 0
        } else {
            window.nizhal?.invoke?.('avatar:speak', "Welcome back!");
        }
    }

    announceTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        window.nizhal?.invoke?.('avatar:speak', `It is currently ${timeString}. You are doing great.`);
    }

    checkHealth() {
        const msgs = [
            "Posture check! Sit up straight, king.",
            "Have you drank water recently? 💧",
            "Take a deep breath. In... and out.",
            "Stretch those shoulders!"
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        window.nizhal?.invoke?.('avatar:speak', msg);
    }

    _playSound(type) {
        // Placeholder for sound FX
        // const audio = new Audio(`/assets/sounds/${type}.mp3`);
        // audio.play().catch(e => console.error(e));
    }
}

export const hotkeyManager = new HotkeyManager();
