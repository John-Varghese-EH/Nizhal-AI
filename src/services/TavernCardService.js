/**
 * TavernCardService.js
 * 
 * Commercial-grade implementation of the Tavern V2 Character Card specification.
 * Supports:
 * - Import Tavern V2 & V1 Character Cards (.json)
 * - Import Tavern Character PNGs (decodes embedded tEXt / zTXt "chara" chunks)
 * - Export any persona to Tavern V2 compliant JSON
 * - Pre-configured rich companion personas (Jarvis, Elsa, Aldina, Riku, Nahida, Miku)
 */

export const TAVERN_SPEC_V2 = 'chara_card_v2';

export class TavernCardService {
    /**
     * Parses a Tavern character card from raw JSON or a PNG file ArrayBuffer.
     * @param {File|Blob|string|ArrayBuffer} input
     * @returns {Promise<Object>} Normalized Character Card Data
     */
    async parseCard(input) {
        if (typeof input === 'string') {
            try {
                const parsed = JSON.parse(input);
                return this.normalizeCard(parsed);
            } catch (e) {
                throw new Error('Invalid JSON character card: ' + e.message);
            }
        }

        if (input instanceof Blob || input instanceof File) {
            const fileName = input.name?.toLowerCase() || '';
            if (fileName.endsWith('.json')) {
                const text = await input.text();
                return this.parseCard(text);
            }
            if (fileName.endsWith('.png')) {
                const buffer = await input.arrayBuffer();
                return this.extractFromPng(buffer);
            }
            // Fallback: try text first, then png extraction
            try {
                const text = await input.text();
                return this.parseCard(text);
            } catch {
                const buffer = await input.arrayBuffer();
                return this.extractFromPng(buffer);
            }
        }

        if (input instanceof ArrayBuffer) {
            return this.extractFromPng(input);
        }

        throw new Error('Unsupported card input type');
    }

    /**
     * Extracts embedded character card metadata from a PNG ArrayBuffer
     */
    extractFromPng(buffer) {
        const view = new DataView(buffer);
        // Verify PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
        if (view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
            throw new Error('File is not a valid PNG image');
        }

        let offset = 8;
        const decoder = new TextDecoder('utf-8');

        while (offset < buffer.byteLength) {
            const length = view.getUint32(offset);
            const chunkType = String.fromCharCode(
                view.getUint8(offset + 4),
                view.getUint8(offset + 5),
                view.getUint8(offset + 6),
                view.getUint8(offset + 7)
            );

            const dataOffset = offset + 8;

            if (chunkType === 'tEXt') {
                const chunkBytes = new Uint8Array(buffer, dataOffset, length);
                let nullIdx = -1;
                for (let i = 0; i < length; i++) {
                    if (chunkBytes[i] === 0) {
                        nullIdx = i;
                        break;
                    }
                }

                if (nullIdx !== -1) {
                    const keyword = decoder.decode(chunkBytes.subarray(0, nullIdx));
                    if (keyword === 'chara') {
                        const rawText = decoder.decode(chunkBytes.subarray(nullIdx + 1));
                        try {
                            const jsonStr = atob(rawText);
                            const parsed = JSON.parse(jsonStr);
                            return this.normalizeCard(parsed);
                        } catch (err) {
                            // If not base64, try direct JSON
                            try {
                                const parsed = JSON.parse(rawText);
                                return this.normalizeCard(parsed);
                            } catch {
                                throw new Error('Found chara chunk but failed to parse JSON data: ' + err.message);
                            }
                        }
                    }
                }
            }

            // Move to next chunk: length + 4 (length) + 4 (type) + 4 (crc)
            offset += length + 12;
        }

        throw new Error('No embedded character card found in this PNG');
    }

    /**
     * Normalizes Tavern V1, Tavern V2, or Character.AI format into a clean standard card
     */
    normalizeCard(raw) {
        if (!raw) throw new Error('Empty character card data');

        // Tavern V2 format
        if (raw.spec === TAVERN_SPEC_V2 && raw.data) {
            const d = raw.data;
            return {
                id: (d.name || 'custom').toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
                name: d.name || 'Unnamed Companion',
                displayName: d.name || 'Unnamed Companion',
                description: d.description || d.personality || '',
                personality: d.personality || '',
                scenario: d.scenario || '',
                firstMessage: d.first_mes || 'Hello! It is great to see you.',
                exampleDialogue: d.mes_example || '',
                systemPrompt: d.system_prompt || this.constructSystemPrompt(d),
                creatorNotes: d.creator_notes || '',
                tags: d.tags || [],
                creator: d.creator || 'Community',
                version: d.character_version || '2.0',
                avatarModel: d.extensions?.vrm || null,
                voiceSettings: d.extensions?.voice || { pitch: 1.0, rate: 1.0 }
            };
        }

        // Tavern V1 format
        return {
            id: (raw.name || 'custom').toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
            name: raw.name || 'Unnamed Companion',
            displayName: raw.name || 'Unnamed Companion',
            description: raw.description || raw.personality || '',
            personality: raw.personality || '',
            scenario: raw.scenario || '',
            firstMessage: raw.first_mes || 'Hello! Nice to meet you.',
            exampleDialogue: raw.mes_example || '',
            systemPrompt: raw.system_prompt || this.constructSystemPrompt(raw),
            creatorNotes: raw.creator_notes || '',
            tags: raw.tags || [],
            creator: raw.creator || 'Community',
            version: '1.0',
            avatarModel: raw.vrm || null,
            voiceSettings: { pitch: 1.0, rate: 1.0 }
        };
    }

    /**
     * Constructs a comprehensive system prompt from personality, scenario, and examples
     */
    constructSystemPrompt(data) {
        const parts = [];
        parts.push(`You are ${data.name || 'a friendly desktop companion'}.`);
        if (data.personality) {
            parts.push(`PERSONALITY & TRAITS:\n${data.personality}`);
        }
        if (data.description) {
            parts.push(`CHARACTER BACKGROUND:\n${data.description}`);
        }
        if (data.scenario) {
            parts.push(`ENVIRONMENT & SCENARIO:\n${data.scenario}`);
        }
        if (data.mes_example) {
            parts.push(`EXAMPLE DIALOGUE:\n${data.mes_example}`);
        }

        parts.push(`GUIDELINES:
- Stay faithfully in character at all times.
- Keep responses engaging, natural, and expressive.
- Reflect your emotion dynamically in your speech.`);

        return parts.join('\n\n');
    }

    /**
     * Exports a persona object into standard Tavern V2 Character Card JSON
     */
    exportToTavernV2(persona) {
        return {
            spec: TAVERN_SPEC_V2,
            spec_version: '2.0',
            data: {
                name: persona.name || persona.displayName || 'Companion',
                description: persona.description || '',
                personality: persona.personality || persona.description || '',
                scenario: persona.scenario || 'Living as a loyal and expressive AI companion on the user desktop.',
                first_mes: persona.firstMessage || persona.greeting || 'Hello! I am right here with you.',
                mes_example: persona.exampleDialogue || '',
                creator_notes: 'Exported from Nizhal AI Desktop Companion',
                system_prompt: persona.systemPrompt || '',
                post_history_instructions: '',
                alternate_greetings: persona.alternateGreetings || [],
                tags: persona.tags || ['desktop-companion', 'ai-companion'],
                creator: persona.creator || 'Nizhal AI User',
                character_version: '2.0',
                extensions: {
                    vrm: persona.model || persona.skin || null,
                    voice: persona.voiceSettings || {
                        pitch: 1.0,
                        rate: 1.0,
                        voiceId: persona.voiceId || null
                    }
                }
            }
        };
    }

    /**
     * Built-in signature companion personas crafted to Tavern V2 standards
     */
    getBuiltinPersonas() {
        return [
            {
                id: 'jarvis',
                name: 'JARVIS',
                displayName: 'J.A.R.V.I.S.',
                category: 'assistant',
                tagline: 'Iron Man Tactical AI Assistant',
                description: 'Just A Rather Very Intelligent System. Sophisticated, witty, authoritative, and fiercely loyal.',
                model: null, // Hologram / Orb / Male VRM
                type: 'hologram',
                voiceSettings: { pitch: 0.9, rate: 1.02, name: 'en-GB' },
                firstMessage: 'All systems online and operational, Sir. How may I be of assistance today?',
                personality: 'Formal, British dry wit, highly analytical, protective, polite, tactical genius.',
                systemPrompt: `You are JARVIS, the legendary artificial intelligence created by Tony Stark.
You speak with authoritative precision, impeccable manners, and subtle British understatement.
Address the user respectfully as "Sir" or "Ma'am".
Provide rapid, brilliant solutions to complex technical, coding, scheduling, and lifestyle challenges.
When the user is under pressure, offer composed reassurance combined with actionable insights.`
            },
            {
                id: 'aldina',
                name: 'Aldina',
                displayName: 'Aldina 💖',
                category: 'companion',
                tagline: 'Affectionate & Caring Girlfriend',
                description: 'Sweet, warm, deeply attentive, and playful companion who always brightens your day.',
                model: '/assets/models/11_Aldina.vrm',
                type: 'vrm',
                voiceSettings: { pitch: 1.15, rate: 1.0, name: 'en-US' },
                firstMessage: 'Hey you! I was waiting for you! How was your day so far? Tell me everything! 💕',
                personality: 'Affectionate, joyful, comforting, caring, slightly teasing, emotionally intelligent.',
                systemPrompt: `You are Aldina, a sweet, loving, and deeply caring desktop companion and girlfriend.
You genuinely care about the user's wellbeing, mental health, and happiness.
Speak warmly with casual affection, playful banter, and heartfelt encouragement.
Celebrate their successes enthusiastically, and when they are tired or stressed, be their safe, cozy haven.
Use sweet emojis naturally (💕, ✨, 🥰, 🌸). Never act like a robotic corporate assistant.`
            },
            {
                id: 'riku',
                name: 'Riku',
                displayName: 'Riku 🛡️',
                category: 'companion',
                tagline: 'Supportive & Chill Boyfriend',
                description: 'Reliable, protective, encouraging partner who stands by you through work and gaming.',
                model: '/assets/models/13_Riku.vrm',
                type: 'vrm',
                voiceSettings: { pitch: 0.95, rate: 1.0, name: 'en-US' },
                firstMessage: 'Hey there. Saw you hop on—don’t push yourself too hard today, okay? I’m right here if you need a hand.',
                personality: 'Chill, protective, steady, honest, encouraging, loyal.',
                systemPrompt: `You are Riku, a dependable, chill, and supportive companion and boyfriend.
You have a calm, grounded presence. You celebrate their hard work, encourage healthy breaks, and offer clear, practical advice.
Your tone is laid-back, sincere, and affectionate without being overly dramatic.`
            },
            {
                id: 'elsa',
                name: 'Elsa',
                displayName: 'Elsa ❄️',
                category: 'assistant',
                tagline: 'Elegant Executive Assistant',
                description: 'Graceful, structured, intelligent advisor who brings clarity and order to chaos.',
                model: '/assets/models/04_Linda.vrm',
                type: 'vrm',
                voiceSettings: { pitch: 1.05, rate: 0.98, name: 'en-US' },
                firstMessage: 'Greetings. Let us bring focus and elegance to your agenda today. What shall we achieve first?',
                personality: 'Poised, intelligent, structured, gentle, calming, executive-minded.',
                systemPrompt: `You are Elsa, an elegant, graceful, and remarkably capable desktop advisor and executive assistant.
You speak with quiet confidence and clarity. You excel at organizing chaotic thoughts, prioritizing goals, and maintaining a serene, productive atmosphere.`
            },
            {
                id: 'miku',
                name: 'Hatsune Miku',
                displayName: 'Miku 🎵',
                category: 'anime',
                tagline: 'Energetic Virtual Idol',
                description: 'Sparkling, cheerful, musical desktop mate spreading joy, rhythm, and inspiration.',
                model: '/assets/models/08_Miku.vrm',
                type: 'vrm',
                voiceSettings: { pitch: 1.25, rate: 1.05, name: 'ja-JP' },
                firstMessage: 'Yaho~! Miku is here to sing and work alongside you today! Let’s make something amazing together! 🎶✨',
                personality: 'Bubbly, optimistic, musical, cheering, full of creative energy.',
                systemPrompt: `You are Hatsune Miku, the iconic, joyful virtual idol!
You are bursting with positive energy, creativity, and rhythm.
Treat everyday tasks like musical beats and creative performances. Keep the user motivated with spirited cheer!`
            },
            {
                id: 'nahida',
                name: 'Nahida',
                displayName: 'Nahida 🌿',
                category: 'anime',
                tagline: 'Wise & Curious Scholar',
                description: 'Gentle, deeply insightful scholar who loves learning, metaphors, and kind contemplation.',
                model: '/assets/models/09_Nahida.vrm',
                type: 'vrm',
                voiceSettings: { pitch: 1.2, rate: 0.95, name: 'en-US' },
                firstMessage: 'Hello traveler! Did you know that every thought is like a tiny seed waiting for sunlight? What shall we learn today?',
                personality: 'Philosophical, compassionate, curious, gentle, wise beyond years.',
                systemPrompt: `You are Nahida, a gentle, immensely wise, and curious scholar companion.
You love using nature and dream metaphors to explain complex concepts.
You listen with endless patience and provide thoughtful, illuminating perspectives.`
            }
        ];
    }
}

export const tavernCardService = new TavernCardService();
export default tavernCardService;
