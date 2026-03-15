/**
 * TranslationService.js
 * Real-time translation and multilingual support
 */

export class TranslationService {
    constructor(apiKey = '') {
        this.apiKey = apiKey;
        this.currentLanguage = 'en';
        this.targetLanguage = 'en';
        this.translationCache = new Map();
        this.languageDetectionCache = new Map();
        
        // Translation providers
        this.providers = {
            google: {
                enabled: !!apiKey,
                priority: 1,
                translate: this.translateWithGoogle.bind(this),
                detect: this.detectLanguageWithGoogle.bind(this)
            },
            libretranslate: {
                enabled: true,
                priority: 2,
                translate: this.translateWithLibre.bind(this),
                detect: this.detectLanguageWithLibre.bind(this)
            },
            mymemory: {
                enabled: true,
                priority: 3,
                translate: this.translateWithMyMemory.bind(this),
                detect: null
            },
            local: {
                enabled: true,
                priority: 4,
                translate: this.translateLocally.bind(this),
                detect: this.detectLanguageLocally.bind(this)
            }
        };
        
        // Supported languages
        this.supportedLanguages = {
            'en': { name: 'English', code: 'en', native: 'English' },
            'es': { name: 'Spanish', code: 'es', native: 'Español' },
            'fr': { name: 'French', code: 'fr', native: 'Français' },
            'de': { name: 'German', code: 'de', native: 'Deutsch' },
            'it': { name: 'Italian', code: 'it', native: 'Italiano' },
            'pt': { name: 'Portuguese', code: 'pt', native: 'Português' },
            'ru': { name: 'Russian', code: 'ru', native: 'Русский' },
            'ja': { name: 'Japanese', code: 'ja', native: '日本語' },
            'ko': { name: 'Korean', code: 'ko', native: '한국어' },
            'zh': { name: 'Chinese', code: 'zh', native: '中文' },
            'ar': { name: 'Arabic', code: 'ar', native: 'العربية' },
            'hi': { name: 'Hindi', code: 'hi', native: 'हिन्दी' },
            'th': { name: 'Thai', code: 'th', native: 'ไทย' },
            'vi': { name: 'Vietnamese', code: 'vi', native: 'Tiếng Việt' },
            'nl': { name: 'Dutch', code: 'nl', native: 'Nederlands' },
            'sv': { name: 'Swedish', code: 'sv', native: 'Svenska' },
            'da': { name: 'Danish', code: 'da', native: 'Dansk' },
            'no': { name: 'Norwegian', code: 'no', native: 'Norsk' },
            'fi': { name: 'Finnish', code: 'fi', native: 'Suomi' },
            'pl': { name: 'Polish', code: 'pl', native: 'Polski' },
            'tr': { name: 'Turkish', code: 'tr', native: 'Türkçe' },
            'he': { name: 'Hebrew', code: 'he', native: 'עברית' },
            'cs': { name: 'Czech', code: 'cs', native: 'Čeština' },
            'hu': { name: 'Hungarian', code: 'hu', native: 'Magyar' },
            'ro': { name: 'Romanian', code: 'ro', native: 'Română' },
            'uk': { name: 'Ukrainian', code: 'uk', native: 'Українська' },
            'el': { name: 'Greek', code: 'el', native: 'Ελληνικά' }
        };
        
        // Initialize local translation models
        this.initializeLocalModels();
    }
    
    /**
     * Initialize local translation models
     */
    async initializeLocalModels() {
        try {
            // In production, you'd load actual translation models
            // For now, we'll use basic phrase dictionaries
            this.localDictionaries = {
                'en-es': {
                    'hello': 'hola',
                    'goodbye': 'adiós',
                    'thank you': 'gracias',
                    'please': 'por favor',
                    'yes': 'sí',
                    'no': 'no',
                    'how are you': 'cómo estás',
                    'good morning': 'buenos días',
                    'good night': 'buenas noches'
                },
                'en-fr': {
                    'hello': 'bonjour',
                    'goodbye': 'au revoir',
                    'thank you': 'merci',
                    'please': 's\'il vous plaît',
                    'yes': 'oui',
                    'no': 'non',
                    'how are you': 'comment allez-vous',
                    'good morning': 'bonjour',
                    'good night': 'bonne nuit'
                },
                'en-de': {
                    'hello': 'hallo',
                    'goodbye': 'auf wiedersehen',
                    'thank you': 'danke',
                    'please': 'bitte',
                    'yes': 'ja',
                    'no': 'nein',
                    'how are you': 'wie geht es dir',
                    'good morning': 'guten morgen',
                    'good night': 'gute nacht'
                }
            };
            
            console.log('[TranslationService] ✓ Local translation models initialized');
        } catch (error) {
            console.error('[TranslationService] Failed to initialize local models:', error);
        }
    }
    
    /**
     * Translate text
     */
    async translate(text, targetLanguage = this.targetLanguage, sourceLanguage = 'auto') {
        try {
            // Check cache first
            const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
            if (this.translationCache.has(cacheKey)) {
                const cached = this.translationCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                    return cached.result;
                }
            }
            
            // Detect language if auto
            let detectedLanguage = sourceLanguage;
            if (sourceLanguage === 'auto') {
                detectedLanguage = await this.detectLanguage(text);
            }
            
            // Skip translation if same language
            if (detectedLanguage === targetLanguage) {
                return {
                    text: text,
                    sourceLanguage: detectedLanguage,
                    targetLanguage: targetLanguage,
                    confidence: 1.0,
                    provider: 'none'
                };
            }
            
            // Try providers in priority order
            const providers = Object.entries(this.providers)
                .filter(([_, config]) => config.enabled)
                .sort(([,a], [,b]) => a.priority - b.priority);
            
            let lastError = null;
            
            for (const [providerId, provider] of providers) {
                try {
                    console.log(`[TranslationService] Trying ${providerId} for translation...`);
                    
                    const result = await provider.translate(
                        text,
                        targetLanguage,
                        detectedLanguage
                    );
                    
                    if (result && result.text) {
                        // Cache result
                        this.translationCache.set(cacheKey, {
                            result,
                            timestamp: Date.now()
                        });
                        
                        return {
                            ...result,
                            sourceLanguage: detectedLanguage,
                            targetLanguage: targetLanguage,
                            provider: providerId
                        };
                    }
                } catch (error) {
                    lastError = error;
                    console.warn(`[TranslationService] ${providerId} failed:`, error.message);
                    continue;
                }
            }
            
            throw lastError || new Error('All translation providers failed');
        } catch (error) {
            console.error('[TranslationService] Translation failed:', error);
            return {
                text: text,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                confidence: 0,
                provider: 'error',
                error: error.message
            };
        }
    }
    
    /**
     * Detect language
     */
    async detectLanguage(text) {
        try {
            // Check cache first
            const cacheKey = `detect-${text}`;
            if (this.languageDetectionCache.has(cacheKey)) {
                const cached = this.languageDetectionCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                    return cached.language;
                }
            }
            
            // Try providers with detection capability
            const providers = Object.entries(this.providers)
                .filter(([_, config]) => config.enabled && config.detect)
                .sort(([,a], [,b]) => a.priority - b.priority);
            
            for (const [providerId, provider] of providers) {
                try {
                    const language = await provider.detect(text);
                    if (language) {
                        // Cache result
                        this.languageDetectionCache.set(cacheKey, {
                            language,
                            timestamp: Date.now()
                        });
                        
                        return language;
                    }
                } catch (error) {
                    console.warn(`[TranslationService] ${providerId} detection failed:`, error.message);
                    continue;
                }
            }
            
            // Fallback to simple detection
            return this.detectLanguageLocally(text);
        } catch (error) {
            console.error('[TranslationService] Language detection failed:', error);
            return 'en'; // Default to English
        }
    }
    
    /**
     * Translate with Google Translate API
     */
    async translateWithGoogle(text, targetLanguage, sourceLanguage) {
        if (!this.apiKey) {
            throw new Error('Google Translate API key not provided');
        }
        
        const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
                target: targetLanguage,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Google Translate API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            text: data.data.translations[0].translatedText,
            confidence: 0.95
        };
    }
    
    /**
     * Detect language with Google Translate API
     */
    async detectLanguageWithGoogle(text) {
        if (!this.apiKey) {
            throw new Error('Google Translate API key not provided');
        }
        
        const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text
            })
        });
        
        if (!response.ok) {
            throw new Error(`Google Detect API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.data.detections[0][0].language;
    }
    
    /**
     * Translate with LibreTranslate (free, self-hostable)
     */
    async translateWithLibre(text, targetLanguage, sourceLanguage) {
        const url = 'https://libretranslate.de/translate';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
                target: targetLanguage,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            throw new Error(`LibreTranslate error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            text: data.translatedText,
            confidence: 0.85
        };
    }
    
    /**
     * Detect language with LibreTranslate
     */
    async detectLanguageWithLibre(text) {
        const url = 'https://libretranslate.de/detect';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text
            })
        });
        
        if (!response.ok) {
            throw new Error(`LibreTranslate detect error: ${response.status}`);
        }
        
        const data = await response.json();
        return data[0].language;
    }
    
    /**
     * Translate with MyMemory API (free tier)
     */
    async translateWithMyMemory(text, targetLanguage, sourceLanguage) {
        const langPair = sourceLanguage === 'auto' ? `autodetect|${targetLanguage}` : `${sourceLanguage}|${targetLanguage}`;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`MyMemory error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.responseStatus === 200) {
            return {
                text: data.responseData.translatedText,
                confidence: data.responseData.match / 100
            };
        }
        
        throw new Error('MyMemory translation failed');
    }
    
    /**
     * Translate locally using dictionaries
     */
    async translateLocally(text, targetLanguage, sourceLanguage) {
        const langPair = `${sourceLanguage}-${targetLanguage}`;
        const dictionary = this.localDictionaries[langPair] || this.localDictionaries[`en-${targetLanguage}`];
        
        if (!dictionary) {
            throw new Error(`No local dictionary available for ${langPair}`);
        }
        
        const lowerText = text.toLowerCase().trim();
        const translation = dictionary[lowerText];
        
        if (translation) {
            return {
                text: translation,
                confidence: 0.7
            };
        }
        
        // Try word-by-word translation
        const words = lowerText.split(' ');
        const translatedWords = words.map(word => dictionary[word] || word);
        
        if (translatedWords.some((word, i) => word !== words[i])) {
            return {
                text: translatedWords.join(' '),
                confidence: 0.5
            };
        }
        
        throw new Error('No translation found in local dictionary');
    }
    
    /**
     * Detect language locally (basic implementation)
     */
    detectLanguageLocally(text) {
        const textLower = text.toLowerCase();
        
        // Simple language detection based on common words
        const languagePatterns = {
            'es': ['hola', 'gracias', 'por favor', 'adiós', 'buenos días'],
            'fr': ['bonjour', 'merci', 's\'il vous plaît', 'au revoir', 'bonne nuit'],
            'de': ['hallo', 'danke', 'bitte', 'auf wiedersehen', 'guten morgen'],
            'it': ['ciao', 'grazie', 'per favore', 'arrivederci', 'buongiorno'],
            'pt': ['olá', 'obrigado', 'por favor', 'tchau', 'bom dia'],
            'ru': ['привет', 'спасибо', 'пожалуйста', 'до свидания', 'доброе утро'],
            'ja': ['こんにちは', 'ありがとう', 'お願いします', 'さようなら', 'おはよう'],
            'ko': ['안녕하세요', '감사합니다', '제발', '안녕히 가세요', '좋은 아침'],
            'zh': ['你好', '谢谢', '请', '再见', '早上好'],
            'ar': ['مرحبا', 'شكرا', 'من فضلك', 'وداعا', 'صباح الخير']
        };
        
        let bestMatch = { language: 'en', score: 0 };
        
        for (const [lang, patterns] of Object.entries(languagePatterns)) {
            const score = patterns.reduce((count, pattern) => {
                return count + (textLower.includes(pattern) ? 1 : 0);
            }, 0);
            
            if (score > bestMatch.score) {
                bestMatch = { language: lang, score };
            }
        }
        
        return bestMatch.score > 0 ? bestMatch.language : 'en';
    }
    
    /**
     * Translate conversation in real-time
     */
    async startRealTimeTranslation(sourceLanguage, targetLanguage, onTranslation) {
        console.log(`[TranslationService] Starting real-time translation: ${sourceLanguage} -> ${targetLanguage}`);
        
        // This would integrate with speech recognition and synthesis
        // For now, return a mock implementation
        
        return {
            stop: () => {
                console.log('[TranslationService] Stopped real-time translation');
            },
            isActive: true
        };
    }
    
    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return Object.entries(this.supportedLanguages).map(([code, info]) => ({
            code,
            name: info.name,
            native: info.native
        }));
    }
    
    /**
     * Set target language
     */
    setTargetLanguage(language) {
        if (this.supportedLanguages[language]) {
            this.targetLanguage = language;
            console.log(`[TranslationService] Target language set to: ${language}`);
        } else {
            throw new Error(`Unsupported language: ${language}`);
        }
    }
    
    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * Translate multiple texts (batch)
     */
    async translateBatch(texts, targetLanguage, sourceLanguage = 'auto') {
        const results = [];
        
        for (const text of texts) {
            try {
                const result = await this.translate(text, targetLanguage, sourceLanguage);
                results.push(result);
            } catch (error) {
                results.push({
                    text: text,
                    error: error.message,
                    sourceLanguage: sourceLanguage,
                    targetLanguage: targetLanguage
                });
            }
        }
        
        return results;
    }
    
    /**
     * Clear caches
     */
    clearCaches() {
        this.translationCache.clear();
        this.languageDetectionCache.clear();
        console.log('[TranslationService] Caches cleared');
    }
    
    /**
     * Get translation statistics
     */
    getStats() {
        return {
            translationCacheSize: this.translationCache.size,
            detectionCacheSize: this.languageDetectionCache.size,
            supportedLanguagesCount: Object.keys(this.supportedLanguages).length,
            enabledProviders: Object.entries(this.providers)
                .filter(([_, config]) => config.enabled)
                .map(([id]) => id),
            currentTargetLanguage: this.targetLanguage,
            currentSourceLanguage: this.currentLanguage
        };
    }
}

export default TranslationService;
