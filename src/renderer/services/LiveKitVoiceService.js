/**
 * LiveKitVoiceService.js
 * Frontend service for managing LiveKit voice connections
 */

import {
    Room,
    RoomEvent,
    Track,
    createLocalAudioTrack,
} from 'livekit-client';

export class LiveKitVoiceService {
    constructor() {
        this.room = null;
        this.localAudioTrack = null;
        this.isConnected = false;
        this.isMuted = false;
        this.agentAudioElement = null;

        // Callbacks
        this.onConnected = null;
        this.onDisconnected = null;
        this.onSpeakingChanged = null;
        this.onAgentSpeaking = null;
        this.onError = null;

        console.log('[LiveKitVoice] Service initialized');
    }

    /**
     * Connect to a LiveKit room
     * @param {string} token - JWT token from server
     * @param {string} url - LiveKit server URL
     */
    async connect(token, url) {
        if (this.isConnected) {
            console.log('[LiveKitVoice] Already connected');
            return { success: true };
        }

        try {
            // Create room
            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
                audioCaptureDefaults: {
                    autoGainControl: true,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            // Setup event listeners
            this.setupEventListeners();

            // Connect to room
            await this.room.connect(url, token);

            // Publish microphone
            await this.publishMicrophone();

            this.isConnected = true;
            console.log('[LiveKitVoice] Connected successfully');

            if (this.onConnected) {
                this.onConnected();
            }

            return { success: true };
        } catch (error) {
            console.error('[LiveKitVoice] Connection failed:', error);

            if (this.onError) {
                this.onError(error);
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Setup room event listeners
     */
    setupEventListeners() {
        if (!this.room) return;

        // Track published - AI agent voice
        this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('[Live Kit Voice] Track subscribed:', participant.identity);

            if (track.kind === Track.Kind.Audio) {
                // Create audio element for agent voice
                if (!this.agentAudioElement) {
                    this.agentAudioElement = track.attach();
                    this.agentAudioElement.volume = 1.0;
                    document.body.appendChild(this.agentAudioElement);
                }

                if (this.onAgentSpeaking) {
                    this.onAgentSpeaking(true);
                }
            }
        });

        // Track unsubscribed
        this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('[LiveKitVoice] Track unsubscribed:', participant.identity);

            if (track.kind === Track.Kind.Audio && this.agentAudioElement) {
                track.detach(this.agentAudioElement);

                if (this.onAgentSpeaking) {
                    this.onAgentSpeaking(false);
                }
            }
        });

        // Speaking status changes
        this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            if (this.onSpeakingChanged) {
                this.onSpeakingChanged(speakers);
            }
        });

        // Disconnected
        this.room.on(RoomEvent.Disconnected, (reason) => {
            console.log('[LiveKitVoice] Disconnected:', reason);
            this.isConnected = false;

            if (this.onDisconnected) {
                this.onDisconnected(reason);
            }
        });

        // Connection state changed
        this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
            console.log('[LiveKitVoice] Connection state:', state);
        });

        // Reconnecting
        this.room.on(RoomEvent.Reconnecting, () => {
            console.log('[LiveKitVoice] Reconnecting...');
        });

        // Reconnected
        this.room.on(RoomEvent.Reconnected, () => {
            console.log('[LiveKitVoice] Reconnected');
        });
    }

    /**
     * Publish microphone audio
     */
    async publishMicrophone() {
        if (!this.room || this.localAudioTrack) return;

        try {
            // Create local audio track
            this.localAudioTrack = await createLocalAudioTrack({
                autoGainControl: true,
                echoCancellation: true,
                noiseSuppression: true,
            });

            // Publish to room
            await this.room.localParticipant.publishTrack(this.localAudioTrack);

            console.log('[LiveKitVoice] Microphone published');
        } catch (error) {
            console.error('[LiveKitVoice] Failed to publish microphone:', error);
            throw error;
        }
    }

    /**
     * Toggle mute status
     */
    async toggleMute() {
        if (!this.localAudioTrack) {
            return { success: false, error: 'No audio track' };
        }

        try {
            this.isMuted = !this.isMuted;
            await this.localAudioTrack.setMuted(this.isMuted);

            console.log('[LiveKitVoice] Muted:', this.isMuted);
            return { success: true, muted: this.isMuted };
        } catch (error) {
            console.error('[LiveKitVoice] Failed to toggle mute:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disconnect from the room
     */
    async disconnect() {
        if (!this.room) {
            console.log('[LiveKitVoice] Not connected');
            return { success: true };
        }

        try {
            // Unpublish tracks
            if (this.localAudioTrack) {
                this.localAudioTrack.stop();
                await this.room.localParticipant.unpublishTrack(this.localAudioTrack);
                this.localAudioTrack = null;
            }

            // Remove agent audio element
            if (this.agentAudioElement) {
                this.agentAudioElement.remove();
                this.agentAudioElement = null;
            }

            // Disconnect room
            await this.room.disconnect();
            this.room = null;
            this.isConnected = false;

            console.log('[LiveKitVoice] Disconnected');
            return { success: true };
        } catch (error) {
            console.error('[LiveKitVoice] Disconnect error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            muted: this.isMuted,
            participants: this.room?.numParticipants || 0,
        };
    }
}

export default LiveKitVoiceService;
