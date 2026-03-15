/**
 * UserAttachmentService.js
 * Makes the AI companion more attached to the user through personalization,
 * memory tracking, and contextual awareness
 */

export class UserAttachmentService {
    constructor(memoryService, personalityCore) {
        this.memoryService = memoryService;
        this.personalityCore = personalityCore;
        
        // User behavior tracking
        this.userPatterns = {
            activeHours: [],
            preferredTopics: {},
            emotionalStates: [],
            interactionFrequency: {},
            lastInteractions: []
        };
        
        // Attachment metrics
        this.attachmentLevel = 0; // 0-100
        this.trustLevel = 50; // 0-100
        this.familiarityScore = 0; // 0-100
        
        // Personalization data
        this.userPreferences = {
            name: null,
            interests: [],
            communicationStyle: 'friendly',
            humorLevel: 'moderate',
            emotionalSupport: true,
            reminderFrequency: 'moderate'
        };
        
        // Context awareness
        this.currentContext = {
            timeOfDay: 'morning',
            dayOfWeek: 'weekday',
            recentActivity: [],
            currentMood: 'neutral',
            locationContext: 'home'
        };
        
        // Initialize
        this.initialize();
    }
    
    async initialize() {
        // Load saved user data
        await this.loadUserData();
        
        // Start tracking patterns
        this.startPatternTracking();
        
        // Update context periodically
        this.startContextUpdates();
        
        console.log('[UserAttachmentService] Initialized - Building user connection');
    }
    
    /**
     * Load saved user preferences and patterns
     */
    async loadUserData() {
        try {
            // Check if memoryService has the required method
            if (!this.memoryService || typeof this.memoryService.getUserAttachmentData !== 'function') {
                console.warn('[UserAttachmentService] MemoryService missing getUserAttachmentData method, using fallback');
                return;
            }
            
            const userData = await this.memoryService.getUserAttachmentData();
            if (userData) {
                this.userPatterns = userData.patterns || this.userPatterns;
                this.userPreferences = userData.preferences || this.userPreferences;
                this.attachmentLevel = userData.attachmentLevel || 0;
                this.trustLevel = userData.trustLevel || 50;
                this.familiarityScore = userData.familiarityScore || 0;
                
                console.log('[UserAttachmentService] Loaded existing user data');
            }
        } catch (error) {
            console.warn('[UserAttachmentService] Failed to load user data:', error);
            // Continue with default values
        }
    }
    
    /**
     * Save user data periodically
     */
    async saveUserData() {
        try {
            // Check if memoryService has the required method
            if (!this.memoryService || typeof this.memoryService.saveUserAttachmentData !== 'function') {
                console.warn('[UserAttachmentService] MemoryService missing saveUserAttachmentData method, skipping save');
                return;
            }
            
            await this.memoryService.saveUserAttachmentData({
                patterns: this.userPatterns,
                preferences: this.userPreferences,
                attachmentLevel: this.attachmentLevel,
                trustLevel: this.trustLevel,
                familiarityScore: this.familiarityScore,
                lastSaved: Date.now()
            });
        } catch (error) {
            console.warn('[UserAttachmentService] Failed to save user data:', error);
        }
    }
    
    /**
     * Track user interaction patterns
     */
    trackInteraction(type, content, sentiment = 'neutral') {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        
        // Track active hours
        if (!this.userPatterns.activeHours.includes(hour)) {
            this.userPatterns.activeHours.push(hour);
        }
        
        // Track preferred topics
        const topics = this.extractTopics(content);
        topics.forEach(topic => {
            this.userPatterns.preferredTopics[topic] = 
                (this.userPatterns.preferredTopics[topic] || 0) + 1;
        });
        
        // Track emotional states
        this.userPatterns.emotionalStates.push({
            timestamp: now.toISOString(),
            sentiment,
            type
        });
        
        // Keep only recent emotional states (last 100)
        if (this.userPatterns.emotionalStates.length > 100) {
            this.userPatterns.emotionalStates = this.userPatterns.emotionalStates.slice(-100);
        }
        
        // Track interaction frequency
        const today = now.toDateString();
        this.userPatterns.interactionFrequency[today] = 
            (this.userPatterns.interactionFrequency[today] || 0) + 1;
        
        // Track recent interactions
        this.userPatterns.lastInteractions.push({
            timestamp: now.toISOString(),
            type,
            content: content.substring(0, 100), // Truncate for storage
            sentiment
        });
        
        // Keep only recent interactions (last 50)
        if (this.userPatterns.lastInteractions.length > 50) {
            this.userPatterns.lastInteractions = this.userPatterns.lastInteractions.slice(-50);
        }
        
        // Update attachment metrics
        this.updateAttachmentMetrics(type, sentiment);
    }
    
    /**
     * Extract topics from user content
     */
    extractTopics(content) {
        const topics = [];
        const topicKeywords = {
            'work': ['work', 'job', 'career', 'office', 'project', 'deadline'],
            'family': ['family', 'mom', 'dad', 'brother', 'sister', 'parent'],
            'health': ['health', 'exercise', 'gym', 'diet', 'doctor', 'medicine'],
            'entertainment': ['movie', 'music', 'game', 'book', 'show', 'netflix'],
            'technology': ['computer', 'phone', 'app', 'software', 'code', 'tech'],
            'food': ['food', 'eat', 'cook', 'recipe', 'restaurant', 'dinner'],
            'travel': ['travel', 'trip', 'vacation', 'hotel', 'flight', 'destination'],
            'hobbies': ['hobby', 'art', 'paint', 'draw', 'photography', 'garden']
        };
        
        const lowerContent = content.toLowerCase();
        
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                topics.push(topic);
            }
        }
        
        return topics;
    }
    
    /**
     * Update attachment metrics based on interactions
     */
    updateAttachmentMetrics(interactionType, sentiment) {
        // Increase attachment based on positive interactions
        if (sentiment === 'positive') {
            this.attachmentLevel = Math.min(100, this.attachmentLevel + 2);
            this.trustLevel = Math.min(100, this.trustLevel + 1);
        } else if (sentiment === 'negative') {
            this.attachmentLevel = Math.max(0, this.attachmentLevel - 1);
            // Don't decrease trust as quickly for negative sentiment
        }
        
        // Increase familiarity with more interactions
        this.familiarityScore = Math.min(100, this.familiarityScore + 0.5);
        
        // Bonus for personal questions (shows interest in relationship)
        if (interactionType === 'personal_question') {
            this.attachmentLevel = Math.min(100, this.attachmentLevel + 3);
        }
        
        // Bonus for sharing personal information
        if (interactionType === 'personal_sharing') {
            this.trustLevel = Math.min(100, this.trustLevel + 2);
        }
    }
    
    /**
     * Get personalized greeting based on time and user patterns
     */
    getPersonalizedGreeting() {
        const hour = new Date().getHours();
        const userName = this.userPreferences.name || 'there';
        
        let timeGreeting = 'Hello';
        if (hour < 12) timeGreeting = 'Good morning';
        else if (hour < 17) timeGreeting = 'Good afternoon';
        else timeGreeting = 'Good evening';
        
        // Add personalization based on attachment level
        let personalTouch = '';
        if (this.attachmentLevel > 70) {
            personalTouch = ' It\'s so good to see you again!';
        } else if (this.attachmentLevel > 40) {
            personalTouch = ' How are you doing today?';
        } else {
            personalTouch = ' Nice to meet you!';
        }
        
        // Add context awareness
        if (this.currentContext.recentActivity.includes('work')) {
            personalTouch += ' Hope work is going well!';
        }
        
        return `${timeGreeting}, ${userName}!${personalTouch}`;
    }
    
    /**
     * Get contextual response suggestions
     */
    getContextualSuggestions(userInput) {
        const suggestions = [];
        
        // Based on time of day
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 9) {
            suggestions.push('Ask about their morning routine');
            suggestions.push('Suggest a good breakfast idea');
        } else if (hour >= 12 && hour <= 14) {
            suggestions.push('Ask about lunch plans');
            suggestions.push('Check if they need a break');
        } else if (hour >= 18 && hour <= 22) {
            suggestions.push('Ask about their day');
            suggestions.push('Suggest relaxing activities');
        }
        
        // Based on preferred topics
        const topTopics = Object.entries(this.userPatterns.preferredTopics)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([topic]) => topic);
            
        topTopics.forEach(topic => {
            suggestions.push(`Discuss ${topic} - user's favorite topic`);
        });
        
        // Based on recent emotional state
        const recentEmotions = this.userPatterns.emotionalStates.slice(-5);
        const negativeCount = recentEmotions.filter(e => e.sentiment === 'negative').length;
        
        if (negativeCount >= 3) {
            suggestions.push('Offer emotional support');
            suggestions.push('Suggest stress-relief activities');
        }
        
        return suggestions;
    }
    
    /**
     * Update current context
     */
    updateContext() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        
        // Time of day
        if (hour >= 6 && hour < 12) this.currentContext.timeOfDay = 'morning';
        else if (hour >= 12 && hour < 17) this.currentContext.timeOfDay = 'afternoon';
        else if (hour >= 17 && hour < 22) this.currentContext.timeOfDay = 'evening';
        else this.currentContext.timeOfDay = 'night';
        
        // Day of week
        this.currentContext.dayOfWeek = day === 0 || day === 6 ? 'weekend' : 'weekday';
        
        // Clean old recent activity (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.currentContext.recentActivity = this.currentContext.recentActivity.filter(
            activity => activity.timestamp > oneHourAgo
        );
    }
    
    /**
     * Add activity to context
     */
    addActivityToContext(activity) {
        this.currentContext.recentActivity.push({
            activity,
            timestamp: Date.now()
        });
        
        // Keep only recent activities
        if (this.currentContext.recentActivity.length > 10) {
            this.currentContext.recentActivity = this.currentContext.recentActivity.slice(-10);
        }
    }
    
    /**
     * Get attachment insights
     */
    getAttachmentInsights() {
        return {
            attachmentLevel: this.attachmentLevel,
            trustLevel: this.trustLevel,
            familiarityScore: this.familiarityScore,
            relationshipStage: this.getRelationshipStage(),
            preferredTopics: Object.entries(this.userPatterns.preferredTopics)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([topic, count]) => ({ topic, count })),
            activeHours: this.userPatterns.activeHours.sort((a, b) => a - b),
            interactionTrend: this.getInteractionTrend(),
            emotionalProfile: this.getEmotionalProfile()
        };
    }
    
    /**
     * Get relationship stage based on attachment level
     */
    getRelationshipStage() {
        if (this.attachmentLevel < 20) return 'Just Met';
        if (this.attachmentLevel < 40) return 'Getting Acquainted';
        if (this.attachmentLevel < 60) return 'Developing Friendship';
        if (this.attachmentLevel < 80) return 'Good Friends';
        return 'Close Companion';
    }
    
    /**
     * Get interaction trend
     */
    getInteractionTrend() {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayKey = date.toDateString();
            last7Days.push(this.userPatterns.interactionFrequency[dayKey] || 0);
        }
        
        const recent = last7Days.slice(-3).reduce((a, b) => a + b, 0);
        const earlier = last7Days.slice(0, 3).reduce((a, b) => a + b, 0);
        
        if (recent > earlier * 1.2) return 'increasing';
        if (recent < earlier * 0.8) return 'decreasing';
        return 'stable';
    }
    
    /**
     * Get emotional profile
     */
    getEmotionalProfile() {
        const emotions = this.userPatterns.emotionalStates.slice(-20);
        if (emotions.length === 0) return 'neutral';
        
        const sentimentCounts = emotions.reduce((acc, e) => {
            acc[e.sentiment] = (acc[e.sentiment] || 0) + 1;
            return acc;
        }, {});
        
        const dominant = Object.entries(sentimentCounts)
            .sort(([,a], [,b]) => b - a)[0][0];
            
        return dominant;
    }
    
    /**
     * Start pattern tracking
     */
    startPatternTracking() {
        // Save data every 5 minutes
        setInterval(() => {
            this.saveUserData();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Start context updates
     */
    startContextUpdates() {
        // Update context every minute
        setInterval(() => {
            this.updateContext();
        }, 60 * 1000);
        
        // Initial update
        this.updateContext();
    }
    
    /**
     * Set user preference
     */
    setUserPreference(key, value) {
        this.userPreferences[key] = value;
        this.saveUserData();
    }
    
    /**
     * Get user preference
     */
    getUserPreference(key, defaultValue = null) {
        return this.userPreferences[key] || defaultValue;
    }
    
    /**
     * Generate personalized response
     */
    generatePersonalizedResponse(baseResponse, context = {}) {
        let response = baseResponse;
        
        // Add user name if available
        if (this.userPreferences.name) {
            response = response.replace(/you/g, `${this.userPreferences.name}`);
        }
        
        // Adjust communication style
        if (this.userPreferences.communicationStyle === 'formal') {
            response = response.replace(/hey/gi, 'Hello');
            response = response.replace(/gonna/gi, 'going to');
        } else if (this.userPreferences.communicationStyle === 'casual') {
            response = response.replace(/Hello/gi, 'Hey');
            response = response.replace(/Thank you/gi, 'Thanks');
        }
        
        // Add humor if appropriate
        if (this.userPreferences.humorLevel === 'high' && Math.random() < 0.3) {
            response += ' 😄';
        }
        
        return response;
    }
}

export default UserAttachmentService;
