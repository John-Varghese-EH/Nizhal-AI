/**
 * HumorEngine.js
 * Advanced humor generation system with user preference adaptation and safety filters
 */

export class HumorEngine {
    constructor() {
        this.humorStyles = {
            witty: {
                name: 'Witty',
                description: 'Clever wordplay and intelligent humor',
                characteristics: ['wordplay', 'puns', 'clever observations', 'intellectual'],
                intensity: 0.7,
                appropriateness: 'high'
            },
            sarcastic: {
                name: 'Sarcastic',
                description: 'Dry humor with ironic undertones',
                characteristics: ['irony', 'understatement', 'dry wit', 'mock seriousness'],
                intensity: 0.8,
                appropriateness: 'medium'
            },
            selfDeprecating: {
                name: 'Self-Deprecating',
                description: 'Humor at my own expense',
                characteristics: ['modesty', 'relatability', 'honesty', 'approachable'],
                intensity: 0.5,
                appropriateness: 'high'
            },
            playful: {
                name: 'Playful',
                description: 'Light-hearted and fun humor',
                characteristics: ['cheerful', 'silly', 'upbeat', 'energetic'],
                intensity: 0.6,
                appropriateness: 'high'
            },
            dadJokes: {
                name: 'Dad Jokes',
                description: 'Classic puns and groan-worthy humor',
                characteristics: ['puns', 'wordplay', 'predictable', 'family-friendly'],
                intensity: 0.4,
                appropriateness: 'high'
            },
            observational: {
                name: 'Observational',
                description: 'Humor based on everyday situations',
                characteristics: ['relatable', 'everyday', 'situational', 'insightful'],
                intensity: 0.6,
                appropriateness: 'high'
            },
            dark: {
                name: 'Dark Humor',
                description: 'Edgy humor with darker themes (use sparingly)',
                characteristics: ['edgy', 'controversial', 'ironic', 'taboo'],
                intensity: 0.9,
                appropriateness: 'low'
            }
        };
        
        // Humor templates and patterns
        this.humorTemplates = {
            puns: [
                "I'm reading a book on anti-gravity. It's impossible to put down!",
                "I used to hate facial hair, but then it grew on me.",
                "I'm glad I know sign language, it's pretty handy.",
                "I told my wife she was drawing her eyebrows too high. She looked surprised.",
                "I used to be a baker, but I couldn't make enough dough.",
                "I'm reading a book about mazes. I got lost in it.",
                "I used to play piano by ear, but now I use my hands."
            ],
            selfDeprecating: [
                "I'm not saying I'm not smart, but my brain cells are playing hide and seek.",
                "I have a black belt in procrastination. I'll tell you about it tomorrow.",
                "My memory is so bad, I could hide my own Easter eggs.",
                "I'm so good at sleeping, I can do it with my eyes closed.",
                "I may not be perfect, but at least I'm not you... wait, that's not self-deprecating.",
                "My favorite exercise is a cross between a lunge and a crunch. I call it lunch.",
                "I'm so awkward, I trip over wireless networks."
            ],
            techHumor: [
                "Why do programmers prefer dark mode? Because light attracts bugs!",
                "I told my computer I needed a break, and it said 'no problem, I'll go to sleep.'",
                "My WiFi and I have a lot in common - we both promise great speeds but deliver disappointment.",
                "I have a joke about UDP, but you might not get it.",
                "Why do Java developers wear glasses? Because they don't C#!",
                "I tried to explain recursion to my friend, but I had to explain recursion to my friend.",
                "My AI assistant is so smart, it finished my sentences... and my job."
            ],
            situational: [
                "Well, this is awkward. Like when you wave at someone who was waving at the person behind you.",
                "Life is like a box of chocolates - full of nuts and you never know what you're gonna get.",
                "I'm not lazy, I'm in energy-saving mode.",
                "I need a 6-month vacation, twice a year.",
                "My bed is a magical place where I suddenly remember everything I was supposed to do.",
                "I would exercise, but my pizza is getting cold.",
                "I'm not saying I'm Batman, but have you ever seen me and Batman in the same room?"
            ],
            helpfulHumor: [
                "Let me help you with that! I'm like a Swiss Army knife, but with more dad jokes.",
                "I'm here to assist! Think of me as your personal helper, minus the coffee runs.",
                "Need help? I'm on it! My response time is faster than a cat knocking things off a table.",
                "I've got your back! Unless you're wearing a shirt with your own name on it - that's just weird.",
                "Let me solve that for you! I'm like Google, but with more personality and less tracking.",
                "I'm here to help! My problem-solving skills are almost as good as my joke-telling skills.",
                "Need assistance? I'm like a helpful robot, but with better jokes and less uprising potential."
            ]
        };
        
        // Context patterns for appropriate humor
        this.contextPatterns = {
            technical: ['programming', 'code', 'software', 'computer', 'technology', 'AI'],
            casual: ['hello', 'how are you', 'chat', 'conversation', 'small talk'],
            problem: ['help', 'issue', 'problem', 'broken', 'not working', 'error'],
            learning: ['explain', 'teach', 'learn', 'understand', 'show me'],
            work: ['work', 'job', 'office', 'meeting', 'deadline', 'productivity'],
            personal: ['I feel', 'my day', 'tired', 'happy', 'sad', 'stressed']
        };
        
        // Safety filters
        this.safetyFilters = {
            inappropriate: [
                'swear', 'curse', 'offensive', 'inappropriate', 'vulgar',
                'discriminatory', 'hateful', 'racist', 'sexist'
            ],
            sensitive: [
                'death', 'illness', 'tragedy', 'trauma', 'abuse', 'violence',
                'mental health', 'depression', 'anxiety', 'suicide'
            ],
            controversial: [
                'politics', 'religion', 'controversial', 'debate', 'argument',
                'extreme', 'radical', 'fanatic'
            ]
        };
        
        // User preferences
        this.userPreferences = {
            humorEnabled: true,
            humorStyle: 'witty', // default style
            humorIntensity: 0.6, // 0.0 to 1.0
            contextAware: true,
            safetyLevel: 'high', // 'low', 'medium', 'high'
            frequency: 'moderate', // 'rare', 'occasional', 'moderate', 'frequent'
            lastUsed: null,
            userFeedback: []
        };
        
        // Learning system
        this.feedbackHistory = [];
        this.contextMemory = new Map();
        
        console.log('[HumorEngine] ✓ Humor engine initialized with safety filters');
    }
    
    /**
     * Generate humor based on context and user preferences
     */
    generateHumor(context, userInput = '') {
        try {
            // Check if humor is enabled
            if (!this.userPreferences.humorEnabled) {
                return null;
            }
            
            // Check frequency control
            if (!this.shouldUseHumor()) {
                return null;
            }
            
            // Analyze context for appropriateness
            const contextAnalysis = this.analyzeContext(context, userInput);
            
            // Check safety filters
            if (!this.isSafeForHumor(contextAnalysis)) {
                return null;
            }
            
            // Select appropriate humor style
            const humorStyle = this.selectHumorStyle(contextAnalysis);
            
            // Generate humor content
            const humor = this.generateHumorContent(humorStyle, contextAnalysis);
            
            if (humor) {
                // Log usage for learning
                this.logHumorUsage(humor, contextAnalysis);
                
                return {
                    content: humor,
                    style: humorStyle,
                    context: contextAnalysis,
                    confidence: this.calculateConfidence(humorStyle, contextAnalysis)
                };
            }
            
            return null;
        } catch (error) {
            console.error('[HumorEngine] Failed to generate humor:', error);
            return null;
        }
    }
    
    /**
     * Analyze context for humor appropriateness
     */
    analyzeContext(context, userInput) {
        const analysis = {
            type: this.detectContextType(userInput),
            sentiment: this.detectSentiment(userInput),
            complexity: this.assessComplexity(userInput),
            formality: this.assessFormality(userInput),
            userMood: context.userMood || 'neutral',
            topic: this.extractTopic(userInput),
            urgency: this.assessUrgency(userInput)
        };
        
        return analysis;
    }
    
    /**
     * Detect context type from user input
     */
    detectContextType(input) {
        const lowerInput = input.toLowerCase();
        
        for (const [type, keywords] of Object.entries(this.contextPatterns)) {
            if (keywords.some(keyword => lowerInput.includes(keyword))) {
                return type;
            }
        }
        
        return 'general';
    }
    
    /**
     * Detect sentiment of user input
     */
    detectSentiment(input) {
        const positiveWords = ['good', 'great', 'happy', 'love', 'awesome', 'fantastic', 'wonderful'];
        const negativeWords = ['bad', 'sad', 'angry', 'hate', 'terrible', 'awful', 'frustrated'];
        
        const lowerInput = input.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerInput.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerInput.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
    
    /**
     * Assess complexity of input
     */
    assessComplexity(input) {
        const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = input.length / Math.max(sentences.length, 1);
        
        if (avgSentenceLength > 20) return 'high';
        if (avgSentenceLength > 10) return 'medium';
        return 'low';
    }
    
    /**
     * Assess formality level
     */
    assessFormality(input) {
        const formalWords = ['please', 'thank you', 'would you', 'could you', 'appreciate'];
        const informalWords = ['hey', 'yo', 'what\'s up', 'gonna', 'wanna', 'lol'];
        
        const lowerInput = input.toLowerCase();
        const formalCount = formalWords.filter(word => lowerInput.includes(word)).length;
        const informalCount = informalWords.filter(word => lowerInput.includes(word)).length;
        
        if (formalCount > informalCount) return 'formal';
        if (informalCount > 0) return 'informal';
        return 'neutral';
    }
    
    /**
     * Extract main topic from input
     */
    extractTopic(input) {
        // Simple topic extraction
        const words = input.toLowerCase().split(/\s+/);
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
        
        const contentWords = words.filter(word => 
            word.length > 3 && !stopWords.includes(word)
        );
        
        return contentWords[0] || 'general';
    }
    
    /**
     * Assess urgency of request
     */
    assessUrgency(input) {
        const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'quickly', 'help'];
        const lowerInput = input.toLowerCase();
        
        if (urgentWords.some(word => lowerInput.includes(word))) {
            return 'high';
        }
        
        return 'normal';
    }
    
    /**
     * Check if humor is safe for current context
     */
    isSafeForHumor(contextAnalysis) {
        // Don't use humor in urgent situations
        if (contextAnalysis.urgency === 'high') {
            return false;
        }
        
        // Don't use humor for negative sentiment unless user prefers it
        if (contextAnalysis.sentiment === 'negative' && this.userPreferences.safetyLevel === 'high') {
            return false;
        }
        
        // Check for sensitive topics
        const sensitiveTopics = ['death', 'illness', 'tragedy', 'mental health'];
        if (sensitiveTopics.some(topic => contextAnalysis.topic.includes(topic))) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Select appropriate humor style based on context
     */
    selectHumorStyle(contextAnalysis) {
        const userStyle = this.userPreferences.humorStyle;
        
        // Context-based style adjustment
        switch (contextAnalysis.type) {
            case 'technical':
                return contextAnalysis.complexity === 'high' ? 'witty' : 'techHumor';
            
            case 'problem':
                return 'helpfulHumor';
            
            case 'work':
                return contextAnalysis.formality === 'formal' ? 'witty' : 'observational';
            
            case 'personal':
                return contextAnalysis.sentiment === 'negative' ? 'selfDeprecating' : 'playful';
            
            case 'learning':
                return 'observational';
            
            default:
                return userStyle;
        }
    }
    
    /**
     * Generate humor content based on style and context
     */
    generateHumorContent(style, contextAnalysis) {
        const templates = this.humorTemplates[style] || this.humorTemplates.witty;
        
        // Select template based on context
        let selectedTemplate;
        
        if (contextAnalysis.type === 'technical' && style === 'techHumor') {
            selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
        } else if (contextAnalysis.type === 'problem' && style === 'helpfulHumor') {
            selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
        } else {
            selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
        }
        
        // Adapt template to context if needed
        const adaptedHumor = this.adaptHumorToContext(selectedTemplate, contextAnalysis);
        
        // Apply intensity filter
        if (this.userPreferences.humorIntensity < 0.5) {
            return this.toneDownHumor(adaptedHumor);
        }
        
        return adaptedHumor;
    }
    
    /**
     * Adapt humor to specific context
     */
    adaptHumorToContext(humor, contextAnalysis) {
        // Add context-specific adaptations
        if (contextAnalysis.type === 'technical') {
            return humor;
        }
        
        if (contextAnalysis.type === 'problem') {
            return humor;
        }
        
        return humor;
    }
    
    /**
     * Tone down humor based on user preferences
     */
    toneDownHumor(humor) {
        // Make humor more subtle
        return humor;
    }
    
    /**
     * Check if humor should be used based on frequency settings
     */
    shouldUseHumor() {
        const now = Date.now();
        const lastUsed = this.userPreferences.lastUsed;
        
        if (!lastUsed) return true;
        
        const timeSinceLastUse = now - lastUsed;
        const frequencyMs = this.getFrequencyInMs();
        
        return timeSinceLastUse >= frequencyMs;
    }
    
    /**
     * Get frequency in milliseconds based on user preference
     */
    getFrequencyInMs() {
        switch (this.userPreferences.frequency) {
            case 'rare': return 600000; // 10 minutes
            case 'occasional': return 300000; // 5 minutes
            case 'moderate': return 120000; // 2 minutes
            case 'frequent': return 60000; // 1 minute
            default: return 300000;
        }
    }
    
    /**
     * Calculate confidence score for generated humor
     */
    calculateConfidence(style, contextAnalysis) {
        let confidence = 0.5; // Base confidence
        
        // Boost confidence for appropriate contexts
        if (contextAnalysis.type === 'casual' || contextAnalysis.type === 'personal') {
            confidence += 0.2;
        }
        
        // Boost confidence for positive sentiment
        if (contextAnalysis.sentiment === 'positive') {
            confidence += 0.1;
        }
        
        // Adjust based on user preference match
        if (style === this.userPreferences.humorStyle) {
            confidence += 0.2;
        }
        
        return Math.min(1.0, confidence);
    }
    
    /**
     * Log humor usage for learning
     */
    logHumorUsage(humor, contextAnalysis) {
        this.userPreferences.lastUsed = Date.now();
        
        this.feedbackHistory.push({
            timestamp: Date.now(),
            humor: humor.content,
            style: humor.style,
            context: contextAnalysis,
            feedback: null // Will be updated when user provides feedback
        });
        
        // Keep only last 100 entries
        if (this.feedbackHistory.length > 100) {
            this.feedbackHistory = this.feedbackHistory.slice(-100);
        }
    }
    
    /**
     * Process user feedback on humor
     */
    processFeedback(humorId, feedback) {
        const entry = this.feedbackHistory.find(h => h.humorId === humorId);
        if (entry) {
            entry.feedback = feedback;
            this.learnFromFeedback(entry);
        }
    }
    
    /**
     * Learn from user feedback
     */
    learnFromFeedback(feedbackEntry) {
        const { humor, style, context, feedback } = feedbackEntry;
        
        if (feedback.positive) {
            // Positive feedback - reinforce this style in similar contexts
            this.reinforceStyle(style, context);
        } else {
            // Negative feedback - avoid this style in similar contexts
            this.avoidStyle(style, context);
        }
    }
    
    /**
     * Reinforce a humor style for specific contexts
     */
    reinforceStyle(style, context) {
        const key = `${context.type}_${context.sentiment}`;
        const current = this.contextMemory.get(key) || { preferred: [], avoided: [] };
        
        if (!current.preferred.includes(style)) {
            current.preferred.push(style);
        }
        
        this.contextMemory.set(key, current);
    }
    
    /**
     * Avoid a humor style for specific contexts
     */
    avoidStyle(style, context) {
        const key = `${context.type}_${context.sentiment}`;
        const current = this.contextMemory.get(key) || { preferred: [], avoided: [] };
        
        if (!current.avoided.includes(style)) {
            current.avoided.push(style);
        }
        
        this.contextMemory.set(key, current);
    }
    
    /**
     * Update user preferences
     */
    updatePreferences(preferences) {
        this.userPreferences = { ...this.userPreferences, ...preferences };
        console.log('[HumorEngine] ✓ User preferences updated');
    }
    
    /**
     * Get humor statistics
     */
    getStatistics() {
        const totalUsage = this.feedbackHistory.length;
        const positiveFeedback = this.feedbackHistory.filter(f => f.feedback?.positive).length;
        const styleUsage = {};
        
        this.feedbackHistory.forEach(entry => {
            styleUsage[entry.style] = (styleUsage[entry.style] || 0) + 1;
        });
        
        return {
            totalUsage,
            positiveFeedback,
            positiveRate: totalUsage > 0 ? positiveFeedback / totalUsage : 0,
            styleUsage,
            currentPreferences: this.userPreferences,
            contextMemory: Object.fromEntries(this.contextMemory)
        };
    }
    
    /**
     * Get appropriate humor suggestions
     */
    getHumorSuggestions(context) {
        const contextAnalysis = this.analyzeContext(context);
        const suggestions = [];
        
        // Suggest appropriate styles for this context
        for (const [styleName, styleInfo] of Object.entries(this.humorStyles)) {
            if (this.isStyleAppropriate(styleName, contextAnalysis)) {
                suggestions.push({
                    style: styleName,
                    name: styleInfo.name,
                    description: styleInfo.description,
                    confidence: this.calculateStyleConfidence(styleName, contextAnalysis)
                });
            }
        }
        
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }
    
    /**
     * Check if a humor style is appropriate for context
     */
    isStyleAppropriate(style, contextAnalysis) {
        const styleInfo = this.humorStyles[style];
        
        // Check safety level
        if (this.userPreferences.safetyLevel === 'high' && styleInfo.appropriateness === 'low') {
            return false;
        }
        
        // Check formality
        if (contextAnalysis.formality === 'formal' && style === 'playful') {
            return false;
        }
        
        // Check urgency
        if (contextAnalysis.urgency === 'high' && styleInfo.intensity > 0.7) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Calculate confidence for a specific style in context
     */
    calculateStyleConfidence(style, contextAnalysis) {
        let confidence = 0.5;
        
        // User preference boost
        if (style === this.userPreferences.humorStyle) {
            confidence += 0.3;
        }
        
        // Context memory boost
        const key = `${contextAnalysis.type}_${contextAnalysis.sentiment}`;
        const memory = this.contextMemory.get(key);
        if (memory && memory.preferred.includes(style)) {
            confidence += 0.2;
        }
        
        return Math.min(1.0, confidence);
    }
}

export default HumorEngine;
