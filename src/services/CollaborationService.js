/**
 * CollaborationService.js
 * Screen sharing and collaborative features for the AI companion
 */

export class CollaborationService {
    constructor() {
        this.isSharing = false;
        this.activeSession = null;
        this.participants = new Map();
        this.screenStream = null;
        this.audioStream = null;
        this.collaborationTools = {
            whiteboard: false,
            fileSharing: false,
            voiceChat: false,
            videoChat: false,
            screenControl: false
        };
        
        // Session configuration
        this.sessionConfig = {
            maxParticipants: 10,
            quality: 'high', // 'low', 'medium', 'high', 'ultra'
            frameRate: 30,
            audioEnabled: true,
            videoEnabled: true,
            recordingEnabled: false,
            encryptionEnabled: true
        };
        
        // WebRTC configuration
        this.webrtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        };
        
        // Initialize
        this.initializeCollaboration();
    }
    
    /**
     * Initialize collaboration service
     */
    async initializeCollaboration() {
        try {
            // Check for required APIs
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                console.warn('[CollaborationService] Screen sharing not supported');
            }
            
            // Initialize WebRTC
            await this.initializeWebRTC();
            
            console.log('[CollaborationService] ✓ Collaboration service initialized');
        } catch (error) {
            console.error('[CollaborationService] Failed to initialize:', error);
        }
    }
    
    /**
     * Initialize WebRTC
     */
    async initializeWebRTC() {
        try {
            // Create peer connection
            this.peerConnection = new RTCPeerConnection(this.webrtcConfig);
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.sendIceCandidate(event.candidate);
                }
            };
            
            // Handle remote streams
            this.peerConnection.ontrack = (event) => {
                this.handleRemoteStream(event.streams[0]);
            };
            
            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log('[CollaborationService] Connection state:', this.peerConnection.connectionState);
            };
            
            console.log('[CollaborationService] ✓ WebRTC initialized');
        } catch (error) {
            console.error('[CollaborationService] Failed to initialize WebRTC:', error);
        }
    }
    
    /**
     * Start screen sharing session
     */
    async startScreenSharing(options = {}) {
        try {
            if (this.isSharing) {
                throw new Error('Screen sharing already active');
            }
            
            const config = { ...this.sessionConfig, ...options };
            
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: config.frameRate || 30 }
                },
                audio: config.audioEnabled
            });
            
            // Add screen track to peer connection
            this.screenStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.screenStream);
            });
            
            // Create session
            this.activeSession = {
                id: this.generateSessionId(),
                type: 'screen_sharing',
                startedAt: Date.now(),
                config: config,
                host: true,
                participants: []
            };
            
            this.isSharing = true;
            
            // Handle stream end
            this.screenStream.getVideoTracks()[0].onended = () => {
                this.stopScreenSharing();
            };
            
            console.log('[CollaborationService] ✓ Screen sharing started');
            
            return {
                sessionId: this.activeSession.id,
                stream: this.screenStream,
                config: config
            };
        } catch (error) {
            console.error('[CollaborationService] Failed to start screen sharing:', error);
            throw error;
        }
    }
    
    /**
     * Stop screen sharing
     */
    async stopScreenSharing() {
        if (!this.isSharing) {
            return;
        }
        
        try {
            // Stop screen stream
            if (this.screenStream) {
                this.screenStream.getTracks().forEach(track => track.stop());
                this.screenStream = null;
            }
            
            // Remove tracks from peer connection
            const senders = this.peerConnection.getSenders();
            senders.forEach(sender => {
                this.peerConnection.removeTrack(sender);
            });
            
            // Notify participants
            this.broadcastToParticipants('screen_sharing_ended', {
                sessionId: this.activeSession?.id
            });
            
            // Clear session
            this.activeSession = null;
            this.isSharing = false;
            
            console.log('[CollaborationService] ✓ Screen sharing stopped');
        } catch (error) {
            console.error('[CollaborationService] Failed to stop screen sharing:', error);
        }
    }
    
    /**
     * Join collaboration session
     */
    async joinSession(sessionId, options = {}) {
        try {
            if (this.activeSession) {
                throw new Error('Already in an active session');
            }
            
            // Create offer for joining
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            // Send offer to host
            const response = await this.sendSessionRequest(sessionId, {
                type: 'join_request',
                offer: offer,
                options: options
            });
            
            if (response.accepted) {
                // Set remote description
                await this.peerConnection.setRemoteDescription(response.answer);
                
                // Create participant session
                this.activeSession = {
                    id: sessionId,
                    type: 'participant',
                    joinedAt: Date.now(),
                    config: response.config,
                    host: false,
                    participants: response.participants
                };
                
                console.log('[CollaborationService] ✓ Joined session:', sessionId);
                
                return {
                    sessionId: sessionId,
                    role: 'participant',
                    participants: response.participants
                };
            } else {
                throw new Error('Session join rejected');
            }
        } catch (error) {
            console.error('[CollaborationService] Failed to join session:', error);
            throw error;
        }
    }
    
    /**
     * Leave collaboration session
     */
    async leaveSession() {
        if (!this.activeSession) {
            return;
        }
        
        try {
            // Notify other participants
            this.broadcastToParticipants('participant_left', {
                sessionId: this.activeSession.id,
                participantId: this.getLocalParticipantId()
            });
            
            // Close peer connection
            this.peerConnection.close();
            
            // Clear session
            this.activeSession = null;
            this.isSharing = false;
            
            // Reinitialize WebRTC for next session
            await this.initializeWebRTC();
            
            console.log('[CollaborationService] ✓ Left session');
        } catch (error) {
            console.error('[CollaborationService] Failed to leave session:', error);
        }
    }
    
    /**
     * Start whiteboard collaboration
     */
    async startWhiteboard() {
        try {
            this.collaborationTools.whiteboard = true;
            
            // Initialize whiteboard canvas
            const whiteboard = {
                id: this.generateId(),
                canvas: null,
                strokes: [],
                participants: new Map(),
                enabled: true
            };
            
            // Notify participants
            this.broadcastToParticipants('whiteboard_started', {
                whiteboardId: whiteboard.id
            });
            
            console.log('[CollaborationService] ✓ Whiteboard started');
            
            return whiteboard;
        } catch (error) {
            console.error('[CollaborationService] Failed to start whiteboard:', error);
            throw error;
        }
    }
    
    /**
     * Draw on whiteboard
     */
    drawOnWhiteboard(whiteboardId, stroke) {
        if (!this.collaborationTools.whiteboard) {
            return;
        }
        
        try {
            // Add stroke to local whiteboard
            // This would integrate with actual whiteboard implementation
            
            // Broadcast to participants
            this.broadcastToParticipants('whiteboard_draw', {
                whiteboardId: whiteboardId,
                stroke: stroke,
                participantId: this.getLocalParticipantId()
            });
        } catch (error) {
            console.error('[CollaborationService] Failed to draw on whiteboard:', error);
        }
    }
    
    /**
     * Share file with participants
     */
    async shareFile(file) {
        try {
            if (!this.activeSession) {
                throw new Error('No active session');
            }
            
            // Create file metadata
            const fileMetadata = {
                id: this.generateId(),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: Date.now(),
                uploadedBy: this.getLocalParticipantId()
            };
            
            // Convert file to base64 for sharing
            const reader = new FileReader();
            const fileData = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            // Broadcast file to participants
            this.broadcastToParticipants('file_shared', {
                file: {
                    ...fileMetadata,
                    data: fileData
                }
            });
            
            console.log('[CollaborationService] ✓ File shared:', file.name);
            
            return fileMetadata;
        } catch (error) {
            console.error('[CollaborationService] Failed to share file:', error);
            throw error;
        }
    }
    
    /**
     * Start voice chat
     */
    async startVoiceChat() {
        try {
            if (this.audioStream) {
                throw new Error('Voice chat already active');
            }
            
            // Get microphone stream
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Add audio track to peer connection
            this.audioStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.audioStream);
            });
            
            this.collaborationTools.voiceChat = true;
            
            // Notify participants
            this.broadcastToParticipants('voice_chat_started', {
                participantId: this.getLocalParticipantId()
            });
            
            console.log('[CollaborationService] ✓ Voice chat started');
            
            return this.audioStream;
        } catch (error) {
            console.error('[CollaborationService] Failed to start voice chat:', error);
            throw error;
        }
    }
    
    /**
     * Stop voice chat
     */
    async stopVoiceChat() {
        if (!this.audioStream) {
            return;
        }
        
        try {
            // Stop audio stream
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
            
            // Remove audio tracks from peer connection
            const senders = this.peerConnection.getSenders();
            const audioSenders = senders.filter(sender => 
                sender.track && sender.track.kind === 'audio'
            );
            audioSenders.forEach(sender => {
                this.peerConnection.removeTrack(sender);
            });
            
            this.collaborationTools.voiceChat = false;
            
            // Notify participants
            this.broadcastToParticipants('voice_chat_stopped', {
                participantId: this.getLocalParticipantId()
            });
            
            console.log('[CollaborationService] ✓ Voice chat stopped');
        } catch (error) {
            console.error('[CollaborationService] Failed to stop voice chat:', error);
        }
    }
    
    /**
     * Grant remote control
     */
    async grantRemoteControl(participantId) {
        try {
            if (!this.activeSession || !this.activeSession.host) {
                throw new Error('Only host can grant remote control');
            }
            
            // Send control token to participant
            this.sendToParticipant(participantId, 'remote_control_granted', {
                sessionId: this.activeSession.id,
                controlToken: this.generateControlToken()
            });
            
            console.log('[CollaborationService] ✓ Remote control granted to:', participantId);
        } catch (error) {
            console.error('[CollaborationService] Failed to grant remote control:', error);
            throw error;
        }
    }
    
    /**
     * Revoke remote control
     */
    async revokeRemoteControl(participantId) {
        try {
            if (!this.activeSession || !this.activeSession.host) {
                throw new Error('Only host can revoke remote control');
            }
            
            // Notify participant
            this.sendToParticipant(participantId, 'remote_control_revoked', {
                sessionId: this.activeSession.id
            });
            
            console.log('[CollaborationService] ✓ Remote control revoked from:', participantId);
        } catch (error) {
            console.error('[CollaborationService] Failed to revoke remote control:', error);
            throw error;
        }
    }
    
    /**
     * Handle remote stream
     */
    handleRemoteStream(stream) {
        console.log('[CollaborationService] Received remote stream:', stream);
        
        // Add participant to list
        const participantId = this.getParticipantIdFromStream(stream);
        this.participants.set(participantId, {
            id: participantId,
            stream: stream,
            joinedAt: Date.now()
        });
        
        // Emit event for UI to handle
        this.emit('remote_stream_added', {
            participantId: participantId,
            stream: stream
        });
    }
    
    /**
     * Send ICE candidate
     */
    sendIceCandidate(candidate) {
        // This would send the candidate via signaling server
        console.log('[CollaborationService] Sending ICE candidate');
    }
    
    /**
     * Send session request
     */
    async sendSessionRequest(sessionId, data) {
        // This would send the request via signaling server
        // For now, return mock response
        return {
            accepted: true,
            answer: null,
            config: this.sessionConfig,
            participants: []
        };
    }
    
    /**
     * Broadcast to all participants
     */
    broadcastToParticipants(type, data) {
        // This would broadcast via signaling server
        console.log('[CollaborationService] Broadcasting:', type, data);
    }
    
    /**
     * Send to specific participant
     */
    sendToParticipant(participantId, type, data) {
        // This would send via signaling server
        console.log('[CollaborationService] Sending to participant:', participantId, type, data);
    }
    
    /**
     * Get local participant ID
     */
    getLocalParticipantId() {
        return 'local_' + Date.now().toString(36);
    }
    
    /**
     * Get participant ID from stream
     */
    getParticipantIdFromStream(stream) {
        // This would extract participant ID from stream metadata
        return 'remote_' + Date.now().toString(36);
    }
    
    /**
     * Generate session ID
     */
    generateSessionId() {
        return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Generate ID
     */
    generateId() {
        return Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Generate control token
     */
    generateControlToken() {
        return btoa(Date.now().toString() + '_' + Math.random().toString(36));
    }
    
    /**
     * Emit event (for internal event system)
     */
    emit(event, data) {
        // This would integrate with actual event system
        console.log('[CollaborationService] Event emitted:', event, data);
    }
    
    /**
     * Get session status
     */
    getSessionStatus() {
        return {
            isSharing: this.isSharing,
            activeSession: this.activeSession,
            participantsCount: this.participants.size,
            collaborationTools: { ...this.collaborationTools },
            config: { ...this.sessionConfig }
        };
    }
    
    /**
     * Get participants
     */
    getParticipants() {
        return Array.from(this.participants.values());
    }
    
    /**
     * Update session configuration
     */
    updateSessionConfig(config) {
        this.sessionConfig = { ...this.sessionConfig, ...config };
        
        // Apply configuration changes
        if (this.screenStream && config.frameRate) {
            // Would need to restart stream with new frame rate
            console.log('[CollaborationService] Frame rate updated to:', config.frameRate);
        }
        
        // Notify participants
        this.broadcastToParticipants('config_updated', {
            config: this.sessionConfig
        });
    }
    
    /**
     * Enable/disable collaboration tools
     */
    setCollaborationTool(tool, enabled) {
        if (this.collaborationTools.hasOwnProperty(tool)) {
            this.collaborationTools[tool] = enabled;
            
            // Notify participants
            this.broadcastToParticipants('tool_updated', {
                tool: tool,
                enabled: enabled
            });
            
            console.log(`[CollaborationService] ${tool} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    /**
     * Get network statistics
     */
    getNetworkStats() {
        if (!this.peerConnection) {
            return null;
        }
        
        return this.peerConnection.getStats().then(stats => {
            const results = {};
            
            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                    results.video = {
                        packetsReceived: report.packetsReceived,
                        packetsLost: report.packetsLost,
                        bytesReceived: report.bytesReceived,
                        jitter: report.jitter,
                        framerate: report.framerate
                    };
                }
                
                if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
                    results.audio = {
                        packetsReceived: report.packetsReceived,
                        packetsLost: report.packetsLost,
                        bytesReceived: report.bytesReceived,
                        jitter: report.jitter,
                        audioLevel: report.audioLevel
                    };
                }
            });
            
            return results;
        });
    }
}

export default CollaborationService;
