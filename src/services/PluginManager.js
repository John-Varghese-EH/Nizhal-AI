/**
 * PluginManager - Modular Extensibility Engine for Desktop Companion
 * Provides safe registration and event bus dispatch for optional capabilities.
 */

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.commands = new Map();
        this.isLoaded = false;
    }

    /**
     * Register a new plugin
     * @param {Object} plugin - Plugin instance adhering to { name, version, commands?, onLoad?, onUnload? }
     */
    register(plugin) {
        if (!plugin || !plugin.name) {
            console.warn('[PluginManager] Invalid plugin registered:', plugin);
            return;
        }

        if (this.plugins.has(plugin.name)) {
            console.warn(`[PluginManager] Plugin ${plugin.name} already registered`);
            return;
        }

        console.log(`[PluginManager] Registering plugin: ${plugin.name}`);
        this.plugins.set(plugin.name, plugin);

        if (Array.isArray(plugin.commands)) {
            for (const cmd of plugin.commands) {
                if (cmd.trigger && cmd.handler) {
                    this.commands.set(cmd.trigger.toLowerCase(), {
                        plugin: plugin.name,
                        handler: cmd.handler
                    });
                }
            }
        }

        try {
            if (typeof plugin.onLoad === 'function') {
                plugin.onLoad();
            }
        } catch (err) {
            console.error(`[PluginManager] Error loading plugin ${plugin.name}:`, err);
        }
    }

    /**
     * Unregister a plugin
     */
    unregister(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) return;

        try {
            if (typeof plugin.onUnload === 'function') {
                plugin.onUnload();
            }
        } catch (err) {
            console.error(`[PluginManager] Error unloading plugin ${pluginName}:`, err);
        }

        // Clean up commands
        for (const [trigger, cmd] of this.commands.entries()) {
            if (cmd.plugin === pluginName) {
                this.commands.delete(trigger);
            }
        }

        this.plugins.delete(pluginName);
        console.log(`[PluginManager] Unregistered plugin: ${pluginName}`);
    }

    /**
     * Initialize built-in companion plugins
     */
    async initialize() {
        if (this.isLoaded) return;
        console.log('[PluginManager] Initializing companion plugins...');
        this.isLoaded = true;
    }

    /**
     * Dispatch command trigger to registered plugin
     * @param {string} text - User command or voice prompt
     */
    async executeCommand(text) {
        if (!text || typeof text !== 'string') return null;
        const lowerText = text.toLowerCase().trim();

        for (const [trigger, cmd] of this.commands.entries()) {
            if (lowerText.startsWith(trigger) || lowerText.includes(trigger)) {
                const plugin = this.plugins.get(cmd.plugin);
                if (plugin && typeof plugin[cmd.handler] === 'function') {
                    console.log(`[PluginManager] Executing ${cmd.plugin}:${cmd.handler}`);
                    try {
                        return await plugin[cmd.handler](text);
                    } catch (err) {
                        console.error(`[PluginManager] Command execution error:`, err);
                        return null;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Get active status of all plugins
     */
    getStatus() {
        const status = {};
        for (const [name, plugin] of this.plugins) {
            status[name] = {
                active: true,
                version: plugin.version || '1.0.0',
                commands: plugin.commands?.length || 0
            };
        }
        return status;
    }
}

export const pluginManager = new PluginManager();
export default pluginManager;
