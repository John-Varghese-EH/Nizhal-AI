/**
 * LiveKitService.js
 * Manages LiveKit server connections, rooms, and token generation for Nizhal AI
 */

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

export class LiveKitService {
    constructor() {
        // Load config from environment
        this.config = {
            url: process.env.LIVEKIT_URL || '',
            apiKey: process.env.LIVEKIT_API_KEY || '',
            apiSecret: process.env.LIVEKIT_API_SECRET || '',
        };

        // Initialize room service client
        if (this.config.apiKey && this.config.apiSecret) {
            this.roomService = new RoomServiceClient(
                this.config.url,
                this.config.apiKey,
                this.config.apiSecret
            );
        }

        // Track active connections
        this.activeRooms = new Map(); // roomName -> { participants, metadata }
        this.userToken = null;

        console.log('[LiveKitService] Initialized with URL:', this.config.url);
    }

    /**
     * Check if LiveKit is configured
     */
    isConfigured() {
        return !!(this.config.url && this.config.apiKey && this.config.apiSecret);
    }

    /**
     * Generate access token for a user to join a room
     * @param {string} roomName - Name of the room
     * @param {string} participantName - User's display name
     * @param {object} options - Additional options (permissions, metadata)
     */
    async generateToken(roomName, participantName, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('LiveKit not configured. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in .env');
        }

        const {
            canPublish = true,
            canSubscribe = true,
            canPublishData = true,
            metadata = '',
            ttl = '1h' // Token validity
        } = options;

        // Create access token
        const token = new AccessToken(this.config.apiKey, this.config.apiSecret, {
            identity: participantName,
            name: participantName,
            metadata: metadata,
            ttl: ttl,
        });

        // Set permissions
        token.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish,
            canSubscribe,
            canPublishData,
        });

        const jwt = await token.toJwt();

        console.log('[LiveKitService] Generated token for', participantName, 'in room', roomName);

        return {
            token: jwt,
            url: this.config.url,
            roomName,
            participantName
        };
    }

    /**
     * Create or get a room for the user
     * @param {string} userName - User's name
     * @param {string} personalityMode - Current personality (gf, bf, jarvis, lachu)
     */
    async createOrGetRoom(userName, personalityMode = 'gf', explicitRoomName = null) {
        const roomName = explicitRoomName || `nizhal-${userName}-${Date.now()}`;

        try {
            // Check if room already exists in active rooms
            if (this.activeRooms.has(roomName)) {
                return roomName;
            }

            // Create room with metadata
            const room = await this.roomService.createRoom({
                name: roomName,
                emptyTimeout: 60, // Auto-close after 60s of inactivity
                maxParticipants: 10, // Increased for team calls
                metadata: JSON.stringify({
                    personality: personalityMode,
                    createdAt: new Date().toISOString(),
                    app: 'nizhal-ai',
                    type: explicitRoomName ? 'persistent' : 'ephemeral'
                })
            });

            this.activeRooms.set(roomName, {
                name: roomName,
                personality: personalityMode,
                createdAt: Date.now()
            });

            console.log('[LiveKitService] Created/Joined room:', roomName);
            return roomName;
        } catch (error) {
            // Room might already exist, that's ok
            console.log('[LiveKitService] Room creation note:', error.message);
            // Even if creation failed (e.g. exists), we track it locally
            if (!this.activeRooms.has(roomName)) {
                this.activeRooms.set(roomName, {
                    name: roomName,
                    personality: personalityMode,
                    createdAt: Date.now()
                });
            }
            return roomName;
        }
    }

    /**
     * Generate token for user to join their personal room
     */
    async getUserRoomToken(userName, personalityMode = 'gf', roomName = null) {
        const targetRoom = await this.createOrGetRoom(userName, personalityMode, roomName);

        return this.generateToken(targetRoom, userName, {
            canPublish: true,
            canSubscribe: true,
            metadata: JSON.stringify({ role: 'user' })
        });
    }

    /**
     * Generate token for AI agent to join the room
     */
    async getAgentRoomToken(roomName, personalityMode = 'gf') {
        const agentName = `AI-${personalityMode.toUpperCase()}`;

        return this.generateToken(roomName, agentName, {
            canPublish: true,
            canSubscribe: true,
            metadata: JSON.stringify({
                role: 'agent',
                personality: personalityMode
            })
        });
    }

    /**
     * List all active rooms
     */
    async listRooms() {
        if (!this.roomService) return [];

        try {
            const rooms = await this.roomService.listRooms();
            return rooms;
        } catch (error) {
            console.error('[LiveKitService] Failed to list rooms:', error);
            return [];
        }
    }

    /**
     * Delete a room
     */
    async deleteRoom(roomName) {
        if (!this.roomService) return false;

        try {
            await this.roomService.deleteRoom(roomName);
            this.activeRooms.delete(roomName);
            console.log('[LiveKitService] Deleted room:', roomName);
            return true;
        } catch (error) {
            console.error('[LiveKitService] Failed to delete room:', error);
            return false;
        }
    }

    /**
     * Update room personality metadata when user switches
     */
    async updateRoomPersonality(roomName, newPersonality) {
        if (!this.roomService) return false;

        try {
            await this.roomService.updateRoomMetadata(
                roomName,
                JSON.stringify({ personality: newPersonality })
            );

            const room = this.activeRooms.get(roomName);
            if (room) {
                room.personality = newPersonality;
            }

            console.log('[LiveKitService] Updated room personality:', newPersonality);
            return true;
        } catch (error) {
            console.error('[LiveKitService] Failed to update room:', error);
            return false;
        }
    }

    /**
     * Get room participants
     */
    async getParticipants(roomName) {
        if (!this.roomService) return [];

        try {
            const participants = await this.roomService.listParticipants(roomName);
            return participants;
        } catch (error) {
            console.error('[LiveKitService] Failed to get participants:', error);
            return [];
        }
    }

    /**
     * Cleanup all rooms on shutdown
     */
    async cleanup() {
        console.log('[LiveKitService] Cleaning up rooms...');

        for (const roomName of this.activeRooms.keys()) {
            await this.deleteRoom(roomName);
        }
    }
}

export default LiveKitService;
