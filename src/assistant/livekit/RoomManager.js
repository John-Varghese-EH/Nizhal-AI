/**
 * LiveKit Room Manager
 * Handles connection to voice/video rooms ("personal", "team", "warroom").
 */

import {
    Room,
    RoomEvent,
    VideoPresets,
    createLocalVideoTrack,
    createLocalAudioTrack
} from 'livekit-client';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7880";

export class RoomManager {
    constructor() {
        this.room = null;
        this.currentRoomName = null;
        this.isConnected = false;

        this.rooms = {
            PERSONAL: 'john-personal',
            TEAM: 'team-work',
            WARROOM: 'warroom'
        };
    }

    /**
     * Connect to a specific room
     * Uses IPC to get secure token from Main process
     * @param {string} roomName - Name of the room
     * @returns {Promise<Room>}
     */
    async connect(roomName = this.rooms.PERSONAL) {
        try {
            console.log(`🔌 Requesting connection to room: ${roomName}`);

            // Get token and URL from Main process via IPC
            const response = await window.nizhal.livekit.connect('User', roomName);

            if (!response.success) {
                console.error('❌ Failed to get LiveKit token:', response.error);
                return;
            }

            const { token, url } = response;

            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: VideoPresets.h720.resolution,
                },
            });

            // Set up event listeners
            this.setupEventListeners();

            console.log(`🔌 Connecting to LiveKit URL: ${url}`);
            await this.room.connect(url, token);

            this.isConnected = true;
            this.currentRoomName = this.room.name;
            console.log(`✅ Connected to room: ${this.room.name}`);

            // Publish local tracks
            await this.enableMicrophone(true);

            // Enable Camera by default for "Video Work Properly" request
            // In a real app, this should be a user preference or arg
            await this.enableCamera(true);

            return this.room;
        } catch (error) {
            console.error('❌ Failed to connect to LiveKit room:', error);
            throw error;
        }
    }

    /**
     * Disconnect from current room
     */
    async disconnect() {
        if (this.room) {
            await this.room.disconnect();
            this.isConnected = false;
            this.currentRoomName = null;
            console.log('🔌 Disconnected from LiveKit room');
        }
    }

    setupEventListeners() {
        if (!this.room) return;

        this.room
            .on(RoomEvent.ParticipantConnected, (participant) => {
                console.log(`👤 Participant connected: ${participant.identity}`);
                // Notification/Voice announcement hook here
            })
            .on(RoomEvent.ParticipantDisconnected, (participant) => {
                console.log(`✌️ Participant disconnected: ${participant.identity}`);
            })
            .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                console.log(`📹 Track subscribed: ${track.kind} from ${participant.identity}`);
                // Attach to DOM element if needed (handled by React component typically)
            })
            .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                // Update UI for active speakers
            });
    }

    async enableMicrophone(enable = true) {
        if (!this.room) return;
        try {
            await this.room.localParticipant.setMicrophoneEnabled(enable);
            console.log(`🎤 Microphone ${enable ? 'enabled' : 'disabled'}`);
        } catch (e) {
            console.error('Failed to toggle microphone', e);
        }
    }

    async enableCamera(enable = true) {
        if (!this.room) return;
        try {
            await this.room.localParticipant.setCameraEnabled(enable);
            console.log(`📷 Camera ${enable ? 'enabled' : 'disabled'}`);
        } catch (e) {
            console.error('Failed to toggle camera', e);
        }
    }
}
