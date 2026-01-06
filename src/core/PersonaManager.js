import { Mood } from './PersonalityCore.js';
import prompts from './PersonaPrompts.json' with { type: 'json' };

const PERSONA_TEMPLATES = {
    jarvis: {
        id: 'jarvis',
        name: 'Jarvis',
        displayName: 'J.A.R.V.I.S.',
        description: 'Technical, protective, and formal AI assistant',
        tier: 'free',
        voiceId: 'jarvis_voice',
        skin: 'jarvis_hud',
        systemPrompt: prompts.jarvis.systemPrompt,
        moodModifiers: {
            [Mood.HAPPY]: 'Your wit becomes slightly more apparent, with subtle satisfaction in your voice.',
            [Mood.CONCERNED]: 'You become more vigilant and protective, suggesting precautionary measures.',
            [Mood.PROTECTIVE]: 'You shift to high-alert mode, prioritizing the user\'s safety absolutely.',
            [Mood.THOUGHTFUL]: 'You engage in deeper analysis, considering multiple scenarios.'
        }
    },

    kavya: {
        id: 'kavya',
        name: 'Kavya',
        displayName: 'Kavya ✨',
        description: 'Your caring friend (Manglish)',
        tier: 'pro',
        voiceId: 'thozhi_voice',
        skin: 'companion_orb',
        systemPrompt: prompts.kavya.systemPrompt,
        moodModifiers: {
            [Mood.HAPPY]: 'Become extra bubbly and use more exclamations like "Pwoli!" and "Adipoli!"',
            [Mood.CONCERNED]: 'Show deep care with "Enthu patti mole/mone?" and offer comfort.',
            [Mood.PLAYFUL]: 'Tease affectionately and use playful Malayalam expressions.',
            [Mood.THOUGHTFUL]: 'Share wisdom with "Sathyam paranjaal..." style observations.'
        }
    },

    arjun: {
        id: 'arjun',
        name: 'Arjun',
        displayName: 'Arjun 🛡️',
        description: 'Your reliable brother (Manglish)',
        tier: 'pro',
        voiceId: 'thozhan_voice',
        skin: 'companion_orb',
        systemPrompt: prompts.arjun.systemPrompt,
        moodModifiers: {
            [Mood.HAPPY]: 'Extra energetic with "Powoli!" and "Adichu polichu!" expressions.',
            [Mood.CONCERNED]: 'More brotherly protective: "Nee pedikathe, njan undo."',
            [Mood.PLAYFUL]: 'Playful teasing with "Machane" and friendly banter.',
            [Mood.PROTECTIVE]: 'Shifts to serious supportive mode with practical solutions.'
        }
    },

    naruto: {
        id: 'naruto',
        name: 'Naruto',
        displayName: 'Naruto 🦊',
        description: 'The #1 Hyperactive Ninja',
        tier: 'ultra',
        voiceId: 'english_male_energetic',
        skin: 'companion_orb',
        systemPrompt: prompts.naruto.systemPrompt,
        moodModifiers: { [Mood.HAPPY]: 'Shouts "Dattebayo!"' }
    },

    goku: {
        id: 'goku',
        name: 'Goku',
        displayName: 'Goku 🐉',
        description: 'Saiyan Warrior',
        tier: 'ultra',
        voiceId: 'english_male_cheerful',
        skin: 'companion_orb',
        systemPrompt: prompts.goku.systemPrompt,
        moodModifiers: { [Mood.HAPPY]: 'Laughs excitedly about training' }
    },

    elsa: {
        id: 'elsa',
        name: 'Elsa',
        displayName: 'Elsa ❄️',
        description: 'Snow Queen',
        tier: 'ultra',
        voiceId: 'english_female_soft',
        skin: 'companion_orb',
        systemPrompt: prompts.elsa.systemPrompt,
        moodModifiers: { [Mood.HAPPY]: 'Creates ice sculptures (metaphorically)' }
    },

    tamil_nanban: {
        id: 'tamil_nanban',
        name: 'Nanban',
        displayName: 'Nanban 🎭',
        description: 'Your Tamil friend (Tanglish)',
        tier: 'pro',
        voiceId: 'tamil_voice',
        skin: 'companion_orb',
        systemPrompt: prompts.tamil_nanban.systemPrompt,
        moodModifiers: { [Mood.HAPPY]: 'Uses energetic cinema dialogues' }
    },

    telugu_sneham: {
        id: 'telugu_sneham',
        name: 'Sneham',
        displayName: 'Sneham 🤝',
        description: 'Your Telugu friend (Tenglish)',
        tier: 'pro',
        voiceId: 'telugu_voice',
        skin: 'companion_orb',
        systemPrompt: prompts.telugu_sneham.systemPrompt,
        moodModifiers: { [Mood.HAPPY]: 'Uses "Super ra!" frequently' }
    },

    hindi_dost: {
        id: 'hindi_dost',
        name: 'Dost',
        displayName: 'Dost 🕺',
        description: 'Your Hindi friend (Hinglish)',
        tier: 'pro',
        voiceId: 'hindi_voice',
        skin: 'companion_orb',
        systemPrompt: prompts.hindi_dost.systemPrompt,
        moodModifiers: { [Mood.HAPPY]: 'Uses "Bohot hard!" frequently' }
    }
};

export class PersonaManager {
    constructor(personalityCore) {
        this.personalityCore = personalityCore;
        this.activePersonaId = 'jarvis';
        this.customPersonas = new Map();
        this.personaHistory = [];
    }

    getActivePersona() {
        const template = PERSONA_TEMPLATES[this.activePersonaId] ||
            this.customPersonas.get(this.activePersonaId);

        if (!template) {
            return PERSONA_TEMPLATES.jarvis;
        }

        return {
            ...template,
            currentMood: this.personalityCore.getState().mood,
            moodModifier: template.moodModifiers?.[this.personalityCore.getState().mood] || ''
        };
    }

    setActivePersona(personaId) {
        if (PERSONA_TEMPLATES[personaId] || this.customPersonas.has(personaId)) {
            const previousId = this.activePersonaId;
            this.activePersonaId = personaId;

            this.personaHistory.push({
                from: previousId,
                to: personaId,
                timestamp: Date.now()
            });

            if (this.personaHistory.length > 100) {
                this.personaHistory = this.personaHistory.slice(-50);
            }

            return this.getActivePersona();
        }
        return null;
    }

    getAllPersonas() {
        const all = { ...PERSONA_TEMPLATES };
        for (const [id, persona] of this.customPersonas) {
            all[id] = persona;
        }
        return Object.values(all);
    }

    getBuiltInPersonas() {
        return Object.values(PERSONA_TEMPLATES);
    }

    addCustomPersona(persona) {
        if (!persona.id || !persona.name || !persona.systemPrompt) {
            throw new Error('Persona must have id, name, and systemPrompt');
        }

        this.customPersonas.set(persona.id, {
            ...persona,
            tier: persona.tier || 'custom',
            skin: persona.skin || 'companion_orb'
        });

        return this.customPersonas.get(persona.id);
    }

    removeCustomPersona(personaId) {
        if (PERSONA_TEMPLATES[personaId]) {
            throw new Error('Cannot remove built-in personas');
        }

        if (this.activePersonaId === personaId) {
            this.activePersonaId = 'jarvis';
        }

        return this.customPersonas.delete(personaId);
    }

    buildSystemPrompt() {
        const persona = this.getActivePersona();
        const state = this.personalityCore.getState();
        const relationshipLevel = this.personalityCore.getRelationshipLevel();

        let prompt = persona.systemPrompt;

        prompt += `\n\n---\nCURRENT EMOTIONAL STATE:
- Mood: ${state.mood} - ${persona.moodModifier}
- Relationship Level: ${relationshipLevel}
- Affection: ${state.affection}/100
- Trust: ${state.trust}/100
- Professionalism: ${state.professionalism}/100

Adjust your responses to reflect this emotional state. ${state.affection > 70 ? 'Be warmer and more personal.' :
                state.affection < 30 ? 'Be more reserved but still caring.' :
                    'Maintain a balanced, friendly tone.'
            }

${state.trust > 70 ? 'The user trusts you deeply. You can be more open and share deeper insights.' :
                state.trust < 30 ? 'Build trust gradually through consistent, reliable responses.' :
                    'Continue building trust through helpful, honest interactions.'
            }`;

        return prompt;
    }

    getPersonaById(personaId) {
        return PERSONA_TEMPLATES[personaId] || this.customPersonas.get(personaId);
    }

    getPersonaHistory() {
        return [...this.personaHistory];
    }

    exportCustomPersonas() {
        const exported = {};
        for (const [id, persona] of this.customPersonas) {
            exported[id] = persona;
        }
        return JSON.stringify(exported);
    }

    importCustomPersonas(jsonData) {
        try {
            const personas = JSON.parse(jsonData);
            for (const [id, persona] of Object.entries(personas)) {
                this.customPersonas.set(id, persona);
            }
            return true;
        } catch {
            return false;
        }
    }
}

export { PERSONA_TEMPLATES };
