/**
 * test_companion.js
 * Verification script for Nizhal AI Companion System
 */

import { NizhalAI } from './NizhalAI.js';
import { PersonalityMode, Emotion } from './AppStateService.js';

// Mock dependencies
const mockAppStateService = {
    store: {
        get: () => { },
        set: () => { }
    },
    state: {
        ai: { personalityMode: 'gf' }
    },
    get: (path) => {
        if (path === 'ai.personalityMode') return mockAppStateService.state.ai.personalityMode;
    },
    set: (path, val) => { },
    setPersonalityMode: (mode) => {
        console.log(`[State] Switching mode to: ${mode}`);
        mockAppStateService.state.ai.personalityMode = mode;
    },
    setEmotion: (emotion) => {
        console.log(`[State] Emotion set to: ${emotion}`);
    }
};

const mockAiService = null; // Use internal templates for this test

// Instantiate Engine
const engine = new NizhalAI(mockAiService, null, mockAppStateService);

// Helpers
function separator() { console.log('\n' + '-'.repeat(50) + '\n'); }

async function runTest(title, input, modeOverride = null) {
    separator();
    console.log(`TEST CASE: ${title}`);

    if (modeOverride) {
        engine.setPersonalityMode(modeOverride);
    }

    const result = await engine.process(input);

    console.log(`INPUT: "${input}"`);
    console.log(`RESPONSE: "${result.text}"`);
    console.log(`EMOTION: ${result.emotion} (Detected: ${result.detectedEmotion})`);
    console.log(`ANIMATION: ${result.animation}`);

    return result;
}

async function runSuite() {
    console.log('=== NIZHAL AI COMPANION VALIDATION ===');

    // 1. GF Mode - Happy
    await runTest(
        "1. GF Happy Response",
        "I had a great day!",
        PersonalityMode.GF
    );

    // 2. BF Mode - Supportive
    await runTest(
        "2. BF Supportive Response",
        "Work sucks, I'm so tired.",
        PersonalityMode.BF
    );

    // 3. JARVIS Mode - Professional
    await runTest(
        "3. JARVIS Assistance",
        "Remind me about the meeting at 3pm.",
        PersonalityMode.JARVIS
    );

    // 4. GF Mode - Flirty/Love
    await runTest(
        "4. GF Affection",
        "I love you",
        PersonalityMode.GF
    );

    // 5. Check Memory (Context)
    separator();
    console.log("TEST CASE: 5. Context Memory Check");
    const context = engine.contextManager.getContext();
    console.log("Recorded Interactions:", context.history.length);
    console.log("Last Mood:", context.currentMood);

    console.log('\n=== VALIDATION COMPLETE ===');
}

runSuite();
