
/**
 * VoiceRelay.js
 * Connects the main VoiceService (STT) to the DeviceOrchestrator.
 * Parses natural language intents and routes them.
 */

import { orchestrator } from './Orchestrator.js';

export class VoiceRelay {
    constructor() {
        this.isListening = false;
    }

    /**
     * Process a voice transcript and determine intent
     * @param {string} transcript - The spoken text
     */
    async processVoiceCommand(transcript) {
        const lower = transcript.toLowerCase();

        console.log(`[VoiceRelay] Processing: "${transcript}"`);

        // Basic Keyword Routing (Mock NLP)
        // In a real app, this would use an LLM or NLU service to extract intent.

        if (lower.includes('switch to phone') || lower.includes('use android')) {
            orchestrator.setActiveDevice('android');
            return "Switched control to Android phone.";
        }

        if (lower.includes('switch to desktop') || lower.includes('use pc')) {
            orchestrator.setActiveDevice('desktop');
            return "Switched control to Desktop.";
        }

        if (lower.includes('open instagram') || lower.includes('launch youtube')) {
            // Check active device and route
            return orchestrator.routeCommand(lower, null); // Route to active device
        }

        return null; // Not a system command
    }
}

export const voiceRelay = new VoiceRelay();
