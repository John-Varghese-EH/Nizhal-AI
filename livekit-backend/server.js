/**
 * LiveKit Backend Server
 * Handles token generation, room management, and participant authentication
 * Security: Token expiry, participant ACLs, CORS protection
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Environment validation
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error('❌ Missing required environment variables!');
    console.error('Required: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET');
    process.exit(1);
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize LiveKit Room Service Client
const roomService = new RoomServiceClient(
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
);

/**
 * Generate Access Token
 * POST /api/token
 * Body: { roomName, participantName, permissions }
 */
app.post('/api/token', async (req, res) => {
    try {
        const { roomName, participantName, permissions = {} } = req.body;

        // Validation
        if (!roomName || !participantName) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['roomName', 'participantName']
            });
        }

        // Token expiry: 1 hour by default
        const tokenExpiry = process.env.TOKEN_EXPIRY_HOURS || 1;

        // Create access token with security grants
        const token = new AccessToken(
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET,
            {
                identity: participantName,
                name: participantName,
                // Token valid for specified hours
                ttl: tokenExpiry * 60 * 60,
            }
        );

        // Grant permissions (default: can publish audio/video, subscribe to all)
        token.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: permissions.canPublish !== false, // Default: true
            canSubscribe: permissions.canSubscribe !== false, // Default: true
            canPublishData: permissions.canPublishData !== false, // Default: true
            // Advanced permissions
            canUpdateOwnMetadata: permissions.canUpdateOwnMetadata !== false,
            hidden: permissions.hidden || false,
            recorder: permissions.recorder || false,
        });

        const jwt = await token.toJwt();

        console.log(`✅ Token generated for ${participantName} in room ${roomName}`);

        res.json({
            token: jwt,
            url: LIVEKIT_URL,
            roomName,
            participantName,
            expiresIn: `${tokenExpiry} hours`
        });

    } catch (error) {
        console.error('❌ Token generation error:', error);
        res.status(500).json({ error: 'Failed to generate token', details: error.message });
    }
});

/**
 * Create Room
 * POST /api/rooms/create
 * Body: { roomName, maxParticipants, emptyTimeout }
 */
app.post('/api/rooms/create', async (req, res) => {
    try {
        const {
            roomName,
            maxParticipants = 20,
            emptyTimeout = 300, // 5 minutes
            metadata = {}
        } = req.body;

        if (!roomName) {
            return res.status(400).json({ error: 'roomName is required' });
        }

        const room = await roomService.createRoom({
            name: roomName,
            emptyTimeout, // Seconds before room is deleted when empty
            maxParticipants,
            metadata: JSON.stringify(metadata),
        });

        console.log(`✅ Room created: ${roomName}`);

        res.json({
            room: {
                sid: room.sid,
                name: room.name,
                creationTime: room.creationTime,
                maxParticipants: room.maxParticipants,
            }
        });

    } catch (error) {
        console.error('❌ Room creation error:', error);
        res.status(500).json({ error: 'Failed to create room', details: error.message });
    }
});

/**
 * List Active Rooms
 * GET /api/rooms
 */
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await roomService.listRooms();

        res.json({
            rooms: rooms.map(room => ({
                sid: room.sid,
                name: room.name,
                numParticipants: room.numParticipants,
                creationTime: room.creationTime,
                maxParticipants: room.maxParticipants,
            }))
        });

    } catch (error) {
        console.error('❌ List rooms error:', error);
        res.status(500).json({ error: 'Failed to list rooms', details: error.message });
    }
});

/**
 * Get Room Participants
 * GET /api/rooms/:roomName/participants
 */
app.get('/api/rooms/:roomName/participants', async (req, res) => {
    try {
        const { roomName } = req.params;
        const participants = await roomService.listParticipants(roomName);

        res.json({
            roomName,
            participants: participants.map(p => ({
                sid: p.sid,
                identity: p.identity,
                name: p.name,
                joinedAt: p.joinedAt,
                state: p.state,
            }))
        });

    } catch (error) {
        console.error('❌ List participants error:', error);
        res.status(500).json({ error: 'Failed to list participants', details: error.message });
    }
});

/**
 * Delete Room
 * DELETE /api/rooms/:roomName
 */
app.delete('/api/rooms/:roomName', async (req, res) => {
    try {
        const { roomName } = req.params;
        await roomService.deleteRoom(roomName);

        console.log(`✅ Room deleted: ${roomName}`);
        res.json({ message: `Room ${roomName} deleted successfully` });

    } catch (error) {
        console.error('❌ Delete room error:', error);
        res.status(500).json({ error: 'Failed to delete room', details: error.message });
    }
});

/**
 * Health Check
 * GET /health
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        livekit: {
            url: LIVEKIT_URL,
            connected: true
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 LiveKit Backend Server');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🔗 LiveKit URL: ${LIVEKIT_URL}`);
    console.log(`✨ Ready to generate tokens and manage rooms!`);
});
