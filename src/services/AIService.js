import Ollama from 'ollama';
import { GoogleGenerativeAI } from '@google/generative-ai';
// WebLLMService removed (Browser-only library cannot run in Main Process)
import { pluginManager } from './PluginManager.js';

export class AIService {
    constructor(personaManager, memoryService) {
        this.personaManager = personaManager;
        this.memoryService = memoryService;
        this.provider = 'auto'; // Default to auto-selection

        // Initialize plugins
        pluginManager.initialize().catch(console.error);

        this.ollamaClient = null;
        this.geminiClient = null;
        this.geminiModel = null;
        this.conversationContext = [];
        this.maxContextMessages = 20;

        // Provider availability tracking
        this.webllmAvailable = false; // Disabled in Main
        this.ollamaAvailable = false;
        this.lastOllamaCheck = 0;
        this.ollamaCheckInterval = 30000;

        // Fallback settings
        this.enableFallback = true;
        this.lastWorkingProvider = null;
        this.providerPriority = ['ollama', 'gemini', 'openai', 'anthropic']; // removed webllm

        this.providerConfigs = {
            webllm: {
                model: 'Llama-3.2-3B-Instruct',
                enabled: false // Disabled
            },
            ollama: {
                model: 'llama3.2',
                baseUrl: 'http://localhost:11434',
                enabled: true
            },
            gemini: {
                model: 'gemini-1.5-flash',
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
    }

    async initialize() {
        console.log('[AIService] Starting initialization...');
        await this.initializeProviders();
        console.log('[AIService] Initialization complete.');
        console.log('[AIService] Current Provider:', this.provider);
    }

    async initializeProviders() {
        try {
            // WebLLM skipped (Browser only)

            // Check Ollama availability (Secondary Free Local)
            this.ollamaAvailable = await this.checkOllamaAvailability();

            if (this.ollamaAvailable) {
                this.ollamaClient = new Ollama({
                    host: this.providerConfigs.ollama.baseUrl
                });
                console.log('[AIService] ✓ Ollama (Desktop AI) is available');
            }

            // Load saved config
            await this.loadSavedConfig();

            // Set provider
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
        if (this.provider !== 'auto' && this.isProviderConfigured(this.provider)) {
            return;
        }

        for (const providerId of this.providerPriority) {
            if (this.isProviderConfigured(providerId)) {
                if (providerId === 'ollama' && !this.ollamaAvailable) continue;
                // WebLLM is always "configured" if enabled, availability checks happen at runtime

                this.provider = providerId;
                console.log(`[AIService] Auto-selected provider: ${providerId}`);
                return;
            }
        }

        this.provider = 'none';
        console.warn('[AIService] No AI provider available.');
    }

    isProviderConfigured(providerId) {
        const config = this.providerConfigs[providerId];
        if (!config || !config.enabled) return false;

        switch (providerId) {
            case 'webllm':
                return true;
            case 'ollama':
                return true;
            case 'gemini':
                return !!config.apiKey;
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
            // Try to load from global state
            console.log('[AIService] Loading config...');
            this.provider = 'auto';
        } catch (error) {
            console.warn('[AIService] Failed to load config, using defaults:', error);
        }
    }

    /**
     * Main chat interface called by NizhalAI
     * @param {string} userMessage 
     */
    async chat(userMessage) {
        try {
            // 1. Ensure provider selected
            if (!this.provider || this.provider === 'none') {
                this.selectBestProvider();
            }

            if (this.provider === 'none') {
                return { success: false, error: 'No AI provider available' };
            }

            // 2. Build Context
            const systemPrompt = this.personaManager.buildSystemPrompt();

            // 3. Chat with specific provider
            // Use recent context for memory optimization
            const recentContext = this.conversationContext.slice(-this.maxContextMessages);
            const responseText = await this.chatWithProvider(this.provider, systemPrompt, recentContext, userMessage);

            // 4. Update Context
            this.conversationContext.push({ role: 'user', content: userMessage });
            this.conversationContext.push({ role: 'assistant', content: responseText });

            // Limit context size
            if (this.conversationContext.length > this.maxContextMessages * 2) {
                this.conversationContext = this.conversationContext.slice(-this.maxContextMessages * 2);
            }

            return { success: true, response: responseText };
        } catch (error) {
            console.error('[AIService] Chat failed:', error);

            // Simple fallback logic could go here if needed
            return { success: false, error: error.message };
        }
    }

    async chatWithProvider(providerId, systemPrompt, context, userMessage) {
        switch (providerId) {
            case 'webllm':
                return this.chatWithWebLLM(systemPrompt, context, userMessage);
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

    async chatWithWebLLM(systemPrompt, context, userMessage) {
        throw new Error("WebLLM is not supported in the Desktop backend. Please use Ollama.");
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

    getAvailableProviders() {
        return Object.entries(this.providerConfigs)
            .filter(([id]) => id !== 'webllm') // Filter out browser-only providers
            .map(([id, config]) => {
                let available = false;
                let configured = false;

                if (id === 'ollama') {
                    available = this.ollamaAvailable;
                    configured = true;
                } else {
                    configured = !!config.apiKey;
                    available = configured; // Assume available if configured for cloud providers
                }

                return {
                    id,
                    name: id.charAt(0).toUpperCase() + id.slice(1),
                    description: this._getProviderDescription(id),
                    configured,
                    available,
                    models: [] // Models are fetched separately
                };
            });
    }

    _getProviderDescription(id) {
        switch (id) {
            case 'ollama': return 'Run local LLMs freely (no API key required)';
            case 'gemini': return 'Google\'s multimodal AI models';
            case 'openai': return 'Advanced reasoning models (GPT-4)';
            case 'anthropic': return 'Claude models with large context window';
            default: return 'AI Provider';
        }
    }

    getProviderStatus() {
        return {
            currentProvider: this.provider,
            ollamaAvailable: this.ollamaAvailable,
            fallbackEnabled: this.enableFallback,
            providerPriority: this.providerPriority
        };
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
