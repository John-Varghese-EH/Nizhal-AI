import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';

/**
 * PersonalityMarketplace - Export/Import custom personalities
 * 
 * Features:
 * - Export: Package personality settings + prompts as JSON
 * - Import: Load community personalities
 * - Share: Generate shareable links
 */
export class PersonalityMarketplace {
    constructor() {
        this.store = new Store({ name: 'nizhal-personalities' });
        this.initialize();
    }

    initialize() {
        if (!this.store.has('custom')) {
            this.store.set('custom', []);
        }
        if (!this.store.has('imported')) {
            this.store.set('imported', []);
        }
    }

    /**
     * Export current personality as shareable package
     */
    exportPersonality(name, settings) {
        const personality = {
            id: uuidv4(),
            name,
            version: '1.0',
            createdAt: new Date().toISOString(),
            author: 'Nizhal User',
            settings: {
                mode: settings.personalityMode || 'gf',
                systemPrompt: settings.customPrompt || null,
                voiceId: settings.voiceId || null,
                theme: settings.theme || null,
                traits: settings.traits || []
            },
            metadata: {
                downloads: 0,
                rating: 0
            }
        };

        // Store locally
        const customs = this.store.get('custom');
        customs.push(personality);
        this.store.set('custom', customs);

        return personality;
    }

    /**
     * Import a personality from JSON data
     */
    importPersonality(jsonData) {
        try {
            const personality = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Validate required fields
            if (!personality.id || !personality.name || !personality.settings) {
                throw new Error('Invalid personality format');
            }

            const imported = this.store.get('imported');

            // Check for duplicates
            if (imported.some(p => p.id === personality.id)) {
                console.log('[Marketplace] Personality already imported');
                return { success: false, message: 'Already imported' };
            }

            personality.importedAt = new Date().toISOString();
            imported.push(personality);
            this.store.set('imported', imported);

            return { success: true, personality };
        } catch (error) {
            console.error('[Marketplace] Import failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get all available personalities (built-in + custom + imported)
     */
    getAllPersonalities() {
        const builtIn = [
            { id: 'gf', name: 'Girlfriend', author: 'Nizhal AI', isBuiltIn: true },
            { id: 'bf', name: 'Boyfriend', author: 'Nizhal AI', isBuiltIn: true },
            { id: 'jarvis', name: 'JARVIS', author: 'Nizhal AI', isBuiltIn: true }
        ];

        const custom = this.store.get('custom').map(p => ({ ...p, isCustom: true }));
        const imported = this.store.get('imported').map(p => ({ ...p, isImported: true }));

        return [...builtIn, ...custom, ...imported];
    }

    /**
     * Delete a custom or imported personality
     */
    deletePersonality(id, type = 'custom') {
        const key = type === 'custom' ? 'custom' : 'imported';
        const list = this.store.get(key);
        const filtered = list.filter(p => p.id !== id);
        this.store.set(key, filtered);
        return true;
    }

    /**
     * Generate shareable JSON string
     */
    generateShareableJSON(personalityId) {
        const all = [...this.store.get('custom'), ...this.store.get('imported')];
        const personality = all.find(p => p.id === personalityId);

        if (!personality) return null;

        // Remove local-only fields
        const shareable = { ...personality };
        delete shareable.importedAt;

        return JSON.stringify(shareable, null, 2);
    }
}

export const personalityMarketplace = new PersonalityMarketplace();
