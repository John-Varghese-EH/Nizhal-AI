/**
 * ThemeService.js
 *
 * Manages application themes and accent palettes, dynamically applying configurations to
 * browser CSS properties while ensuring absolute compatibility with headless/SSR contexts.
 */

export class ThemeService {
    constructor() {
        this.currentTheme = 'dark';
        this.accentColor = 'cyan';
        this.isInitialized = false;

        this.status = 'uninitialized';
        this.health = {
            status: 'uninitialized',
            lastError: null
        };
    }

    /**
     * Initializes theme configurations from stored properties.
     */
    async init() {
        if (this.isInitialized) return { success: true };

        this.status = 'initializing';
        this.health.status = 'initializing';

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.currentTheme = stored.theme || 'dark';
                this.accentColor = stored.accent || 'cyan';
            }
            this._applyTheme();

            this.isInitialized = true;
            this.status = 'ready';
            this.health.status = 'ready';
            this.health.lastError = null;

            console.log('[ThemeService] Theme initialized:', this.currentTheme, this.accentColor);
            return { success: true };
        } catch (error) {
            this.status = 'failed';
            this.health.status = 'failed';
            this.health.lastError = error.message;
            console.error('[ThemeService] Theme initialization failure:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Compatibility bridge for legacy callers.
     */
    async initialize() {
        return this.init();
    }

    getThemes() {
        return [
            {
                id: 'dark',
                name: 'Dark',
                icon: '🌙',
                colors: {
                    bg: '#0f0f0f',
                    surface: '#1a1a1a',
                    text: '#ffffff',
                    textSecondary: 'rgba(255,255,255,0.6)'
                }
            },
            {
                id: 'midnight',
                name: 'Midnight',
                icon: '🌌',
                colors: {
                    bg: '#0a0a1a',
                    surface: '#141428',
                    text: '#e0e0ff',
                    textSecondary: 'rgba(224,224,255,0.6)'
                }
            },
            {
                id: 'amoled',
                name: 'AMOLED',
                icon: '⬛',
                colors: {
                    bg: '#000000',
                    surface: '#0a0a0a',
                    text: '#ffffff',
                    textSecondary: 'rgba(255,255,255,0.5)'
                }
            },
            {
                id: 'nord',
                name: 'Nord',
                icon: '❄️',
                colors: {
                    bg: '#2e3440',
                    surface: '#3b4252',
                    text: '#eceff4',
                    textSecondary: 'rgba(236,239,244,0.6)'
                }
            },
            {
                id: 'sunset',
                name: 'Sunset',
                icon: '🌅',
                colors: {
                    bg: '#1a0a1a',
                    surface: '#2d142d',
                    text: '#ffd0d0',
                    textSecondary: 'rgba(255,208,208,0.6)'
                }
            }
        ];
    }

    getAccentColors() {
        return [
            { id: 'cyan', name: 'Cyan', color: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
            { id: 'purple', name: 'Purple', color: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
            { id: 'pink', name: 'Pink', color: '#ec4899', glow: 'rgba(236,72,153,0.3)' },
            { id: 'green', name: 'Green', color: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
            { id: 'orange', name: 'Orange', color: '#f97316', glow: 'rgba(249,115,22,0.3)' },
            { id: 'blue', name: 'Blue', color: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
            { id: 'red', name: 'Red', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
            { id: 'yellow', name: 'Yellow', color: '#eab308', glow: 'rgba(234,179,8,0.3)' }
        ];
    }

    async setTheme(themeId) {
        const theme = this.getThemes().find(t => t.id === themeId);
        if (theme) {
            this.currentTheme = themeId;
            this._applyTheme();
            await this._saveToStorage();
        }
    }

    async setAccentColor(colorId) {
        const color = this.getAccentColors().find(c => c.id === colorId);
        if (color) {
            this.accentColor = colorId;
            this._applyTheme();
            await this._saveToStorage();
        }
    }

    getCurrentTheme() {
        return this.getThemes().find(t => t.id === this.currentTheme);
    }

    getCurrentAccent() {
        return this.getAccentColors().find(c => c.id === this.accentColor);
    }

    /**
     * Applies theme variables to the document documentElement, checking bounds carefully.
     */
    _applyTheme() {
        if (typeof document === 'undefined') return;

        const theme = this.getCurrentTheme();
        const accent = this.getCurrentAccent();

        if (!theme || !accent) return;

        const root = document.documentElement;
        if (!root) return;

        root.style.setProperty('--theme-bg', theme.colors.bg);
        root.style.setProperty('--theme-surface', theme.colors.surface);
        root.style.setProperty('--theme-text', theme.colors.text);
        root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
        root.style.setProperty('--accent-color', accent.color);
        root.style.setProperty('--accent-glow', accent.glow);
    }

    getThemeClass() {
        return `theme-${this.currentTheme} accent-${this.accentColor}`;
    }

    async _loadFromStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                return prefs?.theme || {};
            }
            return {};
        } catch (e) {
            return {};
        }
    }

    async _saveToStorage() {
        try {
            if (typeof window !== 'undefined' && window.nizhal?.memory) {
                const prefs = await window.nizhal.memory.getUserPreferences();
                await window.nizhal.memory.setUserPreferences({
                    ...prefs,
                    theme: {
                        theme: this.currentTheme,
                        accent: this.accentColor
                    }
                });
            }
        } catch (error) {
            console.error('[ThemeService] Failed to save theme variables:', error);
        }
    }

    /**
     * Resets service parameters to default dark configurations.
     */
    async reset() {
        this.currentTheme = 'dark';
        this.accentColor = 'cyan';
        this._applyTheme();
        await this._saveToStorage();
        return { success: true };
    }

    /**
     * Returns a snapshot of the current configuration.
     */
    getState() {
        return {
            initialized: this.isInitialized,
            status: this.status,
            theme: this.currentTheme,
            accent: this.accentColor,
            health: { ...this.health }
        };
    }
}

export const themeService = new ThemeService();
export default themeService;
