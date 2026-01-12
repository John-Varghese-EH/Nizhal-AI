/**
 * NizhalAI - Emotional AI Companion Engine
 * 
 * Orchestrates:
 * - EmotionEngine: Advanced emotion analysis
 * - PersonalitySystem: GF/BF/JARVIS personas
 * - ContextManager: Memory and context
 * - VoiceService: Text-to-Speech
 * - Animation & VRM synchronization
 */

import { Emotion, PersonalityMode } from './AppStateService.js';
import EmotionEngine from './EmotionEngine.js';
import PersonalitySystem from './PersonalitySystem.js';
import ContextManager from './ContextManager.js';
import VoiceService from '../services/VoiceService.js';
import { relationshipMemory } from './RelationshipMemory.js';
import { proactiveService } from './ProactiveService.js';
import { usageAnalytics } from '../services/UsageAnalytics.js';

// Interaction States
const InteractionState = {
    IDLE: 'idle',
    LISTENING: 'listening',
    PROCESSING: 'processing',
    SPEAKING: 'speaking'
};

// Emotion to animation mapping (kept for reference, but can be dynamic)
const EMOTION_ANIMATIONS = {
    happy: ['02_Greeting', '11_Hello', '17_Smile_World', '18_Lovely_World'],
    excited: ['05_Spin', '03_Peace_Sign', '14_Gekirei', '19_Cute_Sparkle_World'],
    sad: ['09_Dogeza', '15_Gatan'],
    thinking: ['08_Motion_Pose', '12_Smartphone'],
    neutral: ['17_Smile_World', '18_Lovely_World', '20_Connected_World'],
    concerned: ['15_Gatan', '09_Dogeza'],
    playful: ['05_Spin', '03_Peace_Sign', '04_Shoot'],
    angry: ['13_Angry', '06_Chest_Pump'], // Added angry
    calm: ['08_Motion_Pose'], // Added calm
    thoughtful: ['12_Smartphone'] // Added thoughtful
};

// Emotion to VRM expression mapping
const EMOTION_EXPRESSIONS = {
    happy: { preset: 'happy', intensity: 0.8 },
    excited: { preset: 'happy', intensity: 1.0, addBlink: true },
    sad: { preset: 'sad', intensity: 0.7 },
    thinking: { preset: 'neutral', intensity: 0.5, lookUp: true },
    neutral: { preset: 'neutral', intensity: 0.3 },
    concerned: { preset: 'sad', intensity: 0.5 },
    playful: { preset: 'happy', intensity: 0.6 },
    angry: { preset: 'angry', intensity: 0.8 },
    calm: { preset: 'relaxed', intensity: 0.5 },
    thoughtful: { preset: 'neutral', intensity: 0.4, lookUp: true }
};

/**
 * NizhalAI Class - Main emotional AI companion engine
 */
export class NizhalAI {
    constructor(aiService, personalityCore, appStateService) {
        this.aiService = aiService;
        this.appStateService = appStateService;

        // Initialize Sub-Systems
        this.emotionEngine = new EmotionEngine();
        this.personalitySystem = new PersonalitySystem();

        // Pass store if available for persistence
        const store = appStateService?.store;
        this.contextManager = new ContextManager(store);

        this.voiceService = new VoiceService(process.env.ELEVENLABS_API_KEY || '');

        // Phase 2: Intelligence
        this.memory = relationshipMemory;
        this.proactive = proactiveService;

        // Initialize Proactive Service
        this.proactive.on('trigger', (data) => this.handleProactiveTrigger(data));
        this.proactive.start();

        // State Machine
        this.interactionState = InteractionState.IDLE;

        // Callbacks
        this.onAnimationTrigger = null;
        this.onExpressionChange = null;
        this.onEmotionChange = null;
        this.onVoiceStart = null;
        this.onVoiceEnd = null;
    }

    /**
     * Process user input and generate emotional response
     * @param {string} input - User message
     * @returns {Promise<Object>} Response with text, emotion, and animation trigger
     */
    async process(input) {
        this._setInteractionState(InteractionState.PROCESSING);

        try {
            // 0. Update Memory Milestones
            this.memory.incrementMessageCount();
            usageAnalytics.trackEvent('message', 'send');

            // 1. Get Application State
            const personalityMode = this.appStateService?.get('ai.personalityMode') || PersonalityMode.GF;

            // 2. Context & Emotion Analysis
            const context = this.contextManager.getContext();
            const emotionData = this.emotionEngine.analyzeEmotion(input, context);
            const detectedEmotion = emotionData.primary;

            console.log(`[NizhalAI] Input: "${input}" | Detected: ${detectedEmotion} (${emotionData.intensity})`);

            // 3. Generate Response (LLM or Template)
            // Try PersonalitySystem template first for immediate "feeling"
            // In full production, this might just prompt the LLM with the template as system instruction
            let responseText = "";
            let responseDetails = null;

            // Optional: Check for simple template match first (faster, consistent personality)
            // But we prefer LLM for dynamic conversation. 
            // We use PersonalitySystem to get the "Tone" and "Style" to inject into LLM.

            if (this.aiService) {
                // LLM Generation
                const profile = this.personalitySystem.getProfile(personalityMode);
                const emotionContext = this._buildPromptContext(detectedEmotion, profile, context);

                // We could prepend this context to the message or use a system prompt
                // For this implementation, we assume aiService.chat handles history, so we just send input
                // Ideally, we'd inject the "Emotion Context" into the system prompt of the turn.

                // Hack: We pre-pend instruction if acceptable by aiService, or rely on aiService's own persona handling.
                // Let's assume aiService is robust. We will use the Template system for fallback or "flavoring".

                const aiResult = await this.aiService.chat(input);

                if (aiResult.success) {
                    responseText = aiResult.response;
                    responseDetails = aiResult;
                } else {
                    console.warn('[NizhalAI] AI Service failed, falling back to templates:', aiResult.error);
                    const result = this.personalitySystem.generateResponse(input, detectedEmotion, personalityMode, { userName: 'User', ...context });
                    responseText = result.text;
                    responseDetails = result;
                }
            } else {
                // Fallback to Template System
                const result = this.personalitySystem.generateResponse(input, detectedEmotion, personalityMode, { userName: 'User', ...context });
                responseText = result.text;
                responseDetails = result;
            }

            // 4. Determine Output Emotion & Behaviour
            // Analyze the *response* to see what emotion the AI actually expressed
            const aiEmotionData = this.emotionEngine.analyzeEmotion(responseText);
            const responseEmotion = aiEmotionData.primary;

            // 5. Update Context
            this.contextManager.update(input, detectedEmotion, responseText);

            // 6. Update App State
            if (this.appStateService) {
                this.appStateService.setEmotion(responseEmotion);
            }

            // 7. Trigger Output (Animation, Expression, Voice)
            const animation = this.triggerBehavior(responseEmotion, personalityMode);

            // 8. Voice Synthesis (Async)
            this._speakResponse(responseText, personalityMode, aiEmotionData);

            this._setInteractionState(InteractionState.IDLE);

            return {
                text: responseText,
                emotion: responseEmotion,
                detectedEmotion,
                animation,
                expression: this.getExpressionData(responseEmotion),
                personalityMode
            };

        } catch (error) {
            console.error('[NizhalAI] Process error:', error);
            this._setInteractionState(InteractionState.IDLE);
            return this.getErrorResponse();
        }
    }

    /**
     * Trigger animations and expressions based on emotion
     */
    triggerBehavior(emotion, personalityMode) {
        // Animation
        const animation = this.getAnimationTrigger(emotion);
        if (this.onAnimationTrigger) {
            this.onAnimationTrigger(animation, emotion);
        }

        // Expression
        const expression = this.getExpressionData(emotion);
        if (this.onExpressionChange) {
            this.onExpressionChange(expression, emotion);
        }

        // Notify
        if (this.onEmotionChange) {
            this.onEmotionChange(emotion, null);
        }

        return animation;
    }

    /**
     * Handle Voice Synthesis
     */
    async _speakResponse(text, personalityMode, emotionData) {
        this._setInteractionState(InteractionState.SPEAKING);
        if (this.onVoiceStart) this.onVoiceStart();

        const profile = this.personalitySystem.getProfile(personalityMode);

        try {
            await this.voiceService.speak(text, profile, emotionData);
        } catch (e) {
            console.warn('[NizhalAI] Voice error:', e);
        }

        if (this.onVoiceEnd) this.onVoiceEnd();
        this._setInteractionState(InteractionState.IDLE);
    }

    async handleProactiveTrigger(data) {
        // Trigger voice/chat when proactive service fires
        console.log('[NizhalAI] Handling proactive trigger:', data);

        // Show as a notification or speak it
        // For now, we'll use the voice service specifically
        const currentMode = this.appStateService?.getPersonalityMode?.() || 'gf';
        const profile = this.personalitySystem.getProfile(currentMode);

        if (this.voiceService) {
            await this.voiceService.speak(data.message, profile, 'happy');
        }

        // Also emit event for UI to show bubble
        if (this.appStateService?.emit) {
            this.appStateService.emit('avatar:speak', { text: data.message });
        }
    }

    _setInteractionState(state) {
        this.interactionState = state;
        // Could broadcast this change via appStateService if needed
    }

    _buildPromptContext(emotion, profile, context) {
        // Helper to construct a system prompt addition if we were sending it to LLM
        return `User is feeling ${emotion}. You are ${profile.name}. Tone: ${profile.tone}.`;
    }

    // --- Helpers from original file, updated ---

    getAnimationTrigger(emotion) {
        const animations = EMOTION_ANIMATIONS[emotion] || EMOTION_ANIMATIONS.neutral;
        return animations[Math.floor(Math.random() * animations.length)];
    }

    getExpressionData(emotion) {
        return EMOTION_EXPRESSIONS[emotion] || EMOTION_EXPRESSIONS.neutral;
    }

    getErrorResponse() {
        return {
            text: "I'm having a little trouble thinking right now. Give me a moment? 💕",
            emotion: Emotion.CONCERNED,
            animation: null,
            expression: EMOTION_EXPRESSIONS.concerned
        };
    }

    // Pass-through setters
    setPersonalityMode(mode) {
        if (this.appStateService) {
            this.appStateService.setPersonalityMode(mode);
        }
    }

    triggerEmotion(emotion) {
        // Manually trigger
        this.triggerBehavior(emotion, this.appStateService?.get('ai.personalityMode'));
    }

    // Event Registration
    onAnimation(cb) { this.onAnimationTrigger = cb; }
    onExpression(cb) { this.onExpressionChange = cb; }
    onEmotion(cb) { this.onEmotionChange = cb; }
    onVoiceStart(cb) { this.onVoiceStart = cb; }
    onVoiceEnd(cb) { this.onVoiceEnd = cb; }
}

export default NizhalAI;
