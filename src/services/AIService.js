import Ollama from 'ollama';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pluginManager } from './PluginManager.js';
import { visionManager } from './VisionEmotionManager.js';

/**
 * Enhanced AIService with:
 * - Automatic provider fallback with retry logic
 * - Rate limiting protection
 * - Response caching for repeated queries
 * - Connection health monitoring
 * - Graceful degradation
 * - Enhanced streaming support
 */
export class AIService {
    constructor(personaManager, memoryService) {
        this.personaManager = personaManager;
        this.memoryService = memoryService;
        this.provider = 'auto';

        // Initialize plugins
        pluginManager.initialize().catch(console.error);

        this.ollamaClient = null;
        this.geminiClient = null;
        this.geminiModel = null;
        this.conversationContext = [];
        this.maxContextMessages = 20;

        // Provider availability tracking
        this.webllmAvailable = false;
        this.ollamaAvailable = false;
        this.lastOllamaCheck = 0;
        this.ollamaCheckInterval = 30000;

        // Fallback settings
        this.enableFallback = true;
        this.lastWorkingProvider = null;
        this.providerPriority = ['gemini', 'ollama', 'openai', 'anthropic'];

        // Gemini model fallback order (when quota exceeded)
        this.geminiModelFallback = [
            'gemini-1.5-flash',     // Primary - stable, higher limits
            'gemini-2.0-flash',     // Secondary - experimental
            'gemini-1.5-pro'        // Last resort
        ];
        this.currentGeminiModel = 0; // Index into fallback array

        // Enhanced: Retry configuration with exponential backoff
        this.maxRetries = 2;
        this.baseRetryDelay = 2000; // ms
        this.maxRetryDelay = 30000; // ms (30 seconds max)

        // Exponential backoff state
        this.backoffState = {
            gemini: { consecutiveFailures: 0, nextAllowedTime: 0 },
            openai: { consecutiveFailures: 0, nextAllowedTime: 0 },
            anthropic: { consecutiveFailures: 0, nextAllowedTime: 0 },
            ollama: { consecutiveFailures: 0, nextAllowedTime: 0 }
        };

        // Gemini Free Tier Limits (Requests Per Minute)
        this.geminiModelLimits = {
            'gemini-1.5-flash': 15,
            'gemini-2.0-flash': 10, // Lower limit for experimental
            'gemini-1.5-flash-8b': 15,
            'gemini-1.5-pro': 2    // Very strict limit for Pro
        };

        // Enhanced: Rate limiting (Gemini free tier = 15 RPM)
        this.rateLimits = {
            gemini: { requests: 0, resetTime: 0, maxPerMinute: 12, lastRequest: 0 },
            openai: { requests: 0, resetTime: 0, maxPerMinute: 50, lastRequest: 0 },
            anthropic: { requests: 0, resetTime: 0, maxPerMinute: 50, lastRequest: 0 },
            ollama: { requests: 0, resetTime: 0, maxPerMinute: 999, lastRequest: 0 }
        };

        // Minimum delay between requests (ms) to prevent rate limiting
        this.minRequestDelay = {
            gemini: 4000,  // 4 seconds = max 15 per minute
            openai: 500,
            anthropic: 500,
            ollama: 0
        };

        // Request queue for when rate limited
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.maxQueueSize = 10;

        // Enhanced: Response cache (for repeated queries)
        this.responseCache = new Map();
        this.cacheMaxSize = 100;
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes

        // Enhanced: Health monitoring
        this.providerHealth = {
            gemini: { failures: 0, lastSuccess: null, lastError: null },
            ollama: { failures: 0, lastSuccess: null, lastError: null },
            openai: { failures: 0, lastSuccess: null, lastError: null },
            anthropic: { failures: 0, lastSuccess: null, lastError: null }
        };

        // Enhanced: Request timeout
        this.requestTimeout = 30000; // 30 seconds

        this.providerConfigs = {
            webllm: {
                model: 'Llama-3.2-3B-Instruct',
                enabled: false
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
                model: 'claude-3-5-sonnet-latest',
                apiKey: '',
                enabled: true
            },
            custom: {
                name: 'Custom / OpenRouter',
                model: 'deepseek/deepseek-r1',
                apiKey: '',
                baseUrl: 'https://openrouter.ai/api/v1',
                enabled: true
            }
        };
    }

    async initialize() {
        console.log('[AIService] Starting initialization...');

        this.loadEnvironmentConfig();
        await this.initializeProviders();

        // Start health check interval
        this.startHealthMonitoring();

        // Initialize custom if configured
        if (this.providerConfigs.custom.apiKey) {
            console.log('[AIService] Custom provider configured');
        }

        console.log('[AIService] Initialization complete.');
        console.log('[AIService] Current Provider:', this.provider);
        console.log('[AIService] Available providers:', this.getAvailableProvidersList());
    }

    /**
     * Load API keys and configuration from environment variables
     */
    loadEnvironmentConfig() {
        if (process.env.GEMINI_API_KEY) {
            this.providerConfigs.gemini.apiKey = process.env.GEMINI_API_KEY;
            console.log('[AIService] ✓ Gemini API key loaded');
        }

        if (process.env.OPENAI_API_KEY) {
            this.providerConfigs.openai.apiKey = process.env.OPENAI_API_KEY;
            console.log('[AIService] ✓ OpenAI API key loaded');
        }

        if (process.env.ANTHROPIC_API_KEY) {
            this.providerConfigs.anthropic.apiKey = process.env.ANTHROPIC_API_KEY;
            console.log('[AIService] ✓ Anthropic API key loaded');
        }

        if (process.env.CUSTOM_API_KEY) {
            this.providerConfigs.custom.apiKey = process.env.CUSTOM_API_KEY;
        }
        if (process.env.CUSTOM_BASE_URL) {
            this.providerConfigs.custom.baseUrl = process.env.CUSTOM_BASE_URL;
        }
        if (process.env.CUSTOM_MODEL) {
            this.providerConfigs.custom.model = process.env.CUSTOM_MODEL;
        }

        if (process.env.OLLAMA_URL) {
            this.providerConfigs.ollama.baseUrl = process.env.OLLAMA_URL;
        }

        // Optional: Custom model overrides
        if (process.env.GEMINI_MODEL) {
            this.providerConfigs.gemini.model = process.env.GEMINI_MODEL;
        }
        if (process.env.OPENAI_MODEL) {
            this.providerConfigs.openai.model = process.env.OPENAI_MODEL;
        }
    }

    async initializeProviders() {
        try {
            // Check Ollama availability
            this.ollamaAvailable = await this.checkOllamaAvailability();
            if (this.ollamaAvailable) {
                this.initializeOllama();
                console.log('[AIService] ✓ Ollama available');
            }

            // Initialize Gemini
            if (this.providerConfigs.gemini.apiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(this.providerConfigs.gemini.apiKey);
                    this.geminiModel = genAI.getGenerativeModel({
                        model: this.providerConfigs.gemini.model,
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                        ]
                    });
                    console.log('[AIService] ✓ Gemini initialized');
                } catch (e) {
                    console.warn('[AIService] Failed to initialize Gemini:', e.message);
                }
            }

            await this.loadSavedConfig();
            this.selectBestProvider();
        } catch (error) {
            console.error('[AIService] Provider initialization failed:', error);
        }
    }

    initializeOllama() {
        if (!this.ollamaClient) {
            this.ollamaClient = new Ollama({
                host: this.providerConfigs.ollama.baseUrl
            });
            console.log('[AIService] Ollama client initialized');
        }
    }

    /**
     * Start periodic health monitoring of providers
     */
    startHealthMonitoring() {
        setInterval(async () => {
            // Re-check Ollama availability periodically
            if (this.providerConfigs.ollama.enabled) {
                const wasAvailable = this.ollamaAvailable;
                this.ollamaAvailable = await this.checkOllamaAvailability();

                if (!wasAvailable && this.ollamaAvailable) {
                    console.log('[AIService] Ollama reconnected');
                    this.initializeOllama();
                }
            }

            // Reset rate limit counters every minute
            const now = Date.now();
            for (const [provider, limits] of Object.entries(this.rateLimits)) {
                if (now > limits.resetTime) {
                    limits.requests = 0;
                    limits.resetTime = now + 60000;
                }
            }

            // Clean expired cache entries
            this.cleanCache();
        }, 30000);
    }

    async checkOllamaAvailability() {
        const now = Date.now();

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

        // Prefer last working provider if healthy
        if (this.lastWorkingProvider && this.isProviderHealthy(this.lastWorkingProvider)) {
            this.provider = this.lastWorkingProvider;
            console.log(`[AIService] Using last working provider: ${this.provider}`);
            return;
        }

        for (const providerId of this.providerPriority) {
            if (this.isProviderConfigured(providerId) && this.isProviderHealthy(providerId)) {
                if (providerId === 'ollama' && !this.ollamaAvailable) continue;

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
                return false; // Disabled
            case 'ollama':
                return true;
            case 'gemini':
            case 'openai':
            case 'anthropic':
                return !!config.apiKey;
            default:
                return false;
        }
    }

    isProviderHealthy(providerId) {
        const health = this.providerHealth[providerId];
        if (!health) return true;

        // Consider unhealthy if 3+ consecutive failures
        if (health.failures >= 3) {
            // But allow retry after 5 minutes
            if (health.lastError && Date.now() - health.lastError > 5 * 60 * 1000) {
                health.failures = 0; // Reset
                return true;
            }
            return false;
        }
        return true;
    }

    /**
     * Check if we're rate limited for a provider
     */
    isRateLimited(providerId) {
        const limits = this.rateLimits[providerId];
        if (!limits) return false;

        const now = Date.now();
        if (now > limits.resetTime) {
            limits.requests = 0;
            limits.resetTime = now + 60000;
        }

        return limits.requests >= limits.maxPerMinute;
    }

    /**
     * Increment rate limit counter and record last request time
     */
    incrementRateLimit(providerId) {
        const limits = this.rateLimits[providerId];
        if (limits) {
            limits.requests++;
            limits.lastRequest = Date.now();
        }
    }

    /**
     * Wait if needed before making a request to avoid rate limiting
     */
    async waitForRateLimit(providerId) {
        const minDelay = this.minRequestDelay[providerId] || 0;
        if (minDelay <= 0) return;

        const limits = this.rateLimits[providerId];
        if (!limits) return;

        const now = Date.now();
        const timeSinceLastRequest = now - (limits.lastRequest || 0);

        if (timeSinceLastRequest < minDelay) {
            const waitTime = minDelay - timeSinceLastRequest;
            console.log(`[AIService] Rate limit: waiting ${waitTime}ms before ${providerId} request`);
            await this.sleep(waitTime);
        }
    }

    /**
     * Check if provider is in backoff period (due to 429 errors)
     */
    isInBackoff(providerId) {
        const state = this.backoffState[providerId];
        if (!state) return false;
        return Date.now() < state.nextAllowedTime;
    }

    /**
     * Get remaining backoff time in ms
     */
    getBackoffRemaining(providerId) {
        const state = this.backoffState[providerId];
        if (!state) return 0;
        return Math.max(0, state.nextAllowedTime - Date.now());
    }

    /**
     * Handle rate limit error with exponential backoff
     */
    handleRateLimitError(providerId, retryAfterMs = null) {
        const state = this.backoffState[providerId];
        if (!state) return;

        state.consecutiveFailures++;

        // Calculate backoff: 2^failures * baseDelay, capped at maxRetryDelay
        const backoffMs = retryAfterMs || Math.min(
            this.baseRetryDelay * Math.pow(2, state.consecutiveFailures),
            this.maxRetryDelay
        );

        state.nextAllowedTime = Date.now() + backoffMs;

        console.log(`[AIService] ${providerId} rate limited. Backoff for ${backoffMs}ms (failures: ${state.consecutiveFailures})`);

        // Try next Gemini model if available
        if (providerId === 'gemini' && state.consecutiveFailures >= 2) {
            this.tryNextGeminiModel();
        }
    }

    /**
     * Reset backoff state on successful request
     */
    resetBackoff(providerId) {
        const state = this.backoffState[providerId];
        if (state) {
            state.consecutiveFailures = 0;
            state.nextAllowedTime = 0;
        }
    }

    /**
     * Try the next Gemini model in fallback order
     */
    tryNextGeminiModel() {
        if (this.currentGeminiModel < this.geminiModelFallback.length - 1) {
            this.currentGeminiModel++;
            const newModel = this.geminiModelFallback[this.currentGeminiModel];
            this.providerConfigs.gemini.model = newModel;
            this.geminiModel = null; // Force reinitialization
            console.log(`[AIService] Switching to fallback Gemini model: ${newModel}`);
        }
    }

    /**
     * Reset Gemini model to primary (call after quota reset)
     */
    resetGeminiModel() {
        this.currentGeminiModel = 0;
        this.providerConfigs.gemini.model = this.geminiModelFallback[0];
        this.geminiModel = null;
        console.log('[AIService] Reset to primary Gemini model');
    }

    async loadSavedConfig() {
        try {
            console.log('[AIService] Loading saved configuration...');
            const prefs = await this.memoryService.getUserPreferences();

            if (!prefs) return;

            // 1. Load API Keys first (overrides env vars if present)
            if (prefs.apiKeys) {
                if (prefs.apiKeys.gemini) this.providerConfigs.gemini.apiKey = prefs.apiKeys.gemini;
                if (prefs.apiKeys.openai) this.providerConfigs.openai.apiKey = prefs.apiKeys.openai;
                if (prefs.apiKeys.anthropic) this.providerConfigs.anthropic.apiKey = prefs.apiKeys.anthropic;
                if (prefs.apiKeys.custom) this.providerConfigs.custom.apiKey = prefs.apiKeys.custom;
                if (prefs.apiKeys.elevenlabs) process.env.ELEVENLABS_API_KEY = prefs.apiKeys.elevenlabs;
            }

            // 2. Load Model Selections
            if (prefs.geminiModel) this.setModel('gemini', prefs.geminiModel);
            if (prefs.openaiModel) this.providerConfigs.openai.model = prefs.openaiModel;
            if (prefs.anthropicModel) this.providerConfigs.anthropic.model = prefs.anthropicModel;

            // Load Custom Config
            if (prefs.customConfig) {
                this.providerConfigs.custom.baseUrl = prefs.customConfig.baseUrl || this.providerConfigs.custom.baseUrl;
                this.providerConfigs.custom.model = prefs.customConfig.model || this.providerConfigs.custom.model;
                this.providerConfigs.custom.name = prefs.customConfig.name || this.providerConfigs.custom.name;
            }

            // 3. Load general settings
            if (prefs.aiProvider) {
                this.provider = prefs.aiProvider;
                if (this.provider !== 'auto' && this.provider !== 'none') {
                    this.lastWorkingProvider = this.provider;
                }
            }

            if (prefs.enableFallback !== undefined) {
                this.enableFallback = prefs.enableFallback;
            }

            console.log('[AIService] Configuration loaded from memory');
        } catch (error) {
            console.warn('[AIService] Failed to load config:', error);
        }
    }

    /**
     * Generate cache key for a message
     */
    getCacheKey(userMessage, providerId) {
        return `${providerId}:${userMessage.toLowerCase().trim().substring(0, 100)}`;
    }

    /**
     * Get cached response if available and not expired
     */
    getCachedResponse(userMessage, providerId) {
        const key = this.getCacheKey(userMessage, providerId);
        const cached = this.responseCache.get(key);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            console.log('[AIService] Cache hit');
            return cached.response;
        }
        return null;
    }

    /**
     * Cache a response
     */
    cacheResponse(userMessage, providerId, response) {
        const key = this.getCacheKey(userMessage, providerId);

        // Enforce max cache size
        if (this.responseCache.size >= this.cacheMaxSize) {
            const oldestKey = this.responseCache.keys().next().value;
            this.responseCache.delete(oldestKey);
        }

        this.responseCache.set(key, {
            response,
            timestamp: Date.now()
        });
    }

    /**
     * Clean expired cache entries
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.responseCache.entries()) {
            if (now - value.timestamp > this.cacheTTL) {
                this.responseCache.delete(key);
            }
        }
    }

    /**
     * Main chat interface with enhanced error handling and fallback
     */
    async chat(userMessage) {
        try {
            // Process queue if needed
            if (!this.requestQueue) this.requestQueue = []; // Safety check

            // Check queue size
            if (this.requestQueue.length >= this.maxQueueSize) {
                throw new Error('Request queue full. Please wait.');
            }

            // Inject Visual Context if available
            const visualContext = visionManager.getVisualContext();
            if (visualContext) {
                userMessage = `${visualContext}\n\n${userMessage}`;
                // We don't log the augmented message to keep logs clean, 
                // but we might want to see it in debugging
                // console.log('[AIService] Vision context injected');
            }

            // Ensure provider is selected
            if (!this.provider || this.provider === 'none' || this.provider === 'auto') {
                this.selectBestProvider();
            }

            if (this.provider === 'none') {
                return this.generateOfflineResponse(userMessage);
            }

            // Check cache first (for simple repeated queries)
            const cached = this.getCachedResponse(userMessage, this.provider);
            if (cached && userMessage.length < 50) { // Only cache short queries
                return { success: true, response: cached, fromCache: true };
            }

            // Check rate limiting
            if (this.isRateLimited(this.provider)) {
                console.warn(`[AIService] Rate limited on ${this.provider}, trying fallback`);
                return await this.chatWithFallback(userMessage);
            }

            const systemPrompt = this.personaManager.buildSystemPrompt();
            const recentContext = this.conversationContext.slice(-this.maxContextMessages);

            // Try with retries
            let lastError = null;
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    const responseText = await this.chatWithTimeout(
                        this.provider,
                        systemPrompt,
                        recentContext,
                        userMessage
                    );

                    // Success - update context and health
                    this.conversationContext.push({ role: 'user', content: userMessage });
                    this.conversationContext.push({ role: 'assistant', content: responseText });

                    if (this.conversationContext.length > this.maxContextMessages * 2) {
                        this.conversationContext = this.conversationContext.slice(-this.maxContextMessages * 2);
                    }

                    this.recordSuccess(this.provider);
                    this.incrementRateLimit(this.provider);
                    this.cacheResponse(userMessage, this.provider, responseText);

                    return {
                        success: true,
                        response: responseText,
                        provider: this.provider,
                        attempt
                    };
                } catch (error) {
                    lastError = error;
                    console.warn(`[AIService] Attempt ${attempt}/${this.maxRetries} failed:`, error.message);

                    if (attempt < this.maxRetries) {
                        await this.sleep(this.retryDelay * attempt);
                    }
                }
            }

            // All retries failed - record failure and try fallback
            this.recordFailure(this.provider, lastError);

            if (this.enableFallback) {
                return await this.chatWithFallback(userMessage, this.provider);
            }

            return { success: false, error: lastError.message };
        } catch (error) {
            console.error('[AIService] Chat failed:', error);
            return this.generateOfflineResponse(userMessage);
        }
    }

    /**
     * Chat with timeout wrapper
     */
    async chatWithTimeout(providerId, systemPrompt, context, userMessage) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Request timeout after ${this.requestTimeout}ms`));
            }, this.requestTimeout);

            try {
                const result = await this.chatWithProvider(providerId, systemPrompt, context, userMessage);
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Try alternative providers when primary fails
     */
    async chatWithFallback(userMessage, excludeProvider = null) {
        console.log('[AIService] Attempting fallback...');

        for (const providerId of this.providerPriority) {
            if (providerId === excludeProvider) continue;
            if (!this.isProviderConfigured(providerId)) continue;
            if (!this.isProviderHealthy(providerId)) continue;
            if (providerId === 'ollama' && !this.ollamaAvailable) continue;
            if (this.isRateLimited(providerId)) continue;

            console.log(`[AIService] Trying fallback provider: ${providerId}`);

            try {
                const systemPrompt = this.personaManager.buildSystemPrompt();
                const recentContext = this.conversationContext.slice(-this.maxContextMessages);

                const responseText = await this.chatWithTimeout(
                    providerId,
                    systemPrompt,
                    recentContext,
                    userMessage
                );

                // Success - update state
                this.lastWorkingProvider = providerId;
                this.conversationContext.push({ role: 'user', content: userMessage });
                this.conversationContext.push({ role: 'assistant', content: responseText });
                this.recordSuccess(providerId);
                this.incrementRateLimit(providerId);

                return {
                    success: true,
                    response: responseText,
                    provider: providerId,
                    fallback: true
                };
            } catch (error) {
                console.warn(`[AIService] Fallback to ${providerId} failed:`, error.message);
                this.recordFailure(providerId, error);
            }
        }

        // All providers failed
        return this.generateOfflineResponse(userMessage);
    }

    /**
     * Generate a friendly offline response when no AI is available
     */
    generateOfflineResponse(userMessage) {
        const responses = [
            "I'm having trouble connecting right now, but I'm still here for you! 💕 Try again in a moment?",
            "Oops! My brain is taking a short break. Give me a sec and try again! 🌸",
            "Connection hiccup! But don't worry, I'll be right back. Try again soon? ✨",
            "I'm feeling a bit sleepy right now... Let me wake up and try again! 😴",
            "Technical difficulties! But I'm still thinking of you. Try again in a moment! 💖"
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        return {
            success: false,
            response,
            offline: true,
            error: 'No AI provider available'
        };
    }

    recordSuccess(providerId) {
        const health = this.providerHealth[providerId];
        if (health) {
            health.failures = 0;
            health.lastSuccess = Date.now();
        }
    }

    recordFailure(providerId, error) {
        const health = this.providerHealth[providerId];
        if (health) {
            health.failures++;
            health.lastError = Date.now();
            console.warn(`[AIService] ${providerId} failures: ${health.failures}`);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async chatWithProvider(providerId, systemPrompt, context, userMessage) {
        switch (providerId) {
            case 'webllm':
                throw new Error("WebLLM is not supported in Desktop. Use Ollama instead.");
            case 'ollama':
                return this.chatWithOllama(systemPrompt, context, userMessage);
            case 'gemini':
                return this.chatWithGemini(systemPrompt, context, userMessage);
            case 'openai':
                return this.chatWithOpenAI(systemPrompt, context, userMessage);
            case 'anthropic':
                return this.chatWithAnthropic(systemPrompt, context, userMessage);
            case 'custom':
                return this.chatWithCustom(systemPrompt, context, userMessage);
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
                temperature: 0.85,
                top_p: 0.9,
                num_predict: 500,
                repeat_penalty: 1.1
            }
        });

        return response.message.content;
    }

    async chatWithGemini(systemPrompt, context, userMessage) {
        // Check if we're in backoff period from previous 429 errors
        if (this.isInBackoff('gemini')) {
            const remaining = this.getBackoffRemaining('gemini');
            console.log(`[AIService] Gemini in backoff, ${Math.ceil(remaining / 1000)}s remaining`);
            throw new Error(`Gemini rate limited. Retry in ${Math.ceil(remaining / 1000)} seconds.`);
        }

        // Enforce rate limiting - wait if needed
        await this.waitForRateLimit('gemini');

        if (!this.geminiModel) {
            // Try to reinitialize
            if (this.providerConfigs.gemini.apiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(this.providerConfigs.gemini.apiKey);
                    // Use the current fallback model
                    const modelName = this.geminiModelFallback[this.currentGeminiModel] || 'gemini-2.0-flash';
                    this.geminiModel = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: systemPrompt
                    });
                    console.log('[AIService] Gemini model initialized:', modelName);
                } catch (initError) {
                    console.error('[AIService] Failed to initialize Gemini:', initError);
                    throw new Error(`Gemini initialization failed: ${initError.message}`);
                }
            } else {
                throw new Error('Gemini not initialized. Please set API key.');
            }
        }

        try {
            const chat = this.geminiModel.startChat({
                history: context.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                })),
                generationConfig: {
                    temperature: 0.85,
                    topP: 0.9,
                    maxOutputTokens: 800
                }
            });

            // For first message, include system prompt context
            const fullPrompt = context.length === 0
                ? `${systemPrompt}\n\nUser: ${userMessage}`
                : userMessage;

            const result = await chat.sendMessage(fullPrompt);
            const responseText = result.response.text();

            if (!responseText) {
                throw new Error('Empty response from Gemini');
            }

            // Success - reset backoff
            this.resetBackoff('gemini');
            return responseText;
        } catch (error) {
            console.error('[AIService] Gemini chat error:', error);

            // Detect 429 rate limit errors
            const is429 = error.message?.includes('429') ||
                error.message?.includes('quota') ||
                error.message?.includes('Too Many Requests') ||
                error.message?.includes('RATE_LIMIT') ||
                error.message?.includes('RESOURCE_EXHAUSTED');

            if (is429) {
                // Extract retry-after if available (in seconds)
                const retryMatch = error.message?.match(/retry.*?(\d+)/i);
                const retryAfterMs = retryMatch ? parseInt(retryMatch[1]) * 1000 : null;

                this.handleRateLimitError('gemini', retryAfterMs);
                throw new Error('Gemini quota exceeded. Trying alternative model or fallback provider.');
            }

            // Other error types
            if (error.message?.includes('API_KEY')) {
                throw new Error('Invalid Gemini API key');
            } else if (error.message?.includes('model')) {
                throw new Error(`Gemini model error: ${error.message}`);
            }
            throw error;
        }
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
                temperature: 0.85,
                max_tokens: 800,
                top_p: 0.9,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
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
                max_tokens: 800,
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

    /**
     * Streaming chat with enhanced error handling
     */
    async streamChat(userMessage, onChunk) {
        const systemPrompt = this.personaManager.buildSystemPrompt();
        const recentContext = this.conversationContext.slice(-this.maxContextMessages);

        try {
            let fullResponse = '';

            if (this.provider === 'gemini' && this.geminiModel) {
                const chat = this.geminiModel.startChat({
                    history: recentContext.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    }))
                });

                const fullPrompt = recentContext.length === 0
                    ? `${systemPrompt}\n\nUser: ${userMessage}`
                    : userMessage;

                const result = await chat.sendMessageStream(fullPrompt);

                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    fullResponse += text;
                    onChunk(text);
                }

            } else if ((this.provider === 'ollama' || this.provider === 'auto') && this.ollamaAvailable) {
                if (!this.ollamaClient) this.initializeOllama();

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

                for await (const chunk of stream) {
                    const text = chunk.message.content;
                    fullResponse += text;
                    onChunk(text);
                }

            } else if (this.provider === 'openai' && this.providerConfigs.openai.apiKey) {
                // OpenAI streaming
                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...recentContext,
                    { role: 'user', content: userMessage }
                ];

                const response = await fetch(`${this.providerConfigs.openai.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.providerConfigs.openai.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.providerConfigs.openai.model,
                        messages,
                        stream: true,
                        temperature: 0.85
                    })
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                    for (const line of lines) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                fullResponse += content;
                                onChunk(content);
                            }
                        } catch (e) { }
                    }
                }
            } else {
                // Fallback to non-streaming
                const result = await this.chat(userMessage);
                if (result.success) {
                    onChunk(result.response);
                    fullResponse = result.response;
                } else {
                    throw new Error(result.error);
                }
            }

            // Update context
            this.conversationContext.push({ role: 'user', content: userMessage });
            this.conversationContext.push({ role: 'assistant', content: fullResponse });

            this.recordSuccess(this.provider);
            return fullResponse;

        } catch (error) {
            console.error('[AIService] Stream chat error:', error);
            this.recordFailure(this.provider, error);
            throw error;
        }
    }

    clearContext() {
        this.conversationContext = [];
        console.log('[AIService] Conversation context cleared');
    }

    /**
     * Get a summary of conversation for memory storage
     */
    async summarizeConversation() {
        if (this.conversationContext.length < 4) {
            return null;
        }

        try {
            const summaryPrompt = `Summarize the following conversation in 2-3 sentences, focusing on key topics and emotional tone:\n\n${this.conversationContext.map(m => `${m.role}: ${m.content}`).join('\n')
                }`;

            const result = await this.chat(summaryPrompt);
            return result.success ? result.response : null;
        } catch (e) {
            console.warn('[AIService] Failed to summarize:', e);
            return null;
        }
    }

    getAvailableProviders() {
        return Object.entries(this.providerConfigs)
            .filter(([id]) => id !== 'webllm')
            .map(([id, config]) => {
                let available = false;
                let configured = false;
                const health = this.providerHealth[id];

                if (id === 'ollama') {
                    available = this.ollamaAvailable;
                    configured = true;
                } else {
                    configured = !!config.apiKey;
                    available = configured && this.isProviderHealthy(id);
                }

                return {
                    id,
                    name: this.getProviderName(id),
                    description: this._getProviderDescription(id),
                    configured,
                    available,
                    healthy: this.isProviderHealthy(id),
                    failures: health?.failures || 0,
                    model: config.model,
                    current: this.provider === id
                };
            });
    }

    getProviderName(id) {
        const names = {
            ollama: 'Ollama (Local)',
            gemini: 'Google Gemini',
            openai: 'OpenAI',
            anthropic: 'Anthropic Claude'
        };
        return names[id] || id.charAt(0).toUpperCase() + id.slice(1);
    }

    getAvailableProvidersList() {
        return this.getAvailableProviders()
            .filter(p => p.available)
            .map(p => p.id)
            .join(', ') || 'none';
    }

    _getProviderDescription(id) {
        switch (id) {
            case 'ollama': return 'Free local AI - no internet required';
            case 'gemini': return 'Google\'s fast multimodal AI (Free tier: 1500 req/day)';
            case 'openai': return 'GPT models with advanced reasoning';
            case 'anthropic': return 'Claude - safe and helpful AI assistant';
            default: return 'AI Provider';
        }
    }

    getProviderStatus() {
        return {
            currentProvider: this.provider,
            ollamaAvailable: this.ollamaAvailable,
            fallbackEnabled: this.enableFallback,
            providerPriority: this.providerPriority,
            health: this.providerHealth,
            rateLimits: Object.fromEntries(
                Object.entries(this.rateLimits).map(([k, v]) => [k, { requests: v.requests, max: v.maxPerMinute }])
            ),
            cacheSize: this.responseCache.size,
            contextLength: this.conversationContext.length
        };
    }

    async getAvailableModels() {
        const models = [];

        try {
            if (this.ollamaAvailable && this.ollamaClient) {
                const ollamaModels = await this.ollamaClient.list();
                models.push(...ollamaModels.models.map(m => ({
                    id: m.name,
                    name: m.name,
                    provider: 'ollama',
                    size: m.size,
                    current: this.providerConfigs.ollama.model === m.name
                })));
            }
        } catch (error) {
            console.error('Failed to get Ollama models:', error);
        }

        if (this.providerConfigs.gemini.apiKey) {
            const geminiModels = [
                { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Latest)' },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
                { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B (Fastest)' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
            ];
            models.push(...geminiModels.map(m => ({
                ...m,
                provider: 'gemini',
                current: this.providerConfigs.gemini.model === m.id
            })));
        }

        if (this.providerConfigs.openai.apiKey) {
            const openaiModels = [
                { id: 'gpt-4o', name: 'GPT-4o (Smartest)' },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
                { id: 'o1-preview', name: 'O1 Preview (Reasoning)' },
                { id: 'o1-mini', name: 'O1 Mini (Reasoning)' },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
            ];
            models.push(...openaiModels.map(m => ({
                ...m,
                provider: 'openai',
                current: this.providerConfigs.openai.model === m.id
            })));
        }

        if (this.providerConfigs.anthropic.apiKey) {
            const anthropicModels = [
                { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
                { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
                { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (Powerful)' }
            ];
            models.push(...anthropicModels.map(m => ({
                ...m,
                provider: 'anthropic',
                current: this.providerConfigs.anthropic.model === m.id
            })));
        }

        // Custom Provider
        if (this.providerConfigs.custom.apiKey) {
            models.push({
                id: this.providerConfigs.custom.model,
                name: `${this.providerConfigs.custom.name} (${this.providerConfigs.custom.model})`,
                provider: 'custom',
                current: this.provider === 'custom'
            });
        }

        return models;
    }

    async setProvider(providerId, config = {}) {
        if (!this.providerConfigs[providerId]) {
            throw new Error(`Unknown provider: ${providerId}`);
        }

        if (config.apiKey) {
            this.providerConfigs[providerId].apiKey = config.apiKey;
        }
        if (config.model) {
            this.providerConfigs[providerId].model = config.model;
        }
        if (config.baseUrl) {
            this.providerConfigs[providerId].baseUrl = config.baseUrl;
        }

        if (providerId === 'gemini' && (config.apiKey || this.providerConfigs.gemini.apiKey)) {
            const genAI = new GoogleGenerativeAI(this.providerConfigs.gemini.apiKey);
            this.geminiModel = genAI.getGenerativeModel({ model: this.providerConfigs.gemini.model });
            console.log('[AIService] Gemini reinitialized');
        }

        if (providerId === 'ollama') {
            this.initializeOllama();
            this.ollamaAvailable = await this.checkOllamaAvailability();
        }

        this.provider = providerId;
        this.lastWorkingProvider = providerId;

        // Reset health for this provider
        if (this.providerHealth[providerId]) {
            this.providerHealth[providerId].failures = 0;
        }

        console.log(`[AIService] Provider set to: ${providerId}`);
        return { success: true, provider: providerId };
    }

    setModel(providerId, modelId) {
        if (!this.providerConfigs[providerId]) {
            throw new Error(`Unknown provider: ${providerId}`);
        }

        this.providerConfigs[providerId].model = modelId;

        // Reinitialize if Gemini
        if (providerId === 'gemini' && this.providerConfigs.gemini.apiKey) {
            const genAI = new GoogleGenerativeAI(this.providerConfigs.gemini.apiKey);
            this.geminiModel = genAI.getGenerativeModel({ model: modelId });

            // Auto-tune rate limits
            const limit = this.geminiModelLimits[modelId] || 15;
            // Use safe buffer (allocate 80% of actual limit)
            const safeLimit = Math.max(1, Math.floor(limit * 0.8));

            this.rateLimits.gemini.maxPerMinute = safeLimit;
            // Spacing: 60s / limit
            this.minRequestDelay.gemini = Math.ceil(60000 / safeLimit);

            console.log(`[AIService] Gemini tuned: ${modelId} -> ${safeLimit} RPM (Delay: ${this.minRequestDelay.gemini}ms)`);
        }

        console.log(`[AIService] Model for ${providerId} set to: ${modelId}`);
        return { success: true, provider: providerId, model: modelId };
    }

    setProviderOrder(order) {
        if (!Array.isArray(order)) {
            throw new Error('Provider order must be an array');
        }

        for (const providerId of order) {
            if (!this.providerConfigs[providerId]) {
                throw new Error(`Unknown provider in order: ${providerId}`);
            }
        }

        this.providerPriority = order;
        console.log(`[AIService] Provider priority: ${order.join(' > ')}`);
        return { success: true, order };
    }

    setFallbackEnabled(enabled) {
        this.enableFallback = !!enabled;
        console.log(`[AIService] Fallback ${this.enableFallback ? 'enabled' : 'disabled'}`);
        return { success: true, fallbackEnabled: this.enableFallback };
    }

    /**
     * Force refresh of all provider states
     */
    async refreshProviders() {
        this.lastOllamaCheck = 0;
        this.ollamaAvailable = await this.checkOllamaAvailability();

        if (this.ollamaAvailable && !this.ollamaClient) {
            this.initializeOllama();
        }

        // Reset health
        for (const health of Object.values(this.providerHealth)) {
            health.failures = 0;
        }

        this.selectBestProvider();

        return {
            success: true,
            provider: this.provider,
            available: this.getAvailableProvidersList()
        };
    }

    async chatWithCustom(systemPrompt, context, userMessage) {
        const { apiKey, baseUrl, model } = this.providerConfigs.custom;
        if (!apiKey || !baseUrl) {
            throw new Error('Custom provider not fully configured (API Key or Base URL missing)');
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...context,
            { role: 'user', content: userMessage }
        ];

        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model || 'gpt-3.5-turbo', // Fallback if empty
                    messages,
                    temperature: 0.85,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error?.message || `API Error: ${response.status}`);
                } catch (e) {
                    throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
                }
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
        } catch (error) {
            console.error('[AIService] Custom chat error:', error);
            throw new Error(`Custom provider error: ${error.message}`);
        }
    }

    /**
     * Test a specific provider
     */
    async testProvider(providerId) {
        const testMessage = "Say 'Hello! I'm working!' in 5 words or less.";

        try {
            const systemPrompt = "You are a test assistant. Respond briefly.";
            const response = await this.chatWithTimeout(providerId, systemPrompt, [], testMessage);

            this.recordSuccess(providerId);

            return {
                success: true,
                provider: providerId,
                response: response.substring(0, 100)
            };
        } catch (error) {
            this.recordFailure(providerId, error);

            return {
                success: false,
                provider: providerId,
                error: error.message
            };
        }
    }
}
