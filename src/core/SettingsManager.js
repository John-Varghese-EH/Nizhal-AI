/**
 * SettingsManager.js
 * Centralized settings management system for all Nizhal AI features
 */

export class SettingsManager {
    constructor(dataPath) {
        this.dataPath = dataPath;
        this.settingsFile = `${dataPath}/settings.json`;
        this.defaultsFile = `${dataPath}/default_settings.json`;
        
        // Settings categories
        this.categories = {
            general: {
                name: 'General',
                description: 'Basic application settings',
                icon: '⚙️',
                order: 1
            },
            voice: {
                name: 'Voice & Audio',
                description: 'Voice synthesis and recognition settings',
                icon: '🎤',
                order: 2
            },
            personality: {
                name: 'Personality & Behavior',
                description: 'AI personality and interaction settings',
                icon: '🧠',
                order: 3
            },
            humor: {
                name: 'Humor & Entertainment',
                description: 'Humor style and entertainment preferences',
                icon: '😄',
                order: 4
            },
            assistant: {
                name: 'Helpful Assistant',
                description: 'Assistant behavior and helpfulness settings',
                icon: '🤖',
                order: 5
            },
            smartHome: {
                name: 'Smart Home',
                description: 'Smart home device and automation settings',
                icon: '🏠',
                order: 6
            },
            translation: {
                name: 'Translation',
                description: 'Language and translation preferences',
                icon: '🌍',
                order: 7
            },
            security: {
                name: 'Security & Privacy',
                description: 'Security, authentication, and privacy settings',
                icon: '🔒',
                order: 8
            },
            collaboration: {
                name: 'Collaboration',
                description: 'Screen sharing and collaboration settings',
                icon: '🤝',
                order: 9
            },
            gestures: {
                name: 'Gesture Recognition',
                description: 'Camera and gesture recognition settings',
                icon: '👋',
                order: 10
            },
            performance: {
                name: 'Performance',
                description: 'Performance optimization and resource settings',
                icon: '⚡',
                order: 11
            },
            advanced: {
                name: 'Advanced',
                description: 'Advanced configuration and developer settings',
                icon: '🔧',
                order: 12
            }
        };
        
        // Default settings
        this.defaultSettings = {
            general: {
                theme: 'auto', // 'light', 'dark', 'auto'
                language: 'en',
                autoStart: false,
                startMinimized: false,
                notifications: true,
                soundEffects: true,
                autoSave: true,
                dataRetention: 30, // days
                checkUpdates: true,
                analytics: false,
                debugMode: false
            },
            voice: {
                enabled: true,
                provider: 'web_speech', // 'web_speech', 'elevenlabs', 'edge_tts'
                voice: 'default',
                speed: 1.0,
                pitch: 1.0,
                volume: 1.0,
                autoPlay: true,
                emotionDetection: true,
                voiceCloning: false,
                voiceProfiles: [],
                inputDevice: 'default',
                outputDevice: 'default',
                noiseSuppression: true,
                echoCancellation: true
            },
            personality: {
                currentPersona: 'gf',
                moodAdaptation: true,
                emotionalIntelligence: true,
                memoryRetention: true,
                learningEnabled: true,
                traits: {
                    openness: 0.5,
                    conscientiousness: 0.5,
                    extraversion: 0.5,
                    agreeableness: 0.5,
                    neuroticism: 0.3
                },
                behaviorPatterns: {
                    greetingStyle: 'friendly',
                    responseLength: 'medium',
                    formalityLevel: 'casual',
                    empathyLevel: 'high'
                }
            },
            humor: {
                enabled: true,
                style: 'witty', // 'witty', 'sarcastic', 'self_deprecating', 'playful', 'dad_jokes', 'observational', 'dark'
                intensity: 0.6, // 0.0 - 1.0
                frequency: 'moderate', // 'rare', 'occasional', 'moderate', 'frequent'
                contextAware: true,
                safetyLevel: 'high', // 'low', 'medium', 'high'
                avoidSensitiveTopics: true,
                customJokes: [],
                blockedTopics: []
            },
            assistant: {
                enabled: true,
                proactiveLevel: 'moderate', // 'minimal', 'moderate', 'active'
                assistanceStyle: 'collaborative', // 'directive', 'collaborative', 'supportive'
                detailLevel: 'balanced', // 'concise', 'balanced', 'detailed'
                learningPace: 'steady', // 'quick', 'steady', 'thorough'
                contextMemory: true,
                personalizedResponses: true,
                suggestionsEnabled: true,
                followUpQuestions: true,
                expertiseAreas: ['general'],
                skillLevel: 'intermediate' // 'beginner', 'intermediate', 'advanced'
            },
            smartHome: {
                enabled: false,
                autoDiscovery: true,
                energyMonitoring: true,
                encryptionEnabled: true,
                providers: {
                    hue: { enabled: false, bridgeIp: '', username: '' },
                    google_home: { enabled: false, apiKey: '' },
                    alexa: { enabled: false, clientId: '', clientSecret: '' },
                    home_assistant: { enabled: false, url: '', token: '' },
                    mqtt: { enabled: false, broker: '', port: 1883, username: '', password: '' }
                },
                scenes: [],
                automationRules: [],
                notifications: true,
                logLevel: 'info'
            },
            translation: {
                enabled: true,
                sourceLanguage: 'auto',
                targetLanguage: 'en',
                provider: 'google', // 'google', 'libretranslate', 'mymemory', 'local'
                autoDetect: true,
                realTime: false,
                cacheTranslations: true,
                apiKey: '',
                customProviders: [],
                preferredLanguages: ['en', 'es', 'fr', 'de'],
                qualityThreshold: 0.7
            },
            security: {
                level: 'standard', // 'basic', 'standard', 'high', 'maximum'
                authentication: {
                    method: 'password', // 'password', 'biometric', 'token', 'multi_factor'
                    passwordPolicy: {
                        minLength: 8,
                        requireUppercase: true,
                        requireLowercase: true,
                        requireNumbers: true,
                        requireSpecialChars: true,
                        maxAge: 90
                    },
                    sessionTimeout: 3600000, // 1 hour
                    maxSessions: 3
                },
                encryption: {
                    enabled: true,
                    algorithm: 'AES-256-GCM',
                    keyDerivation: 'PBKDF2',
                    iterations: 100000
                },
                privacy: {
                    anonymizeData: true,
                    dataMinimization: true,
                    consentRequired: true,
                    auditLogging: true,
                    dataRetention: 30
                },
                rateLimiting: {
                    enabled: true,
                    windowMs: 900000, // 15 minutes
                    maxAttempts: 20
                },
                notifications: {
                    securityAlerts: true,
                    loginAttempts: true,
                    failedLogins: true,
                    systemChanges: true
                }
            },
            collaboration: {
                enabled: false,
                screenSharing: {
                    enabled: true,
                    quality: 'high', // 'low', 'medium', 'high', 'ultra'
                    frameRate: 30,
                    audioEnabled: true,
                    remoteControl: false
                },
                whiteboard: {
                    enabled: true,
                    autoSave: true,
                    maxParticipants: 10
                },
                voiceChat: {
                    enabled: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                fileSharing: {
                    enabled: true,
                    maxFileSize: 100, // MB
                    allowedTypes: ['image', 'document', 'video']
                },
                privacy: {
                    requireInvitation: true,
                    endToEndEncryption: true,
                    recordingConsent: true
                }
            },
            gestures: {
                enabled: false,
                camera: {
                    device: 'default',
                    resolution: '640x480',
                    frameRate: 30,
                    mirror: true
                },
                detection: {
                    hands: true,
                    body: true,
                    face: true,
                    confidence: 0.7,
                    smoothing: true
                },
                gestures: {
                    wave: { enabled: true, action: 'greeting' },
                    thumbsUp: { enabled: true, action: 'approval' },
                    peace: { enabled: true, action: 'friendly' },
                    point: { enabled: true, action: 'attention' },
                    grab: { enabled: true, action: 'interaction' }
                },
                privacy: {
                    storeRecordings: false,
                    processingLocation: 'local', // 'local', 'cloud'
                    anonymizeData: true
                },
                performance: {
                    gpuAcceleration: true,
                    lowPowerMode: false,
                    backgroundProcessing: true
                }
            },
            performance: {
                mode: 'auto', // 'auto', 'high_performance', 'balanced', 'power_saver'
                lowEndMode: false,
                resourceLimits: {
                    maxMemory: 2048, // MB
                    maxCpu: 80, // percentage
                    maxGpu: 70 // percentage
                },
                optimizations: {
                    frameSkipping: true,
                    adaptiveQuality: true,
                    backgroundThrottling: true,
                    garbageCollection: true
                },
                monitoring: {
                    enabled: true,
                    alertThreshold: 90, // percentage
                    loggingLevel: 'info'
                }
            },
            advanced: {
                developerMode: false,
                debugMode: false,
                experimentalFeatures: false,
                apiAccess: false,
                customScripts: false,
                systemIntegration: {
                    shellAccess: false,
                    fileSystemAccess: false,
                    networkAccess: false
                },
                logging: {
                    level: 'info', // 'error', 'warn', 'info', 'debug'
                    maxFileSize: 10, // MB
                    maxFiles: 5,
                    structuredLogging: true
                },
                backup: {
                    autoBackup: true,
                    backupInterval: 24, // hours
                    backupLocation: 'default',
                    encryption: true
                }
            }
        };
        
        // Current settings
        this.settings = {};
        this.listeners = new Map();
        this.validators = new Map();
        
        console.log('[SettingsManager] ✓ Settings manager initialized');
    }
    
    /**
     * Initialize settings manager
     */
    async initialize() {
        try {
            await this.loadSettings();
            this.setupValidators();
            this.setupMigration();
            console.log('[SettingsManager] ✓ Settings initialized');
        } catch (error) {
            console.error('[SettingsManager] Failed to initialize:', error);
            throw error;
        }
    }
    
    /**
     * Load settings from file
     */
    async loadSettings() {
        try {
            const fs = await import('fs/promises');
            
            // Ensure data directory exists
            try {
                await fs.mkdir(this.dataPath, { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
            
            // Try to load existing settings
            try {
                const data = await fs.readFile(this.settingsFile, 'utf-8');
                const loadedSettings = JSON.parse(data);
                
                // Merge with defaults to handle new settings
                this.settings = this.mergeWithDefaults(loadedSettings, this.defaultSettings);
                
                console.log('[SettingsManager] ✓ Settings loaded from file');
            } catch (error) {
                // File doesn't exist or is invalid, use defaults
                this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
                console.log('[SettingsManager] ✓ Using default settings');
            }
            
            // Save defaults for reference
            await this.saveDefaultSettings();
        } catch (error) {
            console.error('[SettingsManager] Failed to load settings:', error);
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        }
    }
    
    /**
     * Save settings to file
     */
    async saveSettings() {
        try {
            const fs = await import('fs/promises');
            const data = JSON.stringify(this.settings, null, 2);
            await fs.writeFile(this.settingsFile, data);
            console.log('[SettingsManager] ✓ Settings saved');
        } catch (error) {
            console.error('[SettingsManager] Failed to save settings:', error);
            throw error;
        }
    }
    
    /**
     * Save default settings for reference
     */
    async saveDefaultSettings() {
        try {
            const fs = await import('fs/promises');
            const data = JSON.stringify(this.defaultSettings, null, 2);
            await fs.writeFile(this.defaultsFile, data);
        } catch (error) {
            console.error('[SettingsManager] Failed to save default settings:', error);
        }
    }
    
    /**
     * Merge loaded settings with defaults
     */
    mergeWithDefaults(loaded, defaults) {
        const merged = JSON.parse(JSON.stringify(defaults));
        
        function merge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source.hasOwnProperty(key) ? source[key] : target[key];
                }
            }
        }
        
        merge(merged, loaded);
        return merged;
    }
    
    /**
     * Get setting value
     */
    get(category, key, defaultValue = undefined) {
        try {
            const keys = key.split('.');
            let value = this.settings[category];
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return defaultValue;
                }
            }
            
            return value;
        } catch (error) {
            console.error(`[SettingsManager] Failed to get setting ${category}.${key}:`, error);
            return defaultValue;
        }
    }
    
    /**
     * Set setting value
     */
    async set(category, key, value) {
        try {
            // Validate setting
            const validationKey = `${category}.${key}`;
            if (this.validators.has(validationKey)) {
                const validator = this.validators.get(validationKey);
                if (!validator(value)) {
                    throw new Error(`Invalid value for ${validationKey}: ${value}`);
                }
            }
            
            // Get old value for comparison
            const oldValue = this.get(category, key);
            
            // Set new value
            const keys = key.split('.');
            let target = this.settings[category];
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!target[keys[i]]) {
                    target[keys[i]] = {};
                }
                target = target[keys[i]];
            }
            
            target[keys[keys.length - 1]] = value;
            
            // Save to file
            await this.saveSettings();
            
            // Notify listeners
            this.notifyListeners(category, key, value, oldValue);
            
            console.log(`[SettingsManager] ✓ Set ${category}.${key} = ${value}`);
        } catch (error) {
            console.error(`[SettingsManager] Failed to set setting ${category}.${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Get entire category settings
     */
    getCategory(category) {
        return this.settings[category] || {};
    }
    
    /**
     * Set entire category settings
     */
    async setCategory(category, settings) {
        try {
            // Validate all settings
            for (const [key, value] of Object.entries(settings)) {
                const validationKey = `${category}.${key}`;
                if (this.validators.has(validationKey)) {
                    const validator = this.validators.get(validationKey);
                    if (!validator(value)) {
                        throw new Error(`Invalid value for ${validationKey}: ${value}`);
                    }
                }
            }
            
            const oldSettings = this.settings[category];
            this.settings[category] = { ...this.settings[category], ...settings };
            
            await this.saveSettings();
            
            // Notify listeners for each changed setting
            for (const [key, value] of Object.entries(settings)) {
                if (oldSettings[key] !== value) {
                    this.notifyListeners(category, key, value, oldSettings[key]);
                }
            }
            
            console.log(`[SettingsManager] ✓ Updated category ${category}`);
        } catch (error) {
            console.error(`[SettingsManager] Failed to set category ${category}:`, error);
            throw error;
        }
    }
    
    /**
     * Reset setting to default
     */
    async reset(category, key) {
        const defaultValue = this.getDefault(category, key);
        await this.set(category, key, defaultValue);
    }
    
    /**
     * Reset entire category to defaults
     */
    async resetCategory(category) {
        const defaultCategory = this.defaultSettings[category];
        await this.setCategory(category, defaultCategory);
    }
    
    /**
     * Reset all settings to defaults
     */
    async resetAll() {
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        await this.saveSettings();
        
        // Notify all listeners
        for (const [category, settings] of Object.entries(this.settings)) {
            for (const [key, value] of Object.entries(settings)) {
                this.notifyListeners(category, key, value, undefined);
            }
        }
        
        console.log('[SettingsManager] ✓ All settings reset to defaults');
    }
    
    /**
     * Get default value
     */
    getDefault(category, key) {
        const keys = key.split('.');
        let value = this.defaultSettings[category];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Add setting change listener
     */
    addListener(category, key, callback) {
        const listenerKey = `${category}.${key}`;
        if (!this.listeners.has(listenerKey)) {
            this.listeners.set(listenerKey, []);
        }
        this.listeners.get(listenerKey).push(callback);
    }
    
    /**
     * Remove setting change listener
     */
    removeListener(category, key, callback) {
        const listenerKey = `${category}.${key}`;
        const listeners = this.listeners.get(listenerKey);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Notify listeners of setting change
     */
    notifyListeners(category, key, newValue, oldValue) {
        const listenerKey = `${category}.${key}`;
        const listeners = this.listeners.get(listenerKey);
        
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(newValue, oldValue, category, key);
                } catch (error) {
                    console.error(`[SettingsManager] Listener error for ${listenerKey}:`, error);
                }
            });
        }
    }
    
    /**
     * Setup validators for settings
     */
    setupValidators() {
        // General validators
        this.addValidator('general.theme', (value) => ['light', 'dark', 'auto'].includes(value));
        this.addValidator('general.language', (value) => typeof value === 'string' && value.length === 2);
        this.addValidator('general.dataRetention', (value) => Number.isInteger(value) && value >= 1 && value <= 365);
        
        // Voice validators
        this.addValidator('voice.speed', (value) => Number(value) >= 0.5 && Number(value) <= 2.0);
        this.addValidator('voice.pitch', (value) => Number(value) >= 0.5 && Number(value) <= 2.0);
        this.addValidator('voice.volume', (value) => Number(value) >= 0 && Number(value) <= 1.0);
        
        // Humor validators
        this.addValidator('humor.style', (value) => [
            'witty', 'sarcastic', 'self_deprecating', 'playful', 'dad_jokes', 'observational', 'dark'
        ].includes(value));
        this.addValidator('humor.intensity', (value) => Number(value) >= 0 && Number(value) <= 1.0);
        this.addValidator('humor.frequency', (value) => ['rare', 'occasional', 'moderate', 'frequent'].includes(value));
        
        // Security validators
        this.addValidator('security.level', (value) => ['basic', 'standard', 'high', 'maximum'].includes(value));
        this.addValidator('security.authentication.sessionTimeout', (value) => Number(value) >= 300000 && Number(value) <= 86400000);
        
        // Performance validators
        this.addValidator('performance.mode', (value) => ['auto', 'high_performance', 'balanced', 'power_saver'].includes(value));
        this.addValidator('performance.resourceLimits.maxMemory', (value) => Number(value) >= 512 && Number(value) <= 8192);
    }
    
    /**
     * Add validator for a setting
     */
    addValidator(key, validator) {
        this.validators.set(key, validator);
    }
    
    /**
     * Setup migration for settings
     */
    setupMigration() {
        // Migration logic for different versions
        this.migrations = [
            {
                version: '1.0.0',
                migrate: (settings) => {
                    // Add new settings for v1.0.0
                    if (!settings.humor) {
                        settings.humor = this.defaultSettings.humor;
                    }
                    return settings;
                }
            }
        ];
    }
    
    /**
     * Export settings to JSON
     */
    exportSettings() {
        return {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            settings: this.settings
        };
    }
    
    /**
     * Import settings from JSON
     */
    async importSettings(importedData) {
        try {
            if (!importedData.settings) {
                throw new Error('Invalid settings file format');
            }
            
            // Validate and merge imported settings
            const validatedSettings = this.mergeWithDefaults(importedData.settings, this.defaultSettings);
            
            // Apply imported settings
            this.settings = validatedSettings;
            await this.saveSettings();
            
            // Notify all listeners
            for (const [category, settings] of Object.entries(this.settings)) {
                for (const [key, value] of Object.entries(settings)) {
                    this.notifyListeners(category, key, value, undefined);
                }
            }
            
            console.log('[SettingsManager] ✓ Settings imported successfully');
        } catch (error) {
            console.error('[SettingsManager] Failed to import settings:', error);
            throw error;
        }
    }
    
    /**
     * Get all settings as flat object
     */
    getAllSettings() {
        const flat = {};
        
        function flatten(obj, prefix = '') {
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    flatten(value, fullKey);
                } else {
                    flat[fullKey] = value;
                }
            }
        }
        
        flatten(this.settings);
        return flat;
    }
    
    /**
     * Get settings schema for UI generation
     */
    getSettingsSchema() {
        const schema = {};
        
        for (const [categoryKey, categoryInfo] of Object.entries(this.categories)) {
            schema[categoryKey] = {
                ...categoryInfo,
                settings: this.generateFieldSchema(categoryKey)
            };
        }
        
        return schema;
    }
    
    /**
     * Generate field schema for a category
     */
    generateFieldSchema(category) {
        const fields = {};
        const categorySettings = this.defaultSettings[category];
        
        function generateSchema(obj, prefix = '') {
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    generateSchema(value, fullKey);
                } else {
                    fields[fullKey] = {
                        type: this.getFieldType(value),
                        default: value,
                        label: this.formatLabel(key),
                        description: this.getFieldDescription(category, fullKey),
                        options: this.getFieldOptions(category, fullKey),
                        validation: this.getFieldValidation(category, fullKey)
                    };
                }
            }
        }
        
        generateSchema(categorySettings);
        return fields;
    }
    
    /**
     * Get field type for UI
     */
    getFieldType(value) {
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'string') {
            if (value.includes('password')) return 'password';
            if (value.includes('email')) return 'email';
            if (value.includes('url')) return 'url';
            return 'text';
        }
        return 'object';
    }
    
    /**
     * Format label for UI
     */
    formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
    }
    
    /**
     * Get field description
     */
    getFieldDescription(category, key) {
        const descriptions = {
            'general.theme': 'Choose the application theme',
            'general.language': 'Select your preferred language',
            'voice.speed': 'Adjust speech speed (0.5x - 2.0x)',
            'voice.volume': 'Adjust volume level (0% - 100%)',
            'humor.style': 'Choose your preferred humor style',
            'humor.intensity': 'How intense should the humor be?',
            'security.level': 'Select security level for your data',
            'performance.mode': 'Choose performance optimization mode'
        };
        
        return descriptions[`${category}.${key}`] || '';
    }
    
    /**
     * Get field options for select fields
     */
    getFieldOptions(category, key) {
        const options = {
            'general.theme': [
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'auto', label: 'Auto' }
            ],
            'humor.style': [
                { value: 'witty', label: 'Witty' },
                { value: 'sarcastic', label: 'Sarcastic' },
                { value: 'self_deprecating', label: 'Self-Deprecating' },
                { value: 'playful', label: 'Playful' },
                { value: 'dad_jokes', label: 'Dad Jokes' },
                { value: 'observational', label: 'Observational' },
                { value: 'dark', label: 'Dark' }
            ],
            'security.level': [
                { value: 'basic', label: 'Basic' },
                { value: 'standard', label: 'Standard' },
                { value: 'high', label: 'High' },
                { value: 'maximum', label: 'Maximum' }
            ],
            'performance.mode': [
                { value: 'auto', label: 'Auto' },
                { value: 'high_performance', label: 'High Performance' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'power_saver', label: 'Power Saver' }
            ]
        };
        
        return options[`${category}.${key}`] || null;
    }
    
    /**
     * Get field validation rules
     */
    getFieldValidation(category, key) {
        const validation = {
            'general.dataRetention': { min: 1, max: 365 },
            'voice.speed': { min: 0.5, max: 2.0, step: 0.1 },
            'voice.pitch': { min: 0.5, max: 2.0, step: 0.1 },
            'voice.volume': { min: 0, max: 1.0, step: 0.1 },
            'humor.intensity': { min: 0, max: 1.0, step: 0.1 },
            'performance.resourceLimits.maxMemory': { min: 512, max: 8192, step: 128 }
        };
        
        return validation[`${category}.${key}`] || null;
    }
    
    /**
     * Get current settings summary
     */
    getSettingsSummary() {
        const summary = {
            totalCategories: Object.keys(this.categories).length,
            configuredCategories: Object.keys(this.settings).length,
            customSettings: 0,
            lastModified: null
        };
        
        // Count custom settings (different from defaults)
        for (const [category, settings] of Object.entries(this.settings)) {
            const defaults = this.defaultSettings[category];
            for (const [key, value] of Object.entries(settings)) {
                if (JSON.stringify(value) !== JSON.stringify(defaults?.[key])) {
                    summary.customSettings++;
                }
            }
        }
        
        return summary;
    }
    
    /**
     * Search settings
     */
    searchSettings(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        for (const [categoryKey, category] of Object.entries(this.categories)) {
            const categorySettings = this.settings[categoryKey] || {};
            
            for (const [settingKey, value] of Object.entries(categorySettings)) {
                const label = this.formatLabel(settingKey);
                const description = this.getFieldDescription(categoryKey, settingKey);
                
                if (label.toLowerCase().includes(lowerQuery) || 
                    (description && description.toLowerCase().includes(lowerQuery))) {
                    results.push({
                        category: categoryKey,
                        key: settingKey,
                        label: label,
                        description: description,
                        value: value,
                        categoryInfo: category
                    });
                }
            }
        }
        
        return results;
    }
}

export default SettingsManager;
