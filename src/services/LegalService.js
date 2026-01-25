/**
 * LegalService - Fetch Terms and Privacy Policy from GitHub
 * 
 * Fetches latest legal documents from the repository
 * with caching and fallback support.
 */

const REPO_BASE_URL = 'https://raw.githubusercontent.com/John-Varghese-EH/Nizhal-AI/main';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class LegalService {
    constructor() {
        this.cache = {
            terms: null,
            privacy: null,
            termsTimestamp: 0,
            privacyTimestamp: 0
        };
    }

    /**
     * Fetch Terms of Service
     */
    async getTerms() {
        return this._fetchDocument('terms', `${REPO_BASE_URL}/TERMS.md`);
    }

    /**
     * Fetch Privacy Policy
     */
    async getPrivacyPolicy() {
        return this._fetchDocument('privacy', `${REPO_BASE_URL}/PRIVACY_POLICY.md`);
    }

    /**
     * Fetch and cache a document
     */
    async _fetchDocument(type, url) {
        const cacheKey = type;
        const timestampKey = `${type}Timestamp`;

        // Check cache
        if (this.cache[cacheKey] &&
            Date.now() - this.cache[timestampKey] < CACHE_DURATION) {
            return {
                content: this.cache[cacheKey],
                fromCache: true,
                lastUpdated: new Date(this.cache[timestampKey]).toISOString()
            };
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'text/plain',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const content = await response.text();

            // Update cache
            this.cache[cacheKey] = content;
            this.cache[timestampKey] = Date.now();

            // Also save to localStorage for offline access
            this._saveToLocalStorage(type, content);

            return {
                content,
                fromCache: false,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error(`[LegalService] Failed to fetch ${type}:`, error);

            // Try localStorage fallback
            const cached = this._loadFromLocalStorage(type);
            if (cached) {
                return {
                    content: cached.content,
                    fromCache: true,
                    lastUpdated: cached.timestamp,
                    offline: true
                };
            }

            // Return embedded fallback
            return {
                content: this._getFallbackContent(type),
                fromCache: true,
                lastUpdated: null,
                fallback: true
            };
        }
    }

    /**
     * Save to localStorage for offline access
     */
    _saveToLocalStorage(type, content) {
        try {
            localStorage.setItem(`nizhal_legal_${type}`, JSON.stringify({
                content,
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.warn('[LegalService] localStorage save failed:', e);
        }
    }

    /**
     * Load from localStorage
     */
    _loadFromLocalStorage(type) {
        try {
            const data = localStorage.getItem(`nizhal_legal_${type}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Get fallback content when offline and no cache
     */
    _getFallbackContent(type) {
        if (type === 'terms') {
            return `# Terms of Service

**Nizhal AI - Personal AI Companion**

Please visit our GitHub repository for the complete Terms of Service:
https://github.com/John-Varghese-EH/Nizhal-AI/blob/main/TERMS.md

By using this application, you agree to:
- Use the app responsibly and ethically
- Not use the AI for harmful purposes
- Accept that AI responses may contain errors
- Take responsibility for your data

For the full Terms of Service, please connect to the internet.`;
        }

        return `# Privacy Policy

**Nizhal AI - Personal AI Companion**

Please visit our GitHub repository for the complete Privacy Policy:
https://github.com/John-Varghese-EH/Nizhal-AI/blob/main/PRIVACY_POLICY.md

Key Privacy Points:
- Your data is stored locally on your device
- We do not sell your personal information
- Camera/mic data is processed locally only
- Third-party AI providers have their own policies

For the full Privacy Policy, please connect to the internet.`;
    }

    /**
     * Clear cache (force refresh on next request)
     */
    clearCache() {
        this.cache = {
            terms: null,
            privacy: null,
            termsTimestamp: 0,
            privacyTimestamp: 0
        };
        try {
            localStorage.removeItem('nizhal_legal_terms');
            localStorage.removeItem('nizhal_legal_privacy');
        } catch (e) { }
    }

    /**
     * Get repository URL
     */
    getRepoUrl() {
        return 'https://github.com/John-Varghese-EH/Nizhal-AI';
    }

    /**
     * Get direct links to documents
     */
    getDocumentUrls() {
        return {
            terms: `${this.getRepoUrl()}/blob/main/TERMS.md`,
            privacy: `${this.getRepoUrl()}/blob/main/PRIVACY_POLICY.md`
        };
    }
}

export const legalService = new LegalService();
export default LegalService;
