/**
 * SettingsService.js
 * Centralized settings orchestration and validation service.
 * Mediates between frontend UI components, the settings store, and keyring.
 */

export class SettingsService {
    /**
     * Validate a single preference/setting before saving.
     * @param {string} key - Preference key
     * @param {any} value - Value to validate
     * @returns {boolean} True if valid, throws an error if invalid
     */
    static validatePreference(key, value) {
        if (key === 'tempUnit') {
            if (value !== 'C' && value !== 'F') {
                throw new Error('Temperature unit must be C or F');
            }
        }
        if (key === 'characterOpacity') {
            const opacity = parseFloat(value);
            if (isNaN(opacity) || opacity < 0.1 || opacity > 1.0) {
                throw new Error('Opacity must be between 0.1 and 1.0');
            }
        }
        if (key === 'characterScale') {
            const scale = parseFloat(value);
            if (isNaN(scale) || scale < 0.5 || scale > 2.0) {
                throw new Error('Scale must be between 0.5 and 2.0');
            }
        }
        return true;
    }

    /**
     * Validates a Cloud API Key by sending a ping request via backend.
     * @param {string} provider - Provider ID ('gemini', 'openai', 'anthropic', 'elevenlabs', 'groq', 'huggingface', 'together')
     * @param {string} key - API Key to validate
     * @returns {Promise<boolean>} True if valid, false or throws on invalid
     */
    static async validateApiKey(provider, key) {
        if (!key || typeof key !== 'string' || !key.trim()) {
            throw new Error('API key cannot be empty');
        }

        try {
            console.log(`[SettingsService] Validating API key for ${provider}...`);
            // Invoke the Rust validate_provider_api_key command directly via nizhal bridge
            const isValid = await window.nizhal?.invoke('validate_provider_api_key', {
                provider,
                key: key.trim()
            });
            return !!isValid;
        } catch (error) {
            console.error(`[SettingsService] API key validation error for ${provider}:`, error);
            throw new Error(error.message || `Failed to validate ${provider} key`);
        }
    }

    /**
     * Updates and persists standard user preferences.
     * @param {object} updatedPreferences - Map of preference key-value pairs
     * @returns {Promise<object>} The fully updated preferences object
     */
    static async updatePreferences(updatedPreferences) {
        try {
            // Get current preferences
            const currentPrefs = await window.nizhal?.memory.getUserPreferences() || {};
            
            // Validate all new inputs
            for (const [key, value] of Object.entries(updatedPreferences)) {
                this.validatePreference(key, value);
            }

            // Merge and update
            const merged = { ...currentPrefs, ...updatedPreferences };
            await window.nizhal?.memory.setUserPreferences(merged);
            return merged;
        } catch (error) {
            console.error('[SettingsService] Failed to update preferences:', error);
            throw error;
        }
    }

    /**
     * Saves a provider API key securely to the keyring after validation.
     * @param {string} provider - Provider ID
     * @param {string} key - API Key
     * @param {object} customConfig - Optional extra config for 'custom' provider
     * @returns {Promise<boolean>} True on success
     */
    static async saveSecureApiKey(provider, key, customConfig = null) {
        // 1. Validate the API Key first
        const isValid = await this.validateApiKey(provider, key);
        if (!isValid) {
            throw new Error(`The API Key provided for ${provider} is invalid.`);
        }

        // 2. Save key to secure OS Keyring
        await window.nizhal?.keyring?.saveKey(provider, key.trim());

        // 3. Persist provider config
        if (provider === 'custom' && customConfig) {
            const currentPrefs = await window.nizhal?.memory.getUserPreferences() || {};
            const mergedConfig = {
                ...currentPrefs.customConfig,
                ...customConfig
            };
            await window.nizhal?.memory.setUserPreferences({
                ...currentPrefs,
                customConfig: mergedConfig
            });
            await window.nizhal?.ai.setProvider('custom', {});
        } else {
            await window.nizhal?.ai.setProvider(provider, {});
        }

        return true;
    }

    /**
     * Delete an API key from the keyring.
     */
    static async deleteSecureApiKey(provider) {
        try {
            await window.nizhal?.keyring?.deleteKey(provider);
            return true;
        } catch (error) {
            console.error(`[SettingsService] Failed to delete key for ${provider}:`, error);
            throw error;
        }
    }
}
