/**
 * SettingsUI.js
 * Renderer process settings UI integration
 */

import { SettingsPanel } from '../components/SettingsPanel.js';

export class SettingsUI {
    constructor() {
        this.settingsPanel = null;
        this.isVisible = false;
        this.container = null;
        
        console.log('[SettingsUI] ✓ Settings UI initialized');
    }
    
    /**
     * Initialize settings UI
     */
    async initialize() {
        try {
            await this.createSettingsContainer();
            await this.setupSettingsPanel();
            this.setupEventListeners();
            console.log('[SettingsUI] ✓ Settings UI ready');
        } catch (error) {
            console.error('[SettingsUI] Failed to initialize:', error);
            throw error;
        }
    }
    
    /**
     * Create settings container
     */
    async createSettingsContainer() {
        this.container = document.createElement('div');
        this.container.id = 'settings-container';
        this.container.style.display = 'none';
        
        // Add settings styles
        await this.loadSettingsStyles();
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Load settings styles
     */
    async loadSettingsStyles() {
        try {
            const response = await fetch('./src/styles/settings.css');
            const styles = await response.text();
            
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        } catch (error) {
            console.error('[SettingsUI] Failed to load settings styles:', error);
        }
    }
    
    /**
     * Setup settings panel
     */
    async setupSettingsPanel() {
        // Get settings manager from main process
        const settingsSchema = await window.electronAPI.invoke('settings:getSchema');
        
        this.settingsPanel = new SettingsPanel(null, this.container);
        
        // Override settings manager methods to use IPC
        this.settingsPanel.settingsManager = {
            get: (category, key, defaultValue) => window.electronAPI.invoke('settings:get', category, key, defaultValue),
            getCategory: (category) => window.electronAPI.invoke('settings:getCategory', category),
            set: (category, key, value) => window.electronAPI.invoke('settings:set', category, key, value),
            setCategory: (category, settings) => window.electronAPI.invoke('settings:setCategory', category, settings),
            getSettingsSchema: () => settingsSchema,
            getAllSettings: () => window.electronAPI.invoke('settings:getAll'),
            exportSettings: () => window.electronAPI.invoke('settings:export'),
            importSettings: (data) => window.electronAPI.invoke('settings:import', data),
            reset: (category, key) => window.electronAPI.invoke('settings:reset', category, key),
            resetCategory: (category) => window.electronAPI.invoke('settings:resetCategory', category),
            resetAll: () => window.electronAPI.invoke('settings:resetAll'),
            searchSettings: (query) => window.electronAPI.invoke('settings:search', query),
            getSettingsSummary: () => window.electronAPI.invoke('settings:getSummary'),
            categories: {
                general: { name: 'General', description: 'Basic application settings', icon: '⚙️', order: 1 },
                voice: { name: 'Voice & Audio', description: 'Voice synthesis and recognition settings', icon: '🎤', order: 2 },
                personality: { name: 'Personality & Behavior', description: 'AI personality and interaction settings', icon: '🧠', order: 3 },
                humor: { name: 'Humor & Entertainment', description: 'Humor style and entertainment preferences', icon: '😄', order: 4 },
                assistant: { name: 'Helpful Assistant', description: 'Assistant behavior and helpfulness settings', icon: '🤖', order: 5 },
                smartHome: { name: 'Smart Home', description: 'Smart home device and automation settings', icon: '🏠', order: 6 },
                translation: { name: 'Translation', description: 'Language and translation preferences', icon: '🌍', order: 7 },
                security: { name: 'Security & Privacy', description: 'Security, authentication, and privacy settings', icon: '🔒', order: 8 },
                collaboration: { name: 'Collaboration', description: 'Screen sharing and collaboration settings', icon: '🤝', order: 9 },
                gestures: { name: 'Gesture Recognition', description: 'Camera and gesture recognition settings', icon: '👋', order: 10 },
                performance: { name: 'Performance', description: 'Performance optimization and resource settings', icon: '⚡', order: 11 },
                advanced: { name: 'Advanced', description: 'Advanced configuration and developer settings', icon: '🔧', order: 12 }
            }
        };
        
        await this.settingsPanel.initialize();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for setting changes from main process
        window.electronAPI.on('setting-changed', (event, data) => {
            this.handleSettingChange(data);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case ',':
                        e.preventDefault();
                        this.toggle();
                        break;
                    case 's':
                        if (this.isVisible) {
                            e.preventDefault();
                            this.saveSettings();
                        }
                        break;
                }
            }
            
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    /**
     * Handle setting change from main process
     */
    handleSettingChange(data) {
        console.log('[SettingsUI] Setting changed:', data);
        
        // Update UI if needed
        if (this.isVisible && this.settingsPanel) {
            const field = this.container.querySelector(`[data-category="${data.category}"][data-key="${data.key}"]`);
            if (field) {
                // Update field value
                if (field.type === 'checkbox') {
                    field.checked = data.newValue;
                } else {
                    field.value = data.newValue;
                }
            }
        }
    }
    
    /**
     * Show settings panel
     */
    async show() {
        if (!this.settingsPanel) {
            await this.setupSettingsPanel();
        }
        
        this.isVisible = true;
        this.container.style.display = 'block';
        
        // Load current settings
        await this.settingsPanel.loadCurrentSettings();
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        console.log('[SettingsUI] Settings panel shown');
    }
    
    /**
     * Hide settings panel
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        
        // Restore body scrolling
        document.body.style.overflow = '';
        
        console.log('[SettingsUI] Settings panel hidden');
    }
    
    /**
     * Toggle settings panel
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Save settings
     */
    async saveSettings() {
        if (this.settingsPanel) {
            await this.settingsPanel.saveSettings();
        }
    }
    
    /**
     * Create settings button for UI
     */
    createSettingsButton() {
        const button = document.createElement('button');
        button.id = 'settings-button';
        button.className = 'settings-btn';
        button.innerHTML = '⚙️';
        button.title = 'Settings (Ctrl+,)';
        
        button.addEventListener('click', () => {
            this.toggle();
        });
        
        return button;
    }
    
    /**
     * Add settings button to existing UI
     */
    addSettingsButton(container) {
        const button = this.createSettingsButton();
        container.appendChild(button);
    }
    
    /**
     * Get current settings value
     */
    async getSetting(category, key) {
        return await window.electronAPI.invoke('settings:get', category, key);
    }
    
    /**
     * Set setting value
     */
    async setSetting(category, key, value) {
        return await window.electronAPI.invoke('settings:set', category, key, value);
    }
    
    /**
     * Get all settings
     */
    async getAllSettings() {
        return await window.electronAPI.invoke('settings:getAll');
    }
    
    /**
     * Export settings
     */
    async exportSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.exportSettings();
        }
    }
    
    /**
     * Import settings
     */
    async importSettings() {
        if (this.settingsPanel) {
            this.settingsPanel.importSettings();
        }
    }
    
    /**
     * Reset settings
     */
    async resetSettings(category = null, key = null) {
        if (category && key) {
            await window.electronAPI.invoke('settings:reset', category, key);
        } else if (category) {
            await window.electronAPI.invoke('settings:resetCategory', category);
        } else {
            await window.electronAPI.invoke('settings:resetAll');
        }
        
        // Reload settings if panel is visible
        if (this.isVisible && this.settingsPanel) {
            await this.settingsPanel.loadCurrentSettings();
        }
    }
}

// Global settings UI instance
let settingsUI = null;

/**
 * Initialize settings UI
 */
export async function initializeSettingsUI() {
    if (!settingsUI) {
        settingsUI = new SettingsUI();
        await settingsUI.initialize();
    }
    return settingsUI;
}

/**
 * Get settings UI instance
 */
export function getSettingsUI() {
    return settingsUI;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettingsUI);
} else {
    initializeSettingsUI();
}

// Make settingsUI globally available for array field handlers
window.settingsUI = null;

export default SettingsUI;
