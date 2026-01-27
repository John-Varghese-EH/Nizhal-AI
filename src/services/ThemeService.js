/**
 * ThemeService - Application theming
 * 
 * Manages app themes with color schemes and presets.
 */

class ThemeService {
    constructor() {
        this.currentTheme = 'dark';
        this.accentColor = 'cyan';
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const stored = await this._loadFromStorage();
            if (stored) {
                this.currentTheme = stored.theme || 'dark';
                this.accentColor = stored.accent || 'cyan';
            }
            this._applyTheme();
            this.initialized = true;
            console.log('[Theme] Initialized:', this.currentTheme, this.accentColor);
        } catch (error) {
            console.error('[Theme] Init error:', error);
        }
    }

    /**
     * Get available themes
     */
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

    /**
     * Get accent colors
     */
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

    /**
     * Set theme
     */
    async setTheme(themeId) {
        const theme = this.getThemes().find(t => t.id === themeId);
        if (theme) {
            this.currentTheme = themeId;
            this._applyTheme();
            await this._saveToStorage();
        }
    }

    /**
     * Set accent color
     */
    async setAccentColor(colorId) {
        const color = this.getAccentColors().find(c => c.id === colorId);
        if (color) {
            this.accentColor = colorId;
            this._applyTheme();
            await this._saveToStorage();
        }
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.getThemes().find(t => t.id === this.currentTheme);
    }

    /**
     * Get current accent
     */
    getCurrentAccent() {
        return this.getAccentColors().find(c => c.id === this.accentColor);
    }

    /**
     * Apply theme to document
     */
    _applyTheme() {
        const theme = this.getCurrentTheme();
        const accent = this.getCurrentAccent();

        if (!theme || !accent) return;

        const root = document.documentElement;

        // Set CSS variables
        root.style.setProperty('--theme-bg', theme.colors.bg);
        root.style.setProperty('--theme-surface', theme.colors.surface);
        root.style.setProperty('--theme-text', theme.colors.text);
        root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
        root.style.setProperty('--accent-color', accent.color);
        root.style.setProperty('--accent-glow', accent.glow);
    }

    /**
     * Get CSS class for theme
     */
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
        } catch {
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
            console.error('[Theme] Save error:', error);
        }
    }
}

export const themeService = new ThemeService();
export default ThemeService;
