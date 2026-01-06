export class PersonaMarketplace {
    constructor(licenseService, paymentService) {
        this.licenseService = licenseService;
        this.paymentService = paymentService;
        this.apiBaseUrl = 'https://api.nizhal.ai/marketplace';
        this.cachedPersonas = null;
        this.cacheExpiry = 0;
        this.cacheDuration = 5 * 60 * 1000;
    }

    async fetchAvailablePersonas() {
        const now = Date.now();
        if (this.cachedPersonas && now < this.cacheExpiry) {
            return this.cachedPersonas;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/personas`);
            if (response.ok) {
                this.cachedPersonas = await response.json();
                this.cacheExpiry = now + this.cacheDuration;
                return this.cachedPersonas;
            }
        } catch (error) {
            console.log('Using local persona catalog (API unreachable)');
        }

        return this.getLocalPersonaCatalog();
    }

    getLocalPersonaCatalog() {
        const unlockedPersonas = this.licenseService.getUnlockedPersonas().map(l => l.personaId);

        return [
            {
                id: 'jarvis',
                name: 'J.A.R.V.I.S.',
                description: 'Technical, protective, and formal AI assistant',
                tier: 'free',
                price: { inr: 0, usd: 0 },
                features: ['Technical expertise', 'Formal communication', 'Proactive assistance'],
                skin: 'jarvis_hud',
                voicePreview: '/voices/jarvis_sample.mp3',
                thumbnail: '/images/jarvis_thumb.png',
                unlocked: true
            },
            {
                id: 'bestie',
                name: 'Bestie ❤️',
                description: 'Your caring female companion with emotional intelligence',
                tier: 'pro',
                price: { inr: 299, usd: 3.99 },
                features: ['Emotional intelligence', 'Friendly communication', 'Empathetic support'],
                skin: 'companion_orb',
                voicePreview: '/voices/bestie_sample.mp3',
                thumbnail: '/images/bestie_thumb.png',
                unlocked: unlockedPersonas.includes('bestie')
            },
            {
                id: 'buddy',
                name: 'Buddy 🤝',
                description: 'Your supportive male companion with practical advice',
                tier: 'pro',
                price: { inr: 299, usd: 3.99 },
                features: ['Brotherly support', 'Practical advice', 'Motivational coaching'],
                skin: 'companion_orb',
                voicePreview: '/voices/buddy_sample.mp3',
                thumbnail: '/images/buddy_thumb.png',
                unlocked: unlockedPersonas.includes('buddy')
            },
            {
                id: 'pro_bundle',
                name: 'Pro Bundle',
                description: 'All personas + Premium voices + Memory expansion',
                tier: 'bundle',
                price: { inr: 799, usd: 9.99 },
                features: ['All personas', 'Premium ElevenLabs voices', '10x memory capacity'],
                skin: null,
                unlocked: unlockedPersonas.includes('bestie') && unlockedPersonas.includes('buddy')
            }
        ];
    }

    async purchasePersona(personaId, gateway, parentWindow) {
        const productId = this.personaIdToProductId(personaId);

        const paymentResult = await this.paymentService.initiateCheckout(
            productId,
            gateway,
            parentWindow
        );

        if (paymentResult.success) {
            const licenses = await this.licenseService.unlockFromPayment(paymentResult, productId);

            return {
                success: true,
                personaId,
                licenses,
                message: 'Purchase successful! Your persona is now unlocked.'
            };
        }

        return {
            success: false,
            cancelled: paymentResult.cancelled,
            error: paymentResult.error
        };
    }

    personaIdToProductId(personaId) {
        const mapping = {
            'bestie': 'bestie_persona',
            'buddy': 'buddy_persona',
            'pro_bundle': 'pro_bundle',
            'premium_voices': 'premium_voice_pack',
            'memory_expansion': 'memory_expansion'
        };
        return mapping[personaId] || personaId;
    }

    async downloadPersona(personaId) {
        if (!this.licenseService.isUnlocked(personaId)) {
            return {
                success: false,
                error: 'Persona not unlocked. Please purchase first.'
            };
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/personas/${personaId}/download`);
            if (response.ok) {
                const personaData = await response.json();
                return {
                    success: true,
                    data: personaData
                };
            }
        } catch (error) {
            console.log('Using bundled persona data');
        }

        return {
            success: true,
            data: this.getBundledPersonaData(personaId)
        };
    }

    getBundledPersonaData(personaId) {
        const bundledData = {
            jarvis: {
                id: 'jarvis',
                systemPrompt: null,
                voiceSettings: {
                    provider: 'webspeech',
                    voiceId: 'default',
                    rate: 1.0,
                    pitch: 0.9
                },
                skinSettings: {
                    type: 'jarvis_hud',
                    primaryColor: '#00d4ff',
                    accentColor: '#ff6b35'
                }
            },
            bestie: {
                id: 'bestie',
                systemPrompt: null,
                voiceSettings: {
                    provider: 'elevenlabs',
                    voiceId: 'EXAVITQu4vr4xnSDxMaL',
                    fallbackProvider: 'webspeech',
                    rate: 1.1,
                    pitch: 1.1
                },
                skinSettings: {
                    type: 'companion_orb',
                    primaryColor: '#ec4899',
                    accentColor: '#f472b6'
                }
            },
            buddy: {
                id: 'buddy',
                systemPrompt: null,
                voiceSettings: {
                    provider: 'elevenlabs',
                    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
                    fallbackProvider: 'webspeech',
                    rate: 1.0,
                    pitch: 0.95
                },
                skinSettings: {
                    type: 'companion_orb',
                    primaryColor: '#3b82f6',
                    accentColor: '#60a5fa'
                }
            }
        };

        return bundledData[personaId] || null;
    }

    async getPersonaDetails(personaId) {
        const catalog = await this.fetchAvailablePersonas();
        return catalog.find(p => p.id === personaId) || null;
    }

    async checkForUpdates(personaId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/personas/${personaId}/version`);
            if (response.ok) {
                const { latestVersion } = await response.json();
                return { hasUpdate: true, version: latestVersion };
            }
        } catch {
            return { hasUpdate: false };
        }
        return { hasUpdate: false };
    }

    clearCache() {
        this.cachedPersonas = null;
        this.cacheExpiry = 0;
    }
}
