/**
 * MalayalamDetector.js
 * Detects Malayalam/Kerala language patterns in user input
 * Used for auto-switching to Lachu personality mode
 */

export class MalayalamDetector {
    constructor() {
        // Common Malayalam/Kerala slang keywords
        this.keralaKeywords = [
            'suttumani', 'chakkare', 'mole', 'ente', 'njan', 'ayyo',
            'kali', 'machan', 'poku', 'vaa', 'varum', 'alle',
            'entha', 'vishesham', 'ivukam', 'cheyyunnu', 'tharam',
            'innu', 'koode', 'adipoli', 'kallan', 'bore',
            'machan', 'ividunde', 'kochi', 'kerala', 'mallu',
            'onam', 'vishu', 'sadya', 'appam', 'puttu'
        ];

        // Regex pattern for Malayalam words (case-insensitive)
        this.malayalamPattern = new RegExp(
            this.keralaKeywords.join('|'),
            'i'
        );

        this.detectionThreshold = 0.3; // 30% Malayalam words triggers detection
    }

    /**
     * Detect Malayalam language in text
     * @param {string} text - User input text
     * @returns {Object} Detection result with confidence score
     */
    detectMalayalam(text) {
        if (!text || typeof text !== 'string') {
            return {
                detected: false,
                confidence: 0,
                triggeredWords: []
            };
        }

        const words = text.toLowerCase().split(/\s+/);
        const triggeredWords = [];

        // Find all Malayalam keywords in the text
        words.forEach(word => {
            if (this.keralaKeywords.some(keyword => word.includes(keyword))) {
                triggeredWords.push(word);
            }
        });

        // Calculate confidence based on ratio of Malayalam words
        const totalWords = words.length;
        const malayalamWordCount = triggeredWords.length;
        const confidence = totalWords > 0 ? (malayalamWordCount / totalWords) : 0;

        // Detect if threshold is met
        const detected = confidence >= this.detectionThreshold || malayalamWordCount >= 2;

        return {
            detected,
            confidence: Math.round(confidence * 100),
            triggeredWords,
            malayalamWordCount,
            totalWords
        };
    }

    /**
     * Check if user location suggests Kerala context
     * @param {Object} context - User context object
     * @returns {boolean}
     */
    isKeralaContext(context = {}) {
        if (!context) return false;

        // Check for Kerala-related context hints
        const keralaIndicators = [
            context.location?.toLowerCase().includes('kerala'),
            context.location?.toLowerCase().includes('kochi'),
            context.location?.toLowerCase().includes('cochin'),
            context.location?.toLowerCase().includes('trivandrum'),
            context.location?.toLowerCase().includes('kozhikode'),
            context.timezone === 'Asia/Kolkata', // IST timezone hint
            context.language === 'ml' // Malayalam language code
        ];

        return keralaIndicators.some(indicator => indicator === true);
    }

    /**
     * Determine if Lachu mode should be activated
     * @param {string} text - User input
     * @param {Object} context - User context
     * @returns {boolean}
     */
    shouldActivateLachuMode(text, context = {}) {
        const languageDetection = this.detectMalayalam(text);
        const contextMatch = this.isKeralaContext(context);

        // Activate if Malayalam detected OR Kerala context is present
        return languageDetection.detected || contextMatch;
    }

    /**
     * Get Malayalam mix percentage for response generation
     * @param {number} confidence - Detection confidence (0-100)
     * @returns {number} Percentage of Malayalam to mix (0-100)
     */
    getMalayalamMixPercentage(confidence) {
        if (confidence >= 50) return 70; // High confidence: 70% Malayalam
        if (confidence >= 30) return 50; // Medium confidence: 50% Malayalam
        if (confidence >= 10) return 30; // Low confidence: 30% Malayalam
        return 10; // Minimal Malayalam sprinkle
    }
}

// Export singleton instance
export const malayalamDetector = new MalayalamDetector();
export default malayalamDetector;
