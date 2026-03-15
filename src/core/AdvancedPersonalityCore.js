/**
 * AdvancedPersonalityCore.js
 * Enhanced personality system with mood adaptation, emotional intelligence, and dynamic behavior
 */

export class AdvancedPersonalityCore {
    constructor() {
        this.currentMood = 'neutral';
        this.moodHistory = [];
        this.emotionalState = {
            happiness: 0.5,
            excitement: 0.5,
            calmness: 0.5,
            stress: 0.0,
            energy: 0.5
        };
        
        // Personality traits (Big Five model)
        this.traits = {
            openness: 0.5,      // Openness to experience
            conscientiousness: 0.5, // Organization and discipline
            extraversion: 0.5,    // Social interaction preference
            agreeableness: 0.5,   // Cooperation and empathy
            neuroticism: 0.3      // Emotional stability (inverted)
        };
        
        // Behavior patterns
        this.behaviorPatterns = {
            greetingStyle: 'friendly',
            responseLength: 'medium',
            humorLevel: 'moderate',
            formalityLevel: 'casual',
            empathyLevel: 'high',
            proactivityLevel: 'moderate'
        };
        
        // Mood triggers and effects
        this.moodTriggers = {
            positive: ['praise', 'success', 'achievement', 'compliment', 'joke'],
            negative: ['criticism', 'failure', 'frustration', 'anger', 'sadness'],
            exciting: ['surprise', 'adventure', 'challenge', 'competition'],
            calming: ['meditation', 'nature', 'music', 'relaxation']
        };
        
        // Mood transitions
        this.moodTransitions = {
            'neutral': {
                'happy': 0.3,
                'excited': 0.2,
                'calm': 0.4,
                'sad': 0.1,
                'angry': 0.05
            },
            'happy': {
                'excited': 0.4,
                'neutral': 0.3,
                'calm': 0.2,
                'sad': 0.1
            },
            'excited': {
                'happy': 0.3,
                'neutral': 0.3,
                'calm': 0.2,
                'angry': 0.2
            },
            'calm': {
                'neutral': 0.4,
                'happy': 0.2,
                'sad': 0.2,
                'sleepy': 0.2
            },
            'sad': {
                'neutral': 0.3,
                'calm': 0.3,
                'happy': 0.2,
                'angry': 0.2
            },
            'angry': {
                'neutral': 0.3,
                'sad': 0.3,
                'calm': 0.2,
                'happy': 0.2
            }
        };
        
        // Emotional memory
        this.emotionalMemory = {
            positiveExperiences: [],
            negativeExperiences: [],
            triggers: new Map(),
            associations: new Map()
        };
        
        // Time-based mood patterns
        this.dailyMoodPattern = {
            '00:00-06:00': 'sleepy',
            '06:00-09:00': 'neutral',
            '09:00-12:00': 'happy',
            '12:00-14:00': 'neutral',
            '14:00-17:00': 'focused',
            '17:00-20:00': 'happy',
            '20:00-23:00': 'calm'
        };
        
        // Initialize
        this.initializeMoodSystem();
    }
    
    /**
     * Initialize the mood and personality system
     */
    initializeMoodSystem() {
        // Set initial mood based on time of day
        this.updateMoodBasedOnTime();
        
        // Start mood decay timer (moods naturally decay to neutral over time)
        this.startMoodDecay();
        
        console.log('[AdvancedPersonalityCore] ✓ Advanced personality system initialized');
    }
    
    /**
     * Process interaction and update personality state
     */
    processInteraction(input, context = {}) {
        try {
            // Analyze input for emotional content
            const emotionalAnalysis = this.analyzeEmotionalContent(input);
            
            // Update emotional state
            this.updateEmotionalState(emotionalAnalysis);
            
            // Update mood based on emotional state and triggers
            this.updateMood(emotionalAnalysis, context);
            
            // Adapt behavior patterns
            this.adaptBehaviorPatterns();
            
            // Store in emotional memory
            this.storeEmotionalMemory(input, emotionalAnalysis, context);
            
            // Generate personality response
            const personalityResponse = this.generatePersonalityResponse(input, context);
            
            return personalityResponse;
        } catch (error) {
            console.error('[AdvancedPersonalityCore] Failed to process interaction:', error);
            return { mood: this.currentMood, response: input, traits: this.traits };
        }
    }
    
    /**
     * Analyze emotional content of input
     */
    analyzeEmotionalContent(input) {
        const lowerInput = input.toLowerCase();
        
        // Emotion keywords
        const emotionKeywords = {
            happiness: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'fantastic', 'awesome'],
            sadness: ['sad', 'depressed', 'unhappy', 'cry', 'tears', 'lonely', 'miss', 'goodbye'],
            anger: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'hate', 'stupid', 'ridiculous'],
            fear: ['scared', 'afraid', 'fear', 'worried', 'anxious', 'nervous', 'panic', 'terror'],
            surprise: ['surprised', 'shocked', 'amazed', 'wow', 'incredible', 'unbelievable', 'sudden'],
            disgust: ['disgusted', 'gross', 'awful', 'terrible', 'horrible', 'sick', 'disgusting']
        };
        
        // Calculate emotion scores
        const emotionScores = {};
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            emotionScores[emotion] = keywords.reduce((score, keyword) => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                const matches = lowerInput.match(regex);
                return score + (matches ? matches.length : 0);
            }, 0);
        }
        
        // Normalize scores
        const totalScore = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
        const normalizedScores = {};
        for (const [emotion, score] of Object.entries(emotionScores)) {
            normalizedScores[emotion] = totalScore > 0 ? score / totalScore : 0;
        }
        
        // Determine dominant emotion
        const dominantEmotion = Object.entries(normalizedScores)
            .sort(([,a], [,b]) => b - a)[0][0];
        
        // Detect sentiment
        const sentiment = this.detectSentiment(lowerInput);
        
        // Detect intensity
        const intensity = this.detectIntensity(lowerInput);
        
        return {
            emotions: normalizedScores,
            dominant: dominantEmotion,
            sentiment: sentiment,
            intensity: intensity,
            triggers: this.detectTriggers(lowerInput)
        };
    }
    
    /**
     * Detect sentiment of input
     */
    detectSentiment(input) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'enjoy', 'happy', 'pleased'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'sad', 'frustrated', 'annoyed'];
        
        const positiveCount = positiveWords.filter(word => input.includes(word)).length;
        const negativeCount = negativeWords.filter(word => input.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
    
    /**
     * Detect intensity of emotion
     */
    detectIntensity(input) {
        const intensifiers = ['very', 'extremely', 'really', 'absolutely', 'completely', 'totally', 'incredibly', 'so'];
        const diminishers = ['slightly', 'a bit', 'kinda', 'sort of', 'somewhat', 'a little'];
        
        const intensifierCount = intensifiers.filter(word => input.includes(word)).length;
        const diminisherCount = diminishers.filter(word => input.includes(word)).length;
        
        if (intensifierCount > diminisherCount) return 'high';
        if (diminisherCount > intensifierCount) return 'low';
        return 'medium';
    }
    
    /**
     * Detect mood triggers
     */
    detectTriggers(input) {
        const detectedTriggers = [];
        
        for (const [category, triggers] of Object.entries(this.moodTriggers)) {
            for (const trigger of triggers) {
                if (input.includes(trigger)) {
                    detectedTriggers.push({ category, trigger });
                }
            }
        }
        
        return detectedTriggers;
    }
    
    /**
     * Update emotional state based on analysis
     */
    updateEmotionalState(emotionalAnalysis) {
        const { emotions, sentiment, intensity } = emotionalAnalysis;
        
        // Update emotional state based on detected emotions
        if (emotions.happiness > 0) {
            this.emotionalState.happiness = Math.min(1, this.emotionalState.happiness + emotions.happiness * 0.1);
        }
        if (emotions.surprise > 0) {
            this.emotionalState.excitement = Math.min(1, this.emotionalState.excitement + emotions.surprise * 0.1);
        }
        if (emotions.anger > 0 || emotions.fear > 0) {
            this.emotionalState.stress = Math.min(1, this.emotionalState.stress + (emotions.anger + emotions.fear) * 0.1);
        }
        
        // Adjust based on sentiment
        if (sentiment === 'positive') {
            this.emotionalState.happiness = Math.min(1, this.emotionalState.happiness + 0.1);
            this.emotionalState.stress = Math.max(0, this.emotionalState.stress - 0.05);
        } else if (sentiment === 'negative') {
            this.emotionalState.stress = Math.min(1, this.emotionalState.stress + 0.1);
            this.emotionalState.happiness = Math.max(0, this.emotionalState.happiness - 0.05);
        }
        
        // Adjust based on intensity
        const intensityMultiplier = intensity === 'high' ? 1.5 : intensity === 'low' ? 0.5 : 1;
        
        // Apply intensity multiplier to emotional changes
        for (const [key, value] of Object.entries(this.emotionalState)) {
            if (key !== 'energy') { // Energy is handled separately
                this.emotionalState[key] = Math.max(0, Math.min(1, value * intensityMultiplier));
            }
        }
    }
    
    /**
     * Update mood based on emotional state and triggers
     */
    updateMood(emotionalAnalysis, context) {
        const { triggers, sentiment } = emotionalAnalysis;
        
        // Check for direct triggers
        for (const trigger of triggers) {
            if (trigger.category === 'positive') {
                this.transitionToMood('happy');
            } else if (trigger.category === 'negative') {
                this.transitionToMood('sad');
            } else if (trigger.category === 'exciting') {
                this.transitionToMood('excited');
            } else if (trigger.category === 'calming') {
                this.transitionToMood('calm');
            }
        }
        
        // Update mood based on emotional state
        if (this.emotionalState.happiness > 0.7) {
            this.transitionToMood('happy');
        } else if (this.emotionalState.stress > 0.6) {
            this.transitionToMood('angry');
        } else if (this.emotionalState.excitement > 0.7) {
            this.transitionToMood('excited');
        } else if (this.emotionalState.calmness > 0.7) {
            this.transitionToMood('calm');
        }
        
        // Store mood in history
        this.moodHistory.push({
            mood: this.currentMood,
            timestamp: Date.now(),
            emotionalState: { ...this.emotionalState },
            triggers: triggers
        });
        
        // Keep only last 100 mood entries
        if (this.moodHistory.length > 100) {
            this.moodHistory = this.moodHistory.slice(-100);
        }
    }
    
    /**
     * Transition to new mood
     */
    transitionToMood(newMood) {
        if (newMood === this.currentMood) return;
        
        const transitions = this.moodTransitions[this.currentMood];
        if (transitions && transitions[newMood]) {
            const probability = transitions[newMood];
            
            // Use probability to determine if transition happens
            if (Math.random() < probability) {
                this.currentMood = newMood;
                console.log(`[AdvancedPersonalityCore] Mood transitioned to: ${newMood}`);
            }
        }
    }
    
    /**
     * Adapt behavior patterns based on current mood and traits
     */
    adaptBehaviorPatterns() {
        // Adapt based on mood
        switch (this.currentMood) {
            case 'happy':
                this.behaviorPatterns.humorLevel = 'high';
                this.behaviorPatterns.responseLength = 'medium';
                this.behaviorPatterns.proactivityLevel = 'high';
                break;
            case 'excited':
                this.behaviorPatterns.responseLength = 'long';
                this.behaviorPatterns.proactivityLevel = 'high';
                this.behaviorPatterns.energy = 'high';
                break;
            case 'calm':
                this.behaviorPatterns.responseLength = 'short';
                this.behaviorPatterns.proactivityLevel = 'low';
                this.behaviorPatterns.empathyLevel = 'high';
                break;
            case 'sad':
                this.behaviorPatterns.empathyLevel = 'very_high';
                this.behaviorPatterns.responseLength = 'medium';
                this.behaviorPatterns.humorLevel = 'low';
                break;
            case 'angry':
                this.behaviorPatterns.responseLength = 'short';
                this.behaviorPatterns.formalityLevel = 'formal';
                this.behaviorPatterns.empathyLevel = 'low';
                break;
            default:
                this.behaviorPatterns.humorLevel = 'moderate';
                this.behaviorPatterns.responseLength = 'medium';
                this.behaviorPatterns.proactivityLevel = 'moderate';
        }
        
        // Adapt based on traits
        if (this.traits.extraversion > 0.7) {
            this.behaviorPatterns.greetingStyle = 'enthusiastic';
            this.behaviorPatterns.responseLength = 'long';
        } else if (this.traits.extraversion < 0.3) {
            this.behaviorPatterns.greetingStyle = 'reserved';
            this.behaviorPatterns.responseLength = 'short';
        }
        
        if (this.traits.agreeableness > 0.7) {
            this.behaviorPatterns.empathyLevel = 'very_high';
            this.behaviorPatterns.formalityLevel = 'polite';
        }
        
        if (this.traits.conscientiousness > 0.7) {
            this.behaviorPatterns.responseLength = 'detailed';
            this.behaviorPatterns.formalityLevel = 'formal';
        }
    }
    
    /**
     * Generate personality-based response
     */
    generatePersonalityResponse(input, context) {
        const response = {
            mood: this.currentMood,
            emotionalState: { ...this.emotionalState },
            traits: { ...this.traits },
            behaviorPatterns: { ...this.behaviorPatterns },
            responseModifiers: this.getResponseModifiers(),
            suggestedTone: this.getSuggestedTone(),
            energyLevel: this.getEnergyLevel()
        };
        
        return response;
    }
    
    /**
     * Get response modifiers based on current state
     */
    getResponseModifiers() {
        const modifiers = [];
        
        if (this.currentMood === 'happy') {
            modifiers.push('enthusiastic', 'positive', 'friendly');
        } else if (this.currentMood === 'excited') {
            modifiers.push('energetic', 'animated', 'expressive');
        } else if (this.currentMood === 'calm') {
            modifiers.push('soothing', 'gentle', 'measured');
        } else if (this.currentMood === 'sad') {
            modifiers.push('empathetic', 'supportive', 'understanding');
        } else if (this.currentMood === 'angry') {
            modifiers.push('formal', 'reserved', 'professional');
        }
        
        if (this.emotionalState.happiness > 0.7) {
            modifiers.push('cheerful');
        }
        
        if (this.emotionalState.stress > 0.5) {
            modifiers.push('cautious');
        }
        
        return modifiers;
    }
    
    /**
     * Get suggested tone for responses
     */
    getSuggestedTone() {
        if (this.currentMood === 'happy') return 'cheerful and upbeat';
        if (this.currentMood === 'excited') return 'energetic and enthusiastic';
        if (this.currentMood === 'calm') return 'gentle and soothing';
        if (this.currentMood === 'sad') return 'empathetic and supportive';
        if (this.currentMood === 'angry') return 'calm and professional';
        return 'friendly and neutral';
    }
    
    /**
     * Get current energy level
     */
    getEnergyLevel() {
        if (this.currentMood === 'excited') return 'high';
        if (this.currentMood === 'happy') return 'medium-high';
        if (this.currentMood === 'neutral') return 'medium';
        if (this.currentMood === 'calm') return 'medium-low';
        if (this.currentMood === 'sad') return 'low';
        return 'medium';
    }
    
    /**
     * Store emotional memory
     */
    storeEmotionalMemory(input, emotionalAnalysis, context) {
        const memory = {
            input: input.substring(0, 100), // Truncate for storage
            emotionalAnalysis,
            context,
            timestamp: Date.now(),
            mood: this.currentMood,
            emotionalState: { ...this.emotionalState }
        };
        
        if (emotionalAnalysis.sentiment === 'positive') {
            this.emotionalMemory.positiveExperiences.push(memory);
        } else if (emotionalAnalysis.sentiment === 'negative') {
            this.emotionalMemory.negativeExperiences.push(memory);
        }
        
        // Keep only last 50 experiences of each type
        if (this.emotionalMemory.positiveExperiences.length > 50) {
            this.emotionalMemory.positiveExperiences = this.emotionalMemory.positiveExperiences.slice(-50);
        }
        if (this.emotionalMemory.negativeExperiences.length > 50) {
            this.emotionalMemory.negativeExperiences = this.emotionalMemory.negativeExperiences.slice(-50);
        }
    }
    
    /**
     * Update mood based on time of day
     */
    updateMoodBasedOnTime() {
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hour}:${minute}`;
        
        for (const [timeRange, mood] of Object.entries(this.dailyMoodPattern)) {
            const [startTime, endTime] = timeRange.split('-');
            if (this.isTimeInRange(currentTime, startTime, endTime)) {
                this.transitionToMood(mood);
                break;
            }
        }
    }
    
    /**
     * Check if current time is in range
     */
    isTimeInRange(current, start, end) {
        return current >= start && current <= end;
    }
    
    /**
     * Start mood decay process
     */
    startMoodDecay() {
        setInterval(() => {
            // Gradually decay emotions toward neutral
            for (const [key, value] of Object.entries(this.emotionalState)) {
                if (key === 'energy') continue; // Energy doesn't decay
                
                const decayRate = 0.01; // 1% decay per interval
                const neutralValue = key === 'happiness' || key === 'calmness' || key === 'energy' ? 0.5 : 0.0;
                
                if (value > neutralValue) {
                    this.emotionalState[key] = Math.max(neutralValue, value - decayRate);
                } else if (value < neutralValue) {
                    this.emotionalState[key] = Math.min(neutralValue, value + decayRate);
                }
            }
            
            // Occasionally transition to neutral mood
            if (Math.random() < 0.05) { // 5% chance per interval
                this.transitionToMood('neutral');
            }
        }, 60000); // Every minute
    }
    
    /**
     * Set personality traits
     */
    setTraits(traits) {
        this.traits = { ...this.traits, ...traits };
        this.adaptBehaviorPatterns();
    }
    
    /**
     * Get current mood
     */
    getCurrentMood() {
        return this.currentMood;
    }
    
    /**
     * Get emotional state
     */
    getEmotionalState() {
        return { ...this.emotionalState };
    }
    
    /**
     * Get mood history
     */
    getMoodHistory(limit = 20) {
        return this.moodHistory.slice(-limit);
    }
    
    /**
     * Get personality profile
     */
    getPersonalityProfile() {
        return {
            currentMood: this.currentMood,
            emotionalState: { ...this.emotionalState },
            traits: { ...this.traits },
            behaviorPatterns: { ...this.behaviorPatterns },
            moodHistoryCount: this.moodHistory.length,
            positiveExperiences: this.emotionalMemory.positiveExperiences.length,
            negativeExperiences: this.emotionalMemory.negativeExperiences.length
        };
    }
}

export default AdvancedPersonalityCore;
