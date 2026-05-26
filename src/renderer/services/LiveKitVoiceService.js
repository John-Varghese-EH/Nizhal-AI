/**
 * LiveKitVoiceService.js
 *
 * Manage real-time bidirectional WebRTC voice streaming using the LiveKit Client SDK.
 * Renders high-fidelity audio streams strictly inside off-screen media elements,
 * maintaining clean architectural separation from the React DOM tree.
 */

import { Room, RoomEvent, Track, createLocalAudioTrack } from 'livekit-client';

export class LiveKitVoiceService {
    constructor() {
        this.room = null;
        this.localAudioTrack = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.isMuted = false;
        this.agentAudioElement = null;
        this.watchdogTimer = null;
        this.lastHeartbeat = Date.now();

        // Service observers
        this.onConnected = null;
        this.onDisconnected = null;
        this.onSpeakingChanged = null;
        this.onAgentSpeaking = null;
        this.onEmotion = null;
        this.onError = null;

        console.log('[LiveKitVoiceService] Service initialized');
    }

    /**
     * Initializes parameters and runs a defensive self-clean up.
     */
    async init() {
        try {
            await this.reset();
            this.startWatchdog();
            return { success: true };
        } catch (error) {
            console.error('[LiveKitVoiceService] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Establish Webrtc room link.
     */
    async connect(token, url) {
        if (this.isConnected) {
            return { success: true };
        }

        if (this.isConnecting) {
            return { success: false, error: 'Connection in progress' };
        }

        this.isConnecting = true;
        this.lastHeartbeat = Date.now();

        try {
            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
                audioCaptureDefaults: {
                    autoGainControl: true,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            this.setupEventListeners();
            await this.room.connect(url, token);

            if (!this.room || this.room.state === 'disconnected') {
                throw new Error('Connection aborted mid-flight');
            }

            await this.publishMicrophone();

            this.isConnected = true;
            this.isConnecting = false;
            this.lastHeartbeat = Date.now();

            if (this.onConnected) {
                this.onConnected();
            }

            return { success: true };
        } catch (error) {
            this.isConnecting = false;
            this.isConnected = false;

            if (error.message?.includes('Client initiated disconnect') ||
                error.message?.includes('Connection aborted')) {
                return { success: false, error: 'Connection cancelled' };
            }

            console.error('[LiveKitVoiceService] Connection failed:', error);

            if (this.onError) {
                this.onError(error);
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * Listen to active WebRTC events.
     */
    setupEventListeners() {
        if (!this.room) return;

        // Subscribed to AI agent audio track
        this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('[LiveKitVoiceService] Subscribed to audio track from:', participant.identity);

            if (track.kind === Track.Kind.Audio) {
                try {
                    // Detach any pre-existing stream element
                    if (this.agentAudioElement) {
                        try {
                            track.detach(this.agentAudioElement);
                        } catch (e) {}
                    }

                    // Attach off-screen media context. Appending to document.body is bypassed
                    // as modern browsers render fully interactive audio via detached media elements.
                    this.agentAudioElement = track.attach();
                    this.agentAudioElement.volume = 1.0;

                    if (this.onAgentSpeaking) {
                        this.onAgentSpeaking(true);
                    }
                } catch (err) {
                    console.error('[LiveKitVoiceService] Failed to attach audio context:', err);
                }
            }
        });

        // Unsubscribed / Cleanup track
        this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('[LiveKitVoiceService] Track unsubscribed from:', participant.identity);

            if (track.kind === Track.Kind.Audio && this.agentAudioElement) {
                try {
                    track.detach(this.agentAudioElement);
                } catch (e) {}
                this.agentAudioElement = null;

                if (this.onAgentSpeaking) {
                    this.onAgentSpeaking(false);
                }
            }
        });

        // Speaking changes
        this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            this.lastHeartbeat = Date.now();
            if (this.onSpeakingChanged) {
                this.onSpeakingChanged(speakers);
            }
        });

        // Disconnected
        this.room.on(RoomEvent.Disconnected, (reason) => {
            console.log('[LiveKitVoiceService] WebRTC disconnected:', reason);
            this.isConnected = false;
            this.isConnecting = false;

            if (this.onDisconnected) {
                this.onDisconnected(reason);
            }
        });

        // Connection shifts
        this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
            this.lastHeartbeat = Date.now();
            console.log('[LiveKitVoiceService] Connection state shift:', state);
        });

        // Backend telemetry data (e.g. emotion mapping)
        this.room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
            this.lastHeartbeat = Date.now();
            try {
                const decoder = new TextDecoder();
                const strData = decoder.decode(payload);
                const data = JSON.parse(strData);

                if (data.type === 'emotion' && this.onEmotion) {
                    this.onEmotion(data.emotion);
                }
            } catch (error) {
                console.error('[LiveKitVoiceService] Failed to decode inbound data packet:', error);
            }
        });

        this.room.on(RoomEvent.Reconnecting, () => {
            console.warn('[LiveKitVoiceService] Connection weak. Reconnecting...');
        });

        this.room.on(RoomEvent.Reconnected, () => {
            this.lastHeartbeat = Date.now();
            console.log('[LiveKitVoiceService] Connection restored successfully');
        });
    }

    /**
     * Publishes microphone tracks to the active LiveKit workspace.
     */
    async publishMicrophone() {
        if (!this.room || this.localAudioTrack) return;

        try {
            this.localAudioTrack = await createLocalAudioTrack({
                autoGainControl: true,
                echoCancellation: true,
                noiseSuppression: true,
            });

            await this.room.localParticipant.publishTrack(this.localAudioTrack);
            console.log('[LiveKitVoiceService] Microphone track published successfully');
        } catch (error) {
            console.error('[LiveKitVoiceService] Microphone publish failed:', error);
            throw error;
        }
    }

    /**
     * Toggles hardware microphone mute status.
     */
    async toggleMute() {
        if (!this.localAudioTrack) {
            return { success: false, error: 'No active local audio track available' };
        }

        try {
            this.isMuted = !this.isMuted;
            await this.localAudioTrack.setMuted(this.isMuted);
            return { success: true, muted: this.isMuted };
        } catch (error) {
            console.error('[LiveKitVoiceService] Failed to toggle mute state:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Terminate and clean up current active room states.
     */
    async disconnect() {
        try {
            if (this.localAudioTrack) {
                try {
                    this.localAudioTrack.stop();
                } catch (e) {}
                if (this.room) {
                    try {
                        await this.room.localParticipant.unpublishTrack(this.localAudioTrack);
                    } catch (e) {}
                }
                this.localAudioTrack = null;
            }

            if (this.agentAudioElement) {
                this.agentAudioElement = null;
            }

            if (this.room) {
                try {
                    await this.room.disconnect();
                } catch (e) {}
                this.room = null;
            }

            this.isConnected = false;
            this.isConnecting = false;
            return { success: true };
        } catch (error) {
            console.error('[LiveKitVoiceService] Disconnection cleanup error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Starts voice feed.
     */
    async start(token, url) {
        return this.connect(token, url);
    }

    /**
     * Stops active audio feed.
     */
    async stop() {
        return this.disconnect();
    }

    /**
     * Reset service state completely.
     */
    async reset() {
        try {
            await this.disconnect();
            this.room = null;
            this.localAudioTrack = null;
            this.isConnected = false;
            this.isConnecting = false;
            this.isMuted = false;
            this.agentAudioElement = null;
            this.lastHeartbeat = Date.now();
            return { success: true };
        } catch (error) {
            console.error('[LiveKitVoiceService] Reset error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Returns a snapshot of the current service health and state.
     */
    getState() {
        return {
            connected: this.isConnected,
            connecting: this.isConnecting,
            muted: this.isMuted,
            participants: this.room?.numParticipants || 0,
            hasAudioContext: !!this.agentAudioElement,
            healthStatus: this.isConnected && (Date.now() - this.lastHeartbeat > 45000) ? 'degraded' : 'healthy',
        };
    }

    /**
     * Spawns active watchdog loop. If connected but no signal detected for over
     * 60 seconds, trigger reconnect.
     */
    startWatchdog() {
        if (this.watchdogTimer) return;

        this.watchdogTimer = setInterval(async () => {
            if (this.isConnected && (Date.now() - this.lastHeartbeat > 60000)) {
                console.warn('[LiveKitVoiceService] Watchdog triggered - network stale. Resetting...');
                this.lastHeartbeat = Date.now();
                if (this.room) {
                    await this.reset();
                }
            }
        }, 15000);
    }

    stopWatchdog() {
        if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);
            this.watchdogTimer = null;
        }
    }
}

// Singleton export
export const livekitVoiceService = new LiveKitVoiceService();
export default livekitVoiceService;
