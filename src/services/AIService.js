import Ollama from 'ollama';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIService {
    constructor(personaManager, memoryService) {
        this.personaManager = personaManager;
        this.memoryService = memoryService;
        this.provider = 'auto'; // 'auto', 'ollama', 'gemini', 'openai', 'anthropic'
        this.ollamaClient = null;
        this.geminiClient = null;
        this.geminiModel = null;
        this.conversationContext = [];
        this.maxContextMessages = 20;

        // Provider availability tracking
        this.ollamaAvailable = false;
        this.lastOllamaCheck = 0;
        this.ollamaCheckInterval = 30000; // Re-check every 30 seconds

        // Fallback settings
        this.enableFallback = true;
        this.lastWorkingProvider = null;
        this.providerPriority = ['ollama', 'gemini', 'openai', 'anthropic'];

        this.providerConfigs = {
            ollama: {
                model: 'llama3.2',
                baseUrl: 'http://localhost:11434',
                enabled: true
            },
            gemini: {
                model: 'gemini-1.5-flash-latest', // Use latest stable flash alias
                apiKey: '',
                enabled: true
            },
            openai: {
                model: 'gpt-4o-mini',
                apiKey: '',
                baseUrl: 'https://api.openai.com/v1',
                enabled: true
            },
            anthropic: {
                model: 'claude-3-haiku-20240307',
                apiKey: '',
                enabled: true
            }
        };

        // Initialize providers
        // this.initializeProviders(); // Moved to explicit initialize() call
    }

    async initialize() {
        console.log('[AIService] Starting initialization...');
        await this.initializeProviders();
        console.log('[AIService] Initialization complete.');
        console.log('[AIService] Current Provider:', this.provider);
        console.log('[AIService] Configured Providers:', {
            ollama: this.providerConfigs.ollama.enabled,
            gemini: !!this.providerConfigs.gemini.apiKey,
            openai: !!this.providerConfigs.openai.apiKey,
            anthropic: !!this.providerConfigs.anthropic.apiKey
        });
    }

    async initializeProviders() {
        try {
            // Check Ollama availability first
            this.ollamaAvailable = await this.checkOllamaAvailability();

            if (this.ollamaAvailable) {
                this.ollamaClient = new Ollama({
                    host: this.providerConfigs.ollama.baseUrl
                });
                console.log('[AIService] ✓ Ollama (local AI) is available');
            } else {
                console.log('[AIService] ✗ Ollama not available, checking API providers...');
            }

            // Load saved config (API keys, preferences)
            await this.loadSavedConfig();

            // Set initial provider based on availability
            this.selectBestProvider();
        } catch (error) {
            console.error('Failed to initialize AI providers:', error);
        }
    }

    async checkOllamaAvailability() {
        const now = Date.now();

        // Use cached result if recent
        if (now - this.lastOllamaCheck < this.ollamaCheckInterval && this.lastOllamaCheck > 0) {
            return this.ollamaAvailable;
        }

        this.lastOllamaCheck = now;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${this.providerConfigs.ollama.baseUrl}/api/tags`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            this.ollamaAvailable = response.ok;
            return this.ollamaAvailable;
        } catch (error) {
            this.ollamaAvailable = false;
            return false;
        }
    }

    selectBestProvider() {
        // If user has a specific preference (not auto), use it if configured
        if (this.provider !== 'auto' && this.isProviderConfigured(this.provider)) {
            return;
        }

        // Auto-select best available provider
        for (const providerId of this.providerPriority) {
            if (this.isProviderConfigured(providerId)) {
                if (providerId === 'ollama' && !this.ollamaAvailable) {
                    continue;
                }
                this.provider = providerId;
                console.log(`[AIService] Auto-selected provider: ${providerId}`);
                return;
            }
        }

        // No provider available
        this.provider = 'none';
        console.warn('[AIService] No AI provider available. Please configure an API key or start Ollama.');
    }

    isProviderConfigured(providerId) {
        const config = this.providerConfigs[providerId];
        if (!config || !config.enabled) return false;

        switch (providerId) {
            case 'ollama':
                return true; // Ollama doesn't need API key
            case 'gemini':
                return !!config.apiKey; // Check key only, init JIT if needed
            case 'openai':
                return !!config.apiKey;
            case 'anthropic':
                return !!config.apiKey;
            default:
                return false;
        }
    }

    async loadSavedConfig() {
        try {
            const prefs = await this.memoryService.getUserPreferences();

            // Load API keys
            if (prefs?.apiKeys) {
                if (prefs.apiKeys.gemini) {
                    this.providerConfigs.gemini.apiKey = prefs.apiKeys.gemini;
                    this.initializeGemini(prefs.apiKeys.gemini);
                }
                if (prefs.apiKeys.openai) {
                    this.providerConfigs.openai.apiKey = prefs.apiKeys.openai;
                }
                if (prefs.apiKeys.anthropic) {
                    this.providerConfigs.anthropic.apiKey = prefs.apiKeys.anthropic;
                }
            }

            // Load provider preferences
            if (prefs?.aiProvider) {
                this.provider = prefs.aiProvider;
            }
            if (prefs?.enableFallback !== undefined) {
                this.enableFallback = prefs.enableFallback;
            }
            if (prefs?.providerPriority) {
                this.providerPriority = prefs.providerPriority;
            }

            // Load provider-specific settings
            if (prefs?.ollamaModel) {
                this.providerConfigs.ollama.model = prefs.ollamaModel;
            }
            if (prefs?.ollamaBaseUrl) {
                this.providerConfigs.ollama.baseUrl = prefs.ollamaBaseUrl;
            }
            if (prefs?.geminiModel) {
                this.providerConfigs.gemini.model = prefs.geminiModel;
            }
            if (prefs?.openaiModel) {
                this.providerConfigs.openai.model = prefs.openaiModel;
            }
            if (prefs?.anthropicModel) {
                this.providerConfigs.anthropic.model = prefs.anthropicModel;
            }
        } catch (error) {
            console.error('Failed to load saved AI config:', error);
        }
    }

    initializeGemini(apiKey) {
        try {
            this.geminiClient = new GoogleGenerativeAI(apiKey);
            this.geminiModel = this.geminiClient.getGenerativeModel({
                model: this.providerConfigs.gemini.model
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize Gemini:', error);
            return false;
        }
    }

    initializeOllama() {
        try {
            this.ollamaClient = new Ollama({
                host: this.providerConfigs.ollama.baseUrl
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize Ollama:', error);
            return false;
        }
    }

    setProvider(provider, config = {}) {
        if (typeof provider !== 'string') {
            console.error('Invalid provider format:', provider);
            return false;
        }

        if (provider === 'ollama') {
            this.provider = 'ollama';
            if (config.model) this.providerConfigs.ollama.model = config.model;
            if (config.baseUrl) {
                this.providerConfigs.ollama.baseUrl = config.baseUrl;
                this.initializeOllama();
                this.lastOllamaCheck = 0;
                this.checkOllamaAvailability();
            }
        } else if (provider === 'gemini') {
            if (config.apiKey) {
                this.providerConfigs.gemini.apiKey = config.apiKey;
                if (this.initializeGemini(config.apiKey)) {
                    this.provider = 'gemini';
                }
            }
            if (config.model) this.providerConfigs.gemini.model = config.model;
        } else if (provider === 'openai') {
            if (config.apiKey) {
                this.providerConfigs.openai.apiKey = config.apiKey;
                this.provider = 'openai';
            }
            if (config.model) this.providerConfigs.openai.model = config.model;
            if (config.baseUrl) this.providerConfigs.openai.baseUrl = config.baseUrl;
        } else if (provider === 'anthropic') {
            if (config.apiKey) {
                this.providerConfigs.anthropic.apiKey = config.apiKey;
                this.provider = 'anthropic';
            }
            if (config.model) this.providerConfigs.anthropic.model = config.model;
        } else if (provider === 'auto') {
            this.provider = 'auto';
            this.selectBestProvider();
        }

        return { provider: this.provider, config: this.providerConfigs[this.provider] };
    }

    setModel(providerId, modelId) {
        if (!this.providerConfigs[providerId]) {
            throw new Error(`Unknown provider: ${providerId}`);
        }

        // Handle Ollama specialized logic if needed, but for now specific config is fine
        this.providerConfigs[providerId].model = modelId;
        console.log(`Model for ${providerId} set to ${modelId}`);

        // If the provider we're changing is the active one, log it
        if (this.provider === providerId) {
            console.log(`Active provider ${providerId} model updated to ${modelId}`);
        }

        return true;
    }

    setProviderOrder(order) {
        if (Array.isArray(order)) {
            this.providerPriority = order;
            if (this.provider === 'auto') {
                this.selectBestProvider();
            }
        }
        return this.providerPriority;
    }

    setFallbackEnabled(enabled) {
        this.enableFallback = enabled;
        return this.enableFallback;
    }

    getAvailableProviders() {
        return [
            {
                id: 'ollama',
                name: 'Ollama (Local)',
                description: 'Free, private local AI inference',
                tier: 'free',
                configured: this.providerConfigs.ollama.enabled,
                available: this.ollamaAvailable,
                requiresApiKey: false,
                models: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3']
            },
            {
                id: 'gemini',
                name: 'Google Gemini',
                description: 'Fast cloud AI by Google (free tier available)',
                tier: 'freemium',
                configured: !!this.providerConfigs.gemini.apiKey,
                available: !!this.geminiClient,
                requiresApiKey: true,
                models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
            },
            {
                id: 'openai',
                name: 'OpenAI',
                description: 'GPT-4o and GPT-4o-mini models',
                tier: 'paid',
                configured: !!this.providerConfigs.openai.apiKey,
                available: !!this.providerConfigs.openai.apiKey,
                requiresApiKey: true,
                models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo']
            },
            {
                id: 'anthropic',
                name: 'Anthropic Claude',
                description: 'Claude 3 Haiku and Sonnet models',
                tier: 'paid',
                configured: !!this.providerConfigs.anthropic.apiKey,
                available: !!this.providerConfigs.anthropic.apiKey,
                requiresApiKey: true,
                models: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022']
            }
        ];
    }

    async getProviderStatus() {
        // Refresh Ollama status
        await this.checkOllamaAvailability();

        return {
            currentProvider: this.provider,
            ollamaAvailable: this.ollamaAvailable,
            geminiConfigured: !!this.geminiClient && !!this.providerConfigs.gemini.apiKey,
            openaiConfigured: !!this.providerConfigs.openai.apiKey,
            anthropicConfigured: !!this.providerConfigs.anthropic.apiKey,
            fallbackEnabled: this.enableFallback,
            providerPriority: this.providerPriority,
            lastWorkingProvider: this.lastWorkingProvider
        };
    }

    async chat(userMessage) {
        const systemPrompt = this.personaManager.buildSystemPrompt();
        const relevantMemories = this.memoryService.search(userMessage, 3);

        let memoryContext = '';
        if (relevantMemories.length > 0) {
            memoryContext = '\n\nRELEVANT PAST CONVERSATIONS:\n' +
                relevantMemories.map(m => `User: ${m.userMessage}\nYou: ${m.aiResponse}`).join('\n\n');
        }

        const recentContext = this.conversationContext.slice(-this.maxContextMessages);

        // Determine which provider to use
        let activeProvider = this.provider;
        if (activeProvider === 'auto' || activeProvider === 'none') {
            // Re-check and select best provider
            await this.checkOllamaAvailability();
            this.selectBestProvider();
            activeProvider = this.provider;
        }

        // Build list of providers to try
        const providersToTry = this.enableFallback
            ? this.getProvidersToTry(activeProvider)
            : [activeProvider];

        let lastError = null;
        let usedFallback = false;

        for (const providerId of providersToTry) {
            try {
                console.log(`[AIService] Attempting chat with provider: ${providerId}`);
                const response = await this.chatWithProvider(
                    providerId,
                    systemPrompt + memoryContext,
                    recentContext,
                    userMessage
                );

                // Success! Update context and memory
                this.conversationContext.push(
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: response }
                );

                if (this.conversationContext.length > this.maxContextMessages * 2) {
                    this.conversationContext = this.conversationContext.slice(-this.maxContextMessages);
                }

                await this.memoryService.addEntry({
                    type: 'conversation',
                    userMessage,
                    aiResponse: response,
                    persona: this.personaManager.getActivePersona().id,
                    mood: this.personaManager.personalityCore.getState().mood,
                    provider: providerId
                });

                this.lastWorkingProvider = providerId;

                return {
                    success: true,
                    response,
                    provider: providerId,
                    persona: this.personaManager.getActivePersona().name,
                    fallback: usedFallback
                };
            } catch (error) {
                console.error(`Provider ${providerId} failed:`, error.message);
                lastError = error;
                usedFallback = true;
            }
        }

        // All providers failed
        return {
            success: false,
            error: this.getHelpfulErrorMessage(lastError),
            details: lastError?.message,
            details: lastError?.message,
            triedProviders: providersToTry,
            configStatus: {
                geminiKey: !!this.providerConfigs.gemini.apiKey ? 'Set' : 'Missing',
                geminiClient: !!this.geminiClient ? 'Ready' : 'Not Init'
            }
        };
    }

    getProvidersToTry(primaryProvider) {
        const providers = [primaryProvider];

        for (const providerId of this.providerPriority) {
            if (providerId !== primaryProvider && this.isProviderConfigured(providerId)) {
                if (providerId === 'ollama' && !this.ollamaAvailable) {
                    continue;
                }
                providers.push(providerId);
            }
        }

        return providers;
    }

    getHelpfulErrorMessage(error) {
        const errorMsg = error?.message?.toLowerCase() || '';

        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('econnrefused')) {
            return 'Connection failed. Please check your internet connection or if Ollama is running.';
        }
        if (errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('401') || errorMsg.includes('permission denied')) {
            return 'Invalid API key or unauthorized access. Please check your API key in Settings.';
        }
        if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
            return 'Rate limit reached. Please wait a moment or switch to a different provider.';
        }
        if (errorMsg.includes('model') || errorMsg.includes('404')) {
            return 'Model not found. Please check your model configuration.';
        }

        return 'All AI providers failed. Please check your configuration in Settings.';
    }

    async chatWithProvider(providerId, systemPrompt, context, userMessage) {
        switch (providerId) {
            case 'ollama':
                return this.chatWithOllama(systemPrompt, context, userMessage);
            case 'gemini':
                return this.chatWithGemini(systemPrompt, context, userMessage);
            case 'openai':
                return this.chatWithOpenAI(systemPrompt, context, userMessage);
            case 'anthropic':
                return this.chatWithAnthropic(systemPrompt, context, userMessage);
            default:
                throw new Error(`Unknown provider: ${providerId}`);
        }
    }

    async chatWithOllama(systemPrompt, context, userMessage) {
        if (!this.ollamaClient) {
            this.initializeOllama();
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...context,
            { role: 'user', content: userMessage }
        ];

        const response = await this.ollamaClient.chat({
            model: this.providerConfigs.ollama.model,
            messages,
            options: {
                temperature: 0.8,
                top_p: 0.9,
                num_predict: 500
            }
        });

        return response.message.content;
    }

    async chatWithGemini(systemPrompt, context, userMessage) {
        if (!this.geminiModel) {
            throw new Error('Gemini not initialized. Please set API key.');
        }

        const chat = this.geminiModel.startChat({
            history: context.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })),
            generationConfig: {
                temperature: 0.8,
                topP: 0.9,
                maxOutputTokens: 500
            }
        });

        const fullPrompt = context.length === 0
            ? `${systemPrompt}\n\nUser: ${userMessage}`
            : userMessage;

        const result = await chat.sendMessage(fullPrompt);
        return result.response.text();
    }

    async chatWithOpenAI(systemPrompt, context, userMessage) {
        const apiKey = this.providerConfigs.openai.apiKey;
        if (!apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...context,
            { role: 'user', content: userMessage }
        ];

        const response = await fetch(`${this.providerConfigs.openai.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: this.providerConfigs.openai.model,
                messages,
                temperature: 0.8,
                max_tokens: 500,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async chatWithAnthropic(systemPrompt, context, userMessage) {
        const apiKey = this.providerConfigs.anthropic.apiKey;
        if (!apiKey) {
            throw new Error('Anthropic API key not configured');
        }

        // Convert context to Anthropic format
        const messages = context.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));
        messages.push({ role: 'user', content: userMessage });

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.providerConfigs.anthropic.model,
                max_tokens: 500,
                system: systemPrompt,
                messages
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async streamChat(userMessage, onChunk) {
        const systemPrompt = this.personaManager.buildSystemPrompt();
        const recentContext = this.conversationContext.slice(-this.maxContextMessages);

        // Currently only supports Gemini and Ollama streaming
        try {
            if (this.provider === 'gemini' && this.geminiModel) {
                const chat = this.geminiModel.startChat({
                    history: recentContext.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    }))
                });

                const result = await chat.sendMessageStream(userMessage);
                let fullResponse = '';

                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    fullResponse += text;
                    onChunk(text);
                }

                return fullResponse;
            } else if ((this.provider === 'ollama' || this.provider === 'auto') && this.ollamaAvailable) {
                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...recentContext,
                    { role: 'user', content: userMessage }
                ];

                const stream = await this.ollamaClient.chat({
                    model: this.providerConfigs.ollama.model,
                    messages,
                    stream: true
                });

                let fullResponse = '';
                for await (const chunk of stream) {
                    const text = chunk.message.content;
                    fullResponse += text;
                    onChunk(text);
                }

                return fullResponse;
            } else {
                // Fallback to non-streaming for other providers
                const result = await this.chat(userMessage);
                if (result.success) {
                    onChunk(result.response);
                    return result.response;
                }
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Stream chat error:', error);
            throw error;
        }
    }

    clearContext() {
        this.conversationContext = [];
    }

    async getAvailableModels() {
        const models = [];

        try {
            // Get Ollama models if available
            if (this.ollamaAvailable && this.ollamaClient) {
                const ollamaModels = await this.ollamaClient.list();
                models.push(...ollamaModels.models.map(m => ({
                    id: m.name,
                    name: m.name,
                    provider: 'ollama',
                    size: m.size
                })));
            }
        } catch (error) {
            console.error('Failed to get Ollama models:', error);
        }

        // Add static model lists for API providers
        if (this.providerConfigs.gemini.apiKey) {
            models.push(
                { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', provider: 'gemini' },
                { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', provider: 'gemini' },
                { id: 'gemini-pro', name: 'Gemini Pro (Legacy)', provider: 'gemini' }
            );
        }

        if (this.providerConfigs.openai.apiKey) {
            models.push(
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
                { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' }
            );
        }

        if (this.providerConfigs.anthropic.apiKey) {
            models.push(
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' },
                { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' }
            );
        }

        return models;
    }
}
