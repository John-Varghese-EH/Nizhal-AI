import { v4 as uuidv4 } from 'uuid';
import { tavernCardService } from './TavernCardService';

// Browser-compatible persistent store
class LocalStore {
    constructor({ name }) { this.prefix = name; }
    has(key) { return localStorage.getItem(`${this.prefix}:${key}`) !== null; }
    get(key) { try { return JSON.parse(localStorage.getItem(`${this.prefix}:${key}`)) || []; } catch { return []; } }
    set(key, value) { localStorage.setItem(`${this.prefix}:${key}`, JSON.stringify(value)); }
}

/**
 * PersonalityMarketplace & Persona Studio Service
 * 
 * Manages rich character personas adhering to Tavern V2 character card specifications.
 */
export class PersonalityMarketplace {
    constructor() {
        this.store = new LocalStore({ name: 'nizhal-personalities' });
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
     * Import a character from a Tavern Card JSON string, object, or File (JSON or PNG)
     */
    async importCard(input) {
        try {
            const card = await tavernCardService.parseCard(input);
            const imported = this.store.get('imported');

            // Unique ID guarantee
            const existingIdx = imported.findIndex(p => p.id === card.id);
            const newPersona = {
                ...card,
                importedAt: new Date().toISOString(),
                isImported: true
            };

            if (existingIdx !== -1) {
                imported[existingIdx] = newPersona;
            } else {
                imported.push(newPersona);
            }

            this.store.set('imported', imported);
            console.log('[PersonaStudio] Successfully imported card:', card.displayName || card.name);
            return { success: true, persona: newPersona };
        } catch (error) {
            console.error('[PersonaStudio] Import failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Export any persona to Tavern V2 compliant JSON
     */
    exportCard(personaId) {
        const all = this.getAllPersonalities();
        const target = all.find(p => p.id === personaId);
        if (!target) return null;

        return tavernCardService.exportToTavernV2(target);
    }

    /**
     * Create and save a custom persona
     */
    createCustomPersona(data) {
        const id = data.id || `custom_${Date.now()}`;
        const newPersona = {
            id,
            name: data.name || 'Custom Mate',
            displayName: data.displayName || data.name || 'Custom Mate',
            description: data.description || '',
            personality: data.personality || data.description || '',
            firstMessage: data.firstMessage || 'Hello! I am ready to hang out.',
            systemPrompt: data.systemPrompt || '',
            model: data.model || '/assets/models/11_Aldina.vrm',
            type: data.type || 'vrm',
            voiceSettings: data.voiceSettings || { pitch: 1.0, rate: 1.0 },
            isCustom: true,
            createdAt: new Date().toISOString()
        };

        const customs = this.store.get('custom');
        const existingIdx = customs.findIndex(p => p.id === id);
        if (existingIdx !== -1) {
            customs[existingIdx] = newPersona;
        } else {
            customs.push(newPersona);
        }

        this.store.set('custom', customs);
        return newPersona;
    }

    /**
     * Retrieve all available personalities (Tavern Builtins + Custom + Imported)
     */
    getAllPersonalities() {
        const builtins = tavernCardService.getBuiltinPersonas().map(p => ({
            ...p,
            isBuiltIn: true
        }));

        const custom = this.store.get('custom').map(p => ({ ...p, isCustom: true }));
        const imported = this.store.get('imported').map(p => ({ ...p, isImported: true }));

        return [...builtins, ...custom, ...imported];
    }

    /**
     * Delete a custom or imported persona
     */
    deletePersona(id) {
        let list = this.store.get('custom');
        let filtered = list.filter(p => p.id !== id);
        this.store.set('custom', filtered);

        list = this.store.get('imported');
        filtered = list.filter(p => p.id !== id);
        this.store.set('imported', filtered);

        return true;
    }

    /**
     * Download persona as .json file directly in browser
     */
    downloadPersonaCard(personaId) {
        const cardV2 = this.exportCard(personaId);
        if (!cardV2) return false;

        const blob = new Blob([JSON.stringify(cardV2, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cardV2.data.name.toLowerCase().replace(/\s+/g, '_')}_card.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    }
}

export const personalityMarketplace = new PersonalityMarketplace();
export default personalityMarketplace;
