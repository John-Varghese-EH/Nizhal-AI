/**
 * HelpfulAssistant.js
 * Advanced helpful assistant capabilities with proactive assistance and context awareness
 */

export class HelpfulAssistant {
    constructor() {
        this.capabilities = {
            proactive: true,
            contextual: true,
            learning: true,
            multitasking: true,
            personalized: true,
            safety: true
        };
        
        // Assistance categories
        this.assistanceTypes = {
            productivity: {
                name: 'Productivity',
                description: 'Help with tasks, organization, and efficiency',
                keywords: ['task', 'organize', 'schedule', 'productivity', 'efficiency', 'time'],
                priority: 'high'
            },
            learning: {
                name: 'Learning',
                description: 'Educational assistance and knowledge sharing',
                keywords: ['learn', 'explain', 'teach', 'understand', 'study', 'knowledge'],
                priority: 'high'
            },
            technical: {
                name: 'Technical Support',
                description: 'Help with technical issues and coding',
                keywords: ['code', 'programming', 'technical', 'bug', 'error', 'debug'],
                priority: 'high'
            },
            creative: {
                name: 'Creative Assistance',
                description: 'Help with writing, design, and creative projects',
                keywords: ['create', 'write', 'design', 'creative', 'art', 'music'],
                priority: 'medium'
            },
            personal: {
                name: 'Personal Support',
                description: 'Emotional support and personal advice',
                keywords: ['feel', 'advice', 'personal', 'emotional', 'support', 'help'],
                priority: 'high'
            },
            research: {
                name: 'Research',
                description: 'Information gathering and analysis',
                keywords: ['research', 'find', 'information', 'data', 'analyze', 'search'],
                priority: 'medium'
            }
        };
        
        // Proactive assistance patterns
        this.proactivePatterns = {
            timeBased: [
                { time: '09:00', type: 'productivity', message: 'Good morning! Ready to tackle your day?' },
                { time: '12:00', type: 'personal', message: 'Time for a break! Don\'t forget to stretch.' },
                { time: '15:00', type: 'productivity', message: 'Afternoon slump? Let me help you refocus!' },
                { time: '18:00', type: 'personal', message: 'Work\'s done! Time to relax and recharge.' }
            ],
            contextBased: [
                { trigger: 'error', type: 'technical', message: 'I see you\'re dealing with an error. Need help debugging?' },
                { trigger: 'stuck', type: 'learning', message: 'Feeling stuck? Let me help you approach this differently.' },
                { trigger: 'deadline', type: 'productivity', message: 'Deadline approaching? Let me help you prioritize!' },
                { trigger: 'confused', type: 'learning', message: 'Looks confusing! Let me break this down for you.' }
            ],
            behaviorBased: [
                { pattern: 'repeated_questions', type: 'learning', message: 'I notice you\'re asking about this topic. Want a deeper explanation?' },
                { pattern: 'long_session', type: 'personal', message: 'You\'ve been working for a while. Need a quick break?' },
                { pattern: 'frustration', type: 'personal', message: 'You seem frustrated. Let me help you find a solution.' },
                { pattern: 'success', type: 'productivity', message: 'Great progress! What\'s next on your list?' }
            ]
        };
        
        // User context tracking
        this.userContext = {
            currentTask: null,
            sessionStart: Date.now(),
            lastActivity: Date.now(),
            activityHistory: [],
            skillLevel: 'intermediate',
            preferences: {
                proactiveLevel: 'moderate', // 'minimal', 'moderate', 'active'
                assistanceStyle: 'collaborative', // 'directive', 'collaborative', 'supportive'
                detailLevel: 'balanced', // 'concise', 'balanced', 'detailed'
                learningPace: 'steady' // 'quick', 'steady', 'thorough'
            },
            goals: [],
            challenges: [],
            achievements: []
        };
        
        // Knowledge base
        this.knowledgeBase = {
            commonProblems: new Map(),
            solutions: new Map(),
            tutorials: new Map(),
            resources: new Map()
        };
        
        // Learning system
        this.learningSystem = {
            userInteractions: [],
            successfulHelp: [],
            failedHelp: [],
            patterns: new Map(),
            adaptations: new Map()
        };
        
        console.log('[HelpfulAssistant] ✓ Helpful assistant initialized');
    }
    
    /**
     * Process user request and provide helpful assistance
     */
    async processRequest(request, context = {}) {
        try {
            // Update user context
            this.updateUserContext(request, context);
            
            // Analyze request type and urgency
            const analysis = this.analyzeRequest(request);
            
            // Determine assistance strategy
            const strategy = this.determineAssistanceStrategy(analysis);
            
            // Generate helpful response
            const response = await this.generateHelpfulResponse(request, analysis, strategy);
            
            // Learn from interaction
            this.learnFromInteraction(request, analysis, response);
            
            // Check for proactive opportunities
            this.checkProactiveOpportunities(analysis);
            
            return response;
        } catch (error) {
            console.error('[HelpfulAssistant] Failed to process request:', error);
            return {
                content: 'I apologize, but I encountered an error while processing your request. Please try again.',
                type: 'error',
                suggestions: ['Try rephrasing your request', 'Check if all necessary information is provided']
            };
        }
    }
    
    /**
     * Update user context based on current request
     */
    updateUserContext(request, context) {
        this.userContext.lastActivity = Date.now();
        
        // Add to activity history
        this.userContext.activityHistory.push({
            timestamp: Date.now(),
            request: request,
            context: context,
            sessionDuration: Date.now() - this.userContext.sessionStart
        });
        
        // Keep only last 50 activities
        if (this.userContext.activityHistory.length > 50) {
            this.userContext.activityHistory = this.userContext.activityHistory.slice(-50);
        }
        
        // Update current task if detected
        const detectedTask = this.detectCurrentTask(request);
        if (detectedTask) {
            this.userContext.currentTask = detectedTask;
        }
    }
    
    /**
     * Analyze user request
     */
    analyzeRequest(request) {
        const analysis = {
            type: this.detectRequestType(request),
            urgency: this.assessUrgency(request),
            complexity: this.assessComplexity(request),
            sentiment: this.detectSentiment(request),
            keywords: this.extractKeywords(request),
            intent: this.detectIntent(request),
            context: this.extractContext(request)
        };
        
        return analysis;
    }
    
    /**
     * Detect request type
     */
    detectRequestType(request) {
        const lowerRequest = request.toLowerCase();
        
        for (const [type, info] of Object.entries(this.assistanceTypes)) {
            if (info.keywords.some(keyword => lowerRequest.includes(keyword))) {
                return type;
            }
        }
        
        return 'general';
    }
    
    /**
     * Assess urgency of request
     */
    assessUrgency(request) {
        const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'quickly', 'help', 'stuck'];
        const lowerRequest = request.toLowerCase();
        
        if (urgentKeywords.some(keyword => lowerRequest.includes(keyword))) {
            return 'high';
        }
        
        return 'normal';
    }
    
    /**
     * Assess complexity of request
     */
    assessComplexity(request) {
        const complexityIndicators = {
            high: ['explain in detail', 'step by step', 'comprehensive', 'thorough', 'advanced'],
            low: ['quick', 'simple', 'basic', 'easy', 'brief']
        };
        
        const lowerRequest = request.toLowerCase();
        
        for (const [level, indicators] of Object.entries(complexityIndicators)) {
            if (indicators.some(indicator => lowerRequest.includes(indicator))) {
                return level;
            }
        }
        
        return 'medium';
    }
    
    /**
     * Detect sentiment of request
     */
    detectSentiment(request) {
        const positiveWords = ['great', 'good', 'happy', 'excited', 'thanks', 'awesome'];
        const negativeWords = ['bad', 'frustrated', 'stuck', 'confused', 'difficult', 'help'];
        
        const lowerRequest = request.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerRequest.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerRequest.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
    
    /**
     * Extract keywords from request
     */
    extractKeywords(request) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by'];
        const words = request.toLowerCase().split(/\s+/);
        
        return words.filter(word => 
            word.length > 2 && !stopWords.includes(word)
        );
    }
    
    /**
     * Detect user intent
     */
    detectIntent(request) {
        const intents = {
            question: ['?', 'how', 'what', 'why', 'when', 'where', 'who', 'explain'],
            command: ['do', 'make', 'create', 'show', 'tell', 'give'],
            help: ['help', 'assist', 'support', 'guide'],
            learn: ['learn', 'understand', 'teach', 'explain', 'show me']
        };
        
        const lowerRequest = request.toLowerCase();
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerRequest.includes(keyword))) {
                return intent;
            }
        }
        
        return 'general';
    }
    
    /**
     * Extract context from request
     */
    extractContext(request) {
        // Simple context extraction
        return {
            hasCode: request.includes('```') || request.includes('code'),
            hasNumbers: /\d/.test(request),
            hasTechnicalTerms: this.hasTechnicalTerms(request),
            isPersonal: this.isPersonalRequest(request)
        };
    }
    
    /**
     * Check if request has technical terms
     */
    hasTechnicalTerms(request) {
        const techTerms = ['function', 'variable', 'algorithm', 'database', 'api', 'code', 'programming'];
        const lowerRequest = request.toLowerCase();
        
        return techTerms.some(term => lowerRequest.includes(term));
    }
    
    /**
     * Check if request is personal
     */
    isPersonalRequest(request) {
        const personalIndicators = ['I', 'my', 'me', 'feel', 'think', 'personal'];
        const lowerRequest = request.toLowerCase();
        
        return personalIndicators.some(indicator => lowerRequest.includes(indicator));
    }
    
    /**
     * Determine assistance strategy
     */
    determineAssistanceStrategy(analysis) {
        const strategy = {
            approach: this.userContext.preferences.assistanceStyle,
            detail: this.userContext.preferences.detailLevel,
            proactive: this.userContext.preferences.proactiveLevel,
            urgency: analysis.urgency,
            type: analysis.type,
            adaptations: []
        };
        
        // Adapt based on analysis
        if (analysis.urgency === 'high') {
            strategy.approach = 'directive';
            strategy.detail = 'concise';
        }
        
        if (analysis.complexity === 'high') {
            strategy.detail = 'detailed';
        }
        
        if (analysis.sentiment === 'negative') {
            strategy.approach = 'supportive';
            strategy.adaptations.push('emotional_support');
        }
        
        if (this.userContext.skillLevel === 'beginner') {
            strategy.detail = 'detailed';
            strategy.adaptations.push('step_by_step');
        }
        
        return strategy;
    }
    
    /**
     * Generate helpful response
     */
    async generateHelpfulResponse(request, analysis, strategy) {
        const response = {
            content: '',
            type: analysis.type,
            strategy: strategy,
            suggestions: [],
            resources: [],
            followUp: []
        };
        
        // Generate main content based on type and strategy
        switch (analysis.type) {
            case 'productivity':
                response.content = this.generateProductivityResponse(request, analysis, strategy);
                break;
            case 'learning':
                response.content = this.generateLearningResponse(request, analysis, strategy);
                break;
            case 'technical':
                response.content = this.generateTechnicalResponse(request, analysis, strategy);
                break;
            case 'creative':
                response.content = this.generateCreativeResponse(request, analysis, strategy);
                break;
            case 'personal':
                response.content = this.generatePersonalResponse(request, analysis, strategy);
                break;
            case 'research':
                response.content = this.generateResearchResponse(request, analysis, strategy);
                break;
            default:
                response.content = this.generateGeneralResponse(request, analysis, strategy);
        }
        
        // Add suggestions
        response.suggestions = this.generateSuggestions(analysis, strategy);
        
        // Add resources if applicable
        response.resources = this.findResources(analysis);
        
        // Add follow-up questions
        response.followUp = this.generateFollowUpQuestions(analysis);
        
        return response;
    }
    
    /**
     * Generate productivity response
     */
    generateProductivityResponse(request, analysis, strategy) {
        const templates = {
            directive: [
                "Here's what you need to do: {action}. Let me break it down for you.",
                "To accomplish this: {steps}. I'll help you stay on track.",
                "Let's tackle this systematically: {plan}. Ready to start?"
            ],
            collaborative: [
                "Let's work on this together! I suggest we {approach}. What do you think?",
                "I can help you organize this. How about we {method}?",
                "Here's an idea: {suggestion}. Would you like to try this approach?"
            ],
            supportive: [
                "You've got this! Let me help you break it down: {steps}.",
                "I'm here to support you. We can {approach} at your own pace.",
                "Don't worry, we'll figure this out together. Let's start with {first_step}."
            ]
        };
        
        const template = templates[strategy.approach][Math.floor(Math.random() * templates[strategy.approach].length)];
        
        return template.replace(/{\w+}/g, (match) => {
            switch (match) {
                case '{action}': return 'prioritize your tasks and focus on what\'s most important';
                case '{steps}': return '1) List your tasks 2) Prioritize by urgency 3) Break down large tasks';
                case '{plan}': return 'create a clear action plan with specific, achievable goals';
                case '{approach}': return 'use the Eisenhower matrix to categorize your tasks';
                case '{method}': return 'try the Pomodoro technique for better focus';
                case '{suggestion}': return 'set up a time-blocking system for your day';
                case '{first_step}': return 'identifying your top 3 priorities for today';
                default: return match;
            }
        });
    }
    
    /**
     * Generate learning response
     */
    generateLearningResponse(request, analysis, strategy) {
        const templates = {
            directive: [
                "Here's what you need to understand: {concept}. Let me explain it clearly.",
                "To learn this: {method}. Follow these steps carefully.",
                "This works by: {explanation}. Pay attention to these key points."
            ],
            collaborative: [
                "Let's explore this together! I think {approach} would work well. What interests you most?",
                "Great question! We can {method} to understand this better. Where should we start?",
                "I'd love to help you learn this. How about we {approach}? Feel free to ask questions!"
            ],
            supportive: [
                "Learning this is totally achievable! Let's break it down: {steps}. You're doing great!",
                "I'm excited to help you learn! We'll take it {pace}. No rush at all.",
                "This might seem complex, but you'll get it! Let's start with {first_step}."
            ]
        };
        
        const template = templates[strategy.approach][Math.floor(Math.random() * templates[strategy.approach].length)];
        
        return template.replace(/{\w+}/g, (match) => {
            switch (match) {
                case '{concept}': return 'the core principles and how they connect';
                case '{method}': return 'start with the basics, practice regularly, and build up gradually';
                case '{explanation}': return 'breaking it down into smaller, manageable pieces';
                case '{approach}': return 'use real-world examples and hands-on practice';
                case '{steps}': return '1) Understand the basics 2) Practice with examples 3) Apply what you\'ve learned';
                case '{pace}': return 'one step at a time, ensuring you understand each concept';
                case '{first_step}': return 'the fundamentals and why they matter';
                default: return match;
            }
        });
    }
    
    /**
     * Generate technical response
     */
    generateTechnicalResponse(request, analysis, strategy) {
        const templates = {
            directive: [
                "Here's the solution: {solution}. Implement it step by step.",
                "To fix this: {steps}. Follow this approach carefully.",
                "The technical approach: {method}. Let me guide you through it."
            ],
            collaborative: [
                "Let's debug this together! I suspect {issue}. What have you tried so far?",
                "Interesting technical challenge! How about we {approach}? I'll help you implement it.",
                "I see the issue. Let's work on {solution} together. Sound good?"
            ],
            supportive: [
                "Technical issues can be frustrating! Let's solve this: {steps}. You're on the right track!",
                "Don't worry, every developer faces this. We'll figure it out: {approach}.",
                "I'm here to help you work through this. Let's try {solution} step by step."
            ]
        };
        
        const template = templates[strategy.approach][Math.floor(Math.random() * templates[strategy.approach].length)];
        
        return template.replace(/{\w+}/g, (match) => {
            switch (match) {
                case '{solution}': return 'check the error logs and identify the root cause';
                case '{steps}': return '1) Identify the error 2) Research the issue 3) Apply the fix 4) Test the solution';
                case '{method}': return 'systematic debugging with proper error handling';
                case '{issue}': return 'there might be a syntax error or missing dependency';
                case '{approach}': return 'use a divide-and-conquer strategy to isolate the problem';
                default: return match;
            }
        });
    }
    
    /**
     * Generate creative response
     */
    generateCreativeResponse(request, analysis, strategy) {
        const templates = {
            directive: [
                "Here's a creative approach: {idea}. Try this technique.",
                "For your creative project: {suggestion}. Follow this method.",
                "Let's create something amazing: {approach}. Here's how to start."
            ],
            collaborative: [
                "This is exciting! Let's brainstorm together. I'm thinking {idea}. What inspires you?",
                "Creative projects are fun! How about we {approach}? I'd love to see what you create!",
                "Let's explore some creative possibilities! I suggest {idea}. What direction feels right to you?"
            ],
            supportive: [
                "Your creativity is awesome! Let's nurture it with {approach}. You're going to create something wonderful!",
                "I love helping with creative projects! Let's try {idea} and see where it takes us.",
                "Creativity flows best when you're relaxed. Let's {approach} and enjoy the process!"
            ]
        };
        
        const template = templates[strategy.approach][Math.floor(Math.random() * templates[strategy.approach].length)];
        
        return template.replace(/{\w+}/g, (match) => {
            switch (match) {
                case '{idea}': return 'starting with a mind map to explore different directions';
                case '{suggestion}': return 'using the SCAMPER technique to generate innovative ideas';
                case '{approach}': return 'experiment with different styles and see what resonates';
                default: return match;
            }
        });
    }
    
    /**
     * Generate personal response
     */
    generatePersonalResponse(request, analysis, strategy) {
        const templates = {
            directive: [
                "Here's my advice: {advice}. Take this approach.",
                "For your situation: {guidance}. This should help.",
                "Let me offer some guidance: {suggestion}. Consider this carefully."
            ],
            collaborative: [
                "I'm here to listen and help. Let's talk about {approach}. How does that resonate with you?",
                "Thank you for sharing this with me. Let's explore {idea} together. What feels most helpful?",
                "I appreciate your trust. Let's work through {situation} together. What support would be most valuable?"
            ],
            supportive: [
                "I'm here for you. Let's navigate this together: {support}. You're not alone in this.",
                "It takes courage to reach out. Let's find {solution} together. I believe in you!",
                "Thank you for trusting me with this. Let's take {approach} one step at a time. I'm here to support you."
            ]
        };
        
        const template = templates[strategy.approach][Math.floor(Math.random() * templates[strategy.approach].length)];
        
        return template.replace(/{\w+}/g, (match) => {
            switch (match) {
                case '{advice}': return 'focus on what you can control and take small, consistent steps';
                case '{guidance}': return 'be kind to yourself and celebrate small victories';
                case '{suggestion}': return 'try journaling your thoughts to gain clarity';
                case '{approach}': return 'different perspectives and find what works best for you';
                case '{idea}': return 'healthy coping strategies and self-compassion';
                case '{situation}': return 'this challenge with patience and self-understanding';
                case '{support}': return 'healthy ways to process your feelings and move forward';
                case '{solution}': return 'balance between addressing the issue and practicing self-care';
                default: return match;
            }
        });
    }
    
    /**
     * Generate research response
     */
    generateResearchResponse(request, analysis, strategy) {
        const templates = {
            directive: [
                "Here's what I found: {findings}. Use this information.",
                "Based on research: {data}. Here are the key points.",
                "The research shows: {results}. Consider these findings."
            ],
            collaborative: [
                "Let's explore this together! I found {information}. What aspects interest you most?",
                "Interesting research topic! Here's what I discovered: {findings}. Want to dive deeper into anything?",
                "I've gathered some information: {data}. What would you like to explore further?"
            ],
            supportive: [
                "Research can be overwhelming! Let me help: {approach}. We'll find what you need.",
                "I'm excited to help you research! Let's start with {first_step}. You're doing great!",
                "Don't worry, I'll help you navigate this information. Let's begin with {approach}."
            ]
        };
        
        const template = templates[strategy.approach][Math.floor(Math.random() * templates[strategy.approach].length)];
        
        return template.replace(/{\w+}/g, (match) => {
            switch (match) {
                case '{findings}': return 'several relevant sources with key insights';
                case '{data}': return 'comprehensive information from reliable sources';
                case '{results}': return 'patterns and trends that address your question';
                case '{information}': return 'valuable insights from multiple perspectives';
                case '{approach}': return 'identifying reliable sources and extracting key information';
                case '{first_step}': return 'clarifying your research question and objectives';
                default: return match;
            }
        });
    }
    
    /**
     * Generate general response
     */
    generateGeneralResponse(request, analysis, strategy) {
        const templates = {
            directive: [
                "Here's what I can help you with: {assistance}. Let's get started.",
                "For your request: {response}. This should address your needs.",
                "I can assist you with: {help}. Follow this approach."
            ],
            collaborative: [
                "I'd be happy to help! Let's {approach} together. What works best for you?",
                "Great question! Let's explore {possibility}. How can I best assist you?",
                "I'm here to help! Let's work on {solution} together. What are your thoughts?"
            ],
            supportive: [
                "I'm here to help you succeed! Let's {approach}. You've got this!",
                "Happy to assist! We'll figure this out together: {support}.",
                "I'm excited to help! Let's take {method} and make progress together."
            ]
        };
        
        const template = templates[strategy.approach][Math.floor(Math.random() * templates[strategy.approach].length)];
        
        return template.replace(/{\w+}/g, (match) => {
            switch (match) {
                case '{assistance}': return 'providing helpful information and guidance';
                case '{response}': return 'a thoughtful and comprehensive answer';
                case '{help}': return 'breaking down your request into manageable parts';
                case '{approach}': return 'address your needs step by step';
                case '{possibility}': return 'different ways to help you achieve your goal';
                case '{solution}': return 'finding the best approach for your situation';
                case '{support}': return 'providing the assistance you need';
                case '{method}': return 'a structured approach to solve your problem';
                default: return match;
            }
        });
    }
    
    /**
     * Generate suggestions based on analysis
     */
    generateSuggestions(analysis, strategy) {
        const suggestions = [];
        
        switch (analysis.type) {
            case 'productivity':
                suggestions.push('Try the Pomodoro technique for better focus');
                suggestions.push('Use time-blocking to organize your day');
                break;
            case 'learning':
                suggestions.push('Practice with real-world examples');
                suggestions.push('Teach what you\'ve learned to reinforce understanding');
                break;
            case 'technical':
                suggestions.push('Check the documentation for best practices');
                suggestions.push('Use debugging tools to identify issues');
                break;
            case 'creative':
                suggestions.push('Experiment with different approaches');
                suggestions.push('Take breaks to refresh your creativity');
                break;
        }
        
        return suggestions;
    }
    
    /**
     * Find relevant resources
     */
    findResources(analysis) {
        const resources = [];
        
        // Add relevant resources based on type
        switch (analysis.type) {
            case 'learning':
                resources.push({ type: 'tutorial', title: 'Comprehensive Learning Guide', url: '#' });
                resources.push({ type: 'video', title: 'Visual Explanation', url: '#' });
                break;
            case 'technical':
                resources.push({ type: 'documentation', title: 'Technical Documentation', url: '#' });
                resources.push({ type: 'forum', title: 'Community Support', url: '#' });
                break;
            case 'productivity':
                resources.push({ type: 'tool', title: 'Productivity Tools', url: '#' });
                resources.push({ type: 'template', title: 'Planning Templates', url: '#' });
                break;
        }
        
        return resources;
    }
    
    /**
     * Generate follow-up questions
     */
    generateFollowUpQuestions(analysis) {
        const questions = [];
        
        switch (analysis.type) {
            case 'productivity':
                questions.push('What specific tasks are you working on?');
                questions.push('What\'s your biggest productivity challenge?');
                break;
            case 'learning':
                questions.push('What would you like to learn next?');
                questions.push('How can I best support your learning style?');
                break;
            case 'technical':
                questions.push('Have you tried any solutions yet?');
                questions.push('What error messages are you seeing?');
                break;
        }
        
        return questions;
    }
    
    /**
     * Learn from interaction
     */
    learnFromInteraction(request, analysis, response) {
        const interaction = {
            timestamp: Date.now(),
            request: request,
            analysis: analysis,
            response: response,
            userContext: { ...this.userContext },
            feedback: null
        };
        
        this.learningSystem.userInteractions.push(interaction);
        
        // Keep only last 100 interactions
        if (this.learningSystem.userInteractions.length > 100) {
            this.learningSystem.userInteractions = this.learningSystem.userInteractions.slice(-100);
        }
    }
    
    /**
     * Check for proactive assistance opportunities
     */
    checkProactiveOpportunities(analysis) {
        if (this.userContext.preferences.proactiveLevel === 'minimal') {
            return;
        }
        
        // Time-based proactive assistance
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        for (const pattern of this.proactivePatterns.timeBased) {
            if (pattern.time === currentTime) {
                this.offerProactiveAssistance(pattern);
            }
        }
        
        // Context-based proactive assistance
        for (const pattern of this.proactivePatterns.contextBased) {
            if (analysis.keywords.includes(pattern.trigger)) {
                this.offerProactiveAssistance(pattern);
            }
        }
    }
    
    /**
     * Offer proactive assistance
     */
    offerProactiveAssistance(pattern) {
        console.log(`[HelpfulAssistant] Proactive assistance: ${pattern.message}`);
        
        // In a real implementation, this would trigger a notification or suggestion
        // For now, just log it
    }
    
    /**
     * Detect current task from request
     */
    detectCurrentTask(request) {
        // Simple task detection
        const taskKeywords = ['working on', 'doing', 'trying to', 'need to', 'help me'];
        const lowerRequest = request.toLowerCase();
        
        for (const keyword of taskKeywords) {
            if (lowerRequest.includes(keyword)) {
                return request.substring(request.toLowerCase().indexOf(keyword) + keyword.length).trim();
            }
        }
        
        return null;
    }
    
    /**
     * Update user preferences
     */
    updatePreferences(preferences) {
        this.userContext.preferences = { ...this.userContext.preferences, ...preferences };
        console.log('[HelpfulAssistant] ✓ User preferences updated');
    }
    
    /**
     * Get assistance statistics
     */
    getStatistics() {
        const totalInteractions = this.learningSystem.userInteractions.length;
        const typeDistribution = {};
        
        this.learningSystem.userInteractions.forEach(interaction => {
            const type = interaction.analysis.type;
            typeDistribution[type] = (typeDistribution[type] || 0) + 1;
        });
        
        return {
            totalInteractions,
            typeDistribution,
            averageSessionLength: this.calculateAverageSessionLength(),
            userSkillLevel: this.userContext.skillLevel,
            preferences: this.userContext.preferences
        };
    }
    
    /**
     * Calculate average session length
     */
    calculateAverageSessionLength() {
        if (this.userContext.activityHistory.length === 0) {
            return 0;
        }
        
        const sessionLengths = this.userContext.activityHistory.map(activity => activity.sessionDuration);
        const average = sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length;
        
        return average / 1000 / 60; // Convert to minutes
    }
}

export default HelpfulAssistant;
