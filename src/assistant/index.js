/**
 * Nizhal Assistant - Main Entry Point
 * Orchestrates all "ultimate personal supporter" extensions.
 */

import { RoomManager } from './livekit/RoomManager.js';
import { AdbManager } from './android/AdbManager.js';
import { calendarManager } from './life-manager/Calendar.js';
import { weatherService } from './life-manager/Weather.js';

class NizhalAssistant {
    constructor() {
        console.log('🚀 Initializing Nizhal Assistant Extensions...');

        // Extension 10: LiveKit Hub
        this.roomManager = new RoomManager();

        // Extension 11: Android Control
        this.adbManager = new AdbManager();

        // Extension 12: Life Manager
        this.calendar = calendarManager;
        this.weather = weatherService;

        // Extension 13: Cross-Device Command Center (TODO)
        // this.orchestrator = new Orchestrator();
    }

    /**
     * Start the assistant services
     */
    async start() {
        try {
            console.log('✨ Starting Nizhal Assistant Services...');
            // await this.roomManager.connect(); // Connect on demand or auto-start?
            console.log('✅ Nizhal Assistant Ready');
        } catch (error) {
            console.error('❌ Failed to start Nizhal Assistant:', error);
        }
    }
}

export const assistant = new NizhalAssistant();
export default assistant;
