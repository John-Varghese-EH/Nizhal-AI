// import { Web3Plugin } from '../plugins/web3/Web3Plugin.js';
import { CTFPlugin } from '../plugins/ctf/CTFPlugin.js';
import { SecurityPlugin } from '../plugins/security/SecurityPlugin.js';
import { mobileServer } from './MobileServerService.js';

// Competition Extensions
import { AISecurityExtension } from '../extensions/ai-security/MalwareClassifier.js';
import { OracleCloudExtension } from '../extensions/oracle-cloud/OCIManager.js';
import { HackathonExtension } from '../extensions/hackathon/HackathonDashboard.js';
import { AutomationExtension } from '../extensions/automation/WorkflowBuilder.js';
import { EmotionalCompanionExtension } from '../extensions/emotional/EmotionalCompanion.js';

/**
 * PluginManager - Handles loading and execution of Hacker Extensions
 */
class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.commands = new Map();
        this.isLoaded = false;
    }

    /**
     * Register a new plugin
     * @param {Object} plugin - Plugin instance
     */
    register(plugin) {
        if (this.plugins.has(plugin.name)) {
            console.warn(`Plugin ${plugin.name} already registered`);
            return;
        }

        console.log(`[PluginManager] Registering ${plugin.name}...`);
        this.plugins.set(plugin.name, plugin);

        // Register commands
        if (plugin.commands) {
            for (const cmd of plugin.commands) {
                // commands: [{ trigger: "audit", handler: "auditContract" }]
                // Map trigger phrase to plugin handler
                this.commands.set(cmd.trigger.toLowerCase(), {
                    plugin: plugin.name,
                    handler: cmd.handler
                });
            }
        }

        if (plugin.onLoad) plugin.onLoad();
    }

    /**
     * Initialize all plugins
     */
    async initialize() {
        if (this.isLoaded) return;

        console.log('[PluginManager] Initializing plugins...');

        // Register Core Hacker Extensions
        // this.register(Web3Plugin); // Disabled temporarily due to ethers dependency issue
        this.register(CTFPlugin);
        this.register(SecurityPlugin);

        // Register Competition Extensions
        this.register(AISecurityExtension);
        this.register(OracleCloudExtension);
        this.register(HackathonExtension);
        this.register(AutomationExtension);

        // Register Emotional Extension
        this.register(EmotionalCompanionExtension);

        // Initialize Mobile Sync
        try {
            mobileServer.start((text) => {
                console.log(`[PluginManager] Mobile Command: ${text}`);
                // In a future update, we can loop this back to main chat
            });
        } catch (e) {
            console.error('[PluginManager] Failed to start mobile server:', e);
        }

        this.isLoaded = true;
    }

    /**
     * Check if a text input matches a plugin command
     * @param {string} text - User input
     * @returns {Object|null} - Execution result or null
     */
    async executeCommand(text) {
        const lowerText = text.toLowerCase();

        // Simple keyword matching for now
        for (const [trigger, cmd] of this.commands) {
            if (lowerText.includes(trigger)) {
                const plugin = this.plugins.get(cmd.plugin);
                if (plugin && plugin[cmd.handler]) {
                    console.log(`[PluginManager] Executing ${cmd.plugin}:${cmd.handler}`);
                    return await plugin[cmd.handler](text); // Pass full text for context
                }
            }
        }

        return null;
    }

    /**
     * Get status of all plugins
     */
    getStatus() {
        const status = {};
        for (const [name, plugin] of this.plugins) {
            status[name] = {
                active: true,
                commands: plugin.commands?.length || 0
            };
        }
        return status;
    }
}

export const pluginManager = new PluginManager();
