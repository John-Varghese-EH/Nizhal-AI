import { ExpressionController } from './ExpressionController';
import { randomMessagesService } from './RandomMessages';
import { getAvatarStateController } from './AvatarStateController';

/**
 * CompanionPersonality Service (Renderer)
 * Bridges the gap between the main process PersonalityCore (data) 
 * and the renderer's visual/behavioral systems (expressions, messages).
 */

export const PersonalityLevel = {
    STRICT_ASSISTANT: 0, // No emotions, just work
    PROFESSIONAL: 1,     // Polite, mild emotions
    FRIENDLY: 2,         // Warm, jokes, reactive
    EMOTIONAL: 3         // Full range, clingy, very expressive
};

class CompanionPersonalityService {
    constructor() {
        this.level = PersonalityLevel.FRIENDLY;
        this.currentMood = 'neutral';
        this.affection = 50;

        this.expressionController = null; // Reference to existing controller
        this.messageCallback = null; // Callback to show speech bubble
    }

    /**
     * Initialize service
     * @param {ExpressionController} expressionController 
     */
    initialize(expressionController) {
        this.expressionController = expressionController;

        // Listen to personality updates from Main process
        if (window.nizhal && window.nizhal.onMoodChange) {
            window.nizhal.onMoodChange((mood) => this.handleMoodChange(mood));
        }

        // Listen for generic persona updates
        if (window.nizhal && window.nizhal.on) {
            window.nizhal.on('avatar:persona-update', (data) => {
                if (data.affection) this.affection = data.affection;
            });
        }

        // Start random behavior loop
        this.startBehaviorLoop();
    }

    /**
     * Set the desired personality level
     * @param {number} level - From PersonalityLevel enum
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * Register callback for showing messages
     * @param {Function} callback 
     */
    onMessage(callback) {
        this.messageCallback = callback;
    }

    /**
     * Handle mood change from core
     */
    handleMoodChange(mood) {
        this.currentMood = mood;

        // Map core mood to expression
        // Core moods: happy, neutral, concerned, protective, playful, thoughtful
        // Expression controller supports: happy, neutral, surprised, dizzy, scared, sleepy, excited, thinking

        let targetExpression = 'neutral';

        switch (mood) {
            case 'happy': targetExpression = 'happy'; break;
            case 'concerned': targetExpression = 'scared'; break; // Closest mapping
            case 'protective': targetExpression = 'neutral'; break;
            case 'playful': targetExpression = 'excited'; break;
            case 'thoughtful': targetExpression = 'thinking'; break;
            default: targetExpression = 'neutral';
        }

        // Apply expression if controller available
        if (this.expressionController) {
            // Intensity varies by personality level
            let intensity = 0.5;
            if (this.level >= PersonalityLevel.EMOTIONAL) intensity = 1.0;
            else if (this.level <= PersonalityLevel.PROFESSIONAL) intensity = 0.2;

            // Only apply if strictly assistant isn't set (no emotions for level 0)
            if (this.level > PersonalityLevel.STRICT_ASSISTANT) {
                this.expressionController.setExpression(targetExpression, intensity, 0); // 0 = persistent
            }
        }

        // Maybe say something?
        this.tryTriggerRandomMessage(true);
    }

    /**
     * Internal loop for random idle behaviors
     */
    startBehaviorLoop() {
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every check
                this.tryTriggerRandomMessage(false);
            }
        }, 30000); // Check every 30 seconds
    }

    /**
     * Try to trigger a random message based on state
     * @param {boolean} force - Force a message (e.g. on mood change)
     */
    tryTriggerRandomMessage(force = false) {
        if (!this.messageCallback) return;
        if (this.level === PersonalityLevel.STRICT_ASSISTANT) return;

        // Chance logic based on level
        let chance = 0.1; // Default low chance
        if (this.level === PersonalityLevel.EMOTIONAL) chance = 0.8;
        if (this.level === PersonalityLevel.FRIENDLY) chance = 0.4;

        if (!force && Math.random() > chance) return;

        // Generate context-aware message
        const msg = this.generateMessage();
        if (msg) {
            this.messageCallback(msg);
        }
    }

    /**
     * Generate a contextual message using specialized service
     */
    generateMessage() {
        // Get current activity from state controller
        const currentActivity = getAvatarStateController().getState();

        // Map activity to simple string if needed, or pass directly if matches RandomMessages keys
        // AvatarState keys: IDLE, DRAGGING, SITTING, DANCING, SLEEPING, SPEAKING

        return randomMessagesService.getMessage(this.currentMood, currentActivity.toLowerCase());
    }
}

export const companionPersonality = new CompanionPersonalityService();
