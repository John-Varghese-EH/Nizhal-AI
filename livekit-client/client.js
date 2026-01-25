/**
 * LiveKit Client Application
 * Handles room connection, track publishing/subscribing, and UI updates
 */

const { Room, RoomEvent, Track, VideoPresets, ConnectionState } = LivekitClient;

// Global state
let room = null;
let micEnabled = false;
let cameraEnabled = false;

// DOM Elements
const elements = {
    backendUrl: document.getElementById('backend-url'),
    roomName: document.getElementById('room-name'),
    participantName: document.getElementById('participant-name'),
    joinBtn: document.getElementById('join-btn'),
    leaveBtn: document.getElementById('leave-btn'),
    toggleMic: document.getElementById('toggle-mic'),
    toggleCamera: document.getElementById('toggle-camera'),
    toggleScreen: document.getElementById('toggle-screen'),
    connectionStatus: document.getElementById('connection-status'),
    roomStatus: document.getElementById('room-status'),
    participantCount: document.getElementById('participant-count'),
    qualityStatus: document.getElementById('quality-status'),
    participantsList: document.getElementById('participants-list'),
    videoGrid: document.getElementById('video-grid'),
    logs: document.getElementById('logs'),
    clearLogs: document.getElementById('clear-logs')
};

/**
 * Logging utility with timestamp
 */
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    elements.logs.prepend(logEntry);

    // Also log to console
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Limit logs to 100 entries
    while (elements.logs.children.length > 100) {
        elements.logs.removeChild(elements.logs.lastChild);
    }
}

/**
 * Update connection status UI
 */
function updateConnectionStatus(state) {
    elements.connectionStatus.textContent = state;
    elements.connectionStatus.className = 'status-value ' +
        (state === 'Connected' ? 'connected' :
            state === 'Connecting' || state === 'Reconnecting' ? 'connecting' :
                'disconnected');
}

/**
 * Get access token from backend
 */
async function getToken(roomName, participantName) {
    const backendUrl = elements.backendUrl.value.trim();

    log(`Requesting token for ${participantName} in room ${roomName}...`);

    try {
        const response = await fetch(`${backendUrl}/api/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomName,
                participantName,
                permissions: {
                    canPublish: true,
                    canSubscribe: true,
                    canPublishData: true
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get token');
        }

        const data = await response.json();
        log(`✅ Token received (expires in ${data.expiresIn})`, 'success');
        return data;

    } catch (error) {
        log(`❌ Token request failed: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Join LiveKit room
 */
async function joinRoom() {
    const roomName = elements.roomName.value.trim();
    const participantName = elements.participantName.value.trim();

    if (!roomName || !participantName) {
        log('❌ Please enter both room name and participant name', 'error');
        return;
    }

    try {
        elements.joinBtn.disabled = true;
        updateConnectionStatus('Connecting');

        // Get token from backend
        const { token, url } = await getToken(roomName, participantName);

        // Create room instance
        room = new Room({
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
                resolution: VideoPresets.h720.resolution,
            }
        });

        // Setup event listeners
        setupRoomEvents();

        // Connect to room
        log(`Connecting to room ${roomName}...`);
        await room.connect(url, token);

        log(`✅ Connected to room: ${roomName}`, 'success');
        updateConnectionStatus('Connected');
        elements.roomStatus.textContent = roomName;

        // Enable controls
        elements.leaveBtn.disabled = false;
        elements.toggleMic.disabled = false;
        elements.toggleCamera.disabled = false;
        elements.toggleScreen.disabled = false;

        // Auto-enable microphone
        await toggleMicrophone();

    } catch (error) {
        log(`❌ Connection failed: ${error.message}`, 'error');
        updateConnectionStatus('Disconnected');
        elements.joinBtn.disabled = false;
    }
}

/**
 * Leave LiveKit room
 */
async function leaveRoom() {
    if (!room) return;

    log('Disconnecting from room...');
    await room.disconnect();
    room = null;

    updateConnectionStatus('Disconnected');
    elements.roomStatus.textContent = '-';
    elements.participantCount.textContent = '0';
    elements.qualityStatus.textContent = '-';

    // Disable controls
    elements.joinBtn.disabled = false;
    elements.leaveBtn.disabled = true;
    elements.toggleMic.disabled = true;
    elements.toggleCamera.disabled = true;
    elements.toggleScreen.disabled = true;

    // Reset UI
    micEnabled = false;
    cameraEnabled = false;
    updateMicButton();
    updateCameraButton();
    elements.participantsList.innerHTML = '<p class="empty-state">No participants yet</p>';
    elements.videoGrid.innerHTML = '<p class="empty-state">No video streams</p>';

    log('✅ Disconnected', 'success');
}

/**
 * Toggle microphone
 */
async function toggleMicrophone() {
    if (!room) return;

    try {
        if (micEnabled) {
            await room.localParticipant.setMicrophoneEnabled(false);
            micEnabled = false;
            log('🎤 Microphone disabled');
        } else {
            await room.localParticipant.setMicrophoneEnabled(true);
            micEnabled = true;
            log('🎤 Microphone enabled', 'success');
        }
        updateMicButton();
    } catch (error) {
        log(`❌ Microphone error: ${error.message}`, 'error');
    }
}

/**
 * Toggle camera
 */
async function toggleCamera() {
    if (!room) return;

    try {
        if (cameraEnabled) {
            await room.localParticipant.setCameraEnabled(false);
            cameraEnabled = false;
            log('📹 Camera disabled');
        } else {
            await room.localParticipant.setCameraEnabled(true);
            cameraEnabled = true;
            log('📹 Camera enabled', 'success');
        }
        updateCameraButton();
    } catch (error) {
        log(`❌ Camera error: ${error.message}`, 'error');
    }
}

/**
 * Share screen
 */
async function shareScreen() {
    if (!room) return;

    try {
        const isSharing = room.localParticipant.isScreenShareEnabled;

        if (isSharing) {
            await room.localParticipant.setScreenShareEnabled(false);
            log('🖥️ Screen sharing stopped');
        } else {
            await room.localParticipant.setScreenShareEnabled(true);
            log('🖥️ Screen sharing started', 'success');
        }
    } catch (error) {
        log(`❌ Screen share error: ${error.message}`, 'error');
    }
}

/**
 * Update microphone button UI
 */
function updateMicButton() {
    const label = elements.toggleMic.querySelector('.label');
    elements.toggleMic.className = 'btn btn-control ' + (micEnabled ? 'active' : '');
    label.textContent = `Microphone: ${micEnabled ? 'On' : 'Off'}`;
}

/**
 * Update camera button UI
 */
function updateCameraButton() {
    const label = elements.toggleCamera.querySelector('.label');
    elements.toggleCamera.className = 'btn btn-control ' + (cameraEnabled ? 'active' : '');
    label.textContent = `Camera: ${cameraEnabled ? 'On' : 'Off'}`;
}

/**
 * Setup room event listeners
 */
function setupRoomEvents() {
    // Connection state changes
    room.on(RoomEvent.ConnectionStateChanged, (state) => {
        log(`Connection state: ${state}`);
        updateConnectionStatus(state);
    });

    // Participant joined
    room.on(RoomEvent.ParticipantConnected, (participant) => {
        log(`👤 ${participant.identity} joined`, 'success');
        updateParticipantsList();
        updateParticipantCount();
    });

    // Participant left
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        log(`👤 ${participant.identity} left`);
        updateParticipantsList();
        updateParticipantCount();
    });

    // Track subscribed (incoming audio/video)
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        log(`📡 Subscribed to ${track.kind} from ${participant.identity}`, 'success');
        handleTrackSubscribed(track, participant);
    });

    // Track unsubscribed
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        log(`📡 Unsubscribed from ${track.kind} from ${participant.identity}`);
        handleTrackUnsubscribed(track, participant);
    });

    // Reconnection events
    room.on(RoomEvent.Reconnecting, () => {
        log('🔄 Reconnecting...', 'warn');
        updateConnectionStatus('Reconnecting');
    });

    room.on(RoomEvent.Reconnected, () => {
        log('✅ Reconnected', 'success');
        updateConnectionStatus('Connected');
    });

    // Disconnection
    room.on(RoomEvent.Disconnected, (reason) => {
        log(`Disconnected: ${reason}`, 'warn');
        updateConnectionStatus('Disconnected');
    });

    // Connection quality
    room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        if (participant === room.localParticipant) {
            elements.qualityStatus.textContent = quality;
        }
    });
}

/**
 * Handle subscribed track
 */
function handleTrackSubscribed(track, participant) {
    const element = track.attach();
    element.id = `track-${participant.sid}-${track.sid}`;
    element.className = 'video-element';

    const container = document.createElement('div');
    container.className = 'video-container';
    container.id = `container-${participant.sid}-${track.sid}`;

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = participant.identity;

    container.appendChild(element);
    container.appendChild(label);

    // Remove empty state
    const emptyState = elements.videoGrid.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    elements.videoGrid.appendChild(container);
}

/**
 * Handle unsubscribed track
 */
function handleTrackUnsubscribed(track, participant) {
    const container = document.getElementById(`container-${participant.sid}-${track.sid}`);
    if (container) {
        container.remove();
    }

    // Add empty state if no videos
    if (elements.videoGrid.children.length === 0) {
        elements.videoGrid.innerHTML = '<p class="empty-state">No video streams</p>';
    }
}

/**
 * Update participants list
 */
function updateParticipantsList() {
    if (!room) return;

    const participants = Array.from(room.remoteParticipants.values());
    participants.push(room.localParticipant);

    if (participants.length === 0) {
        elements.participantsList.innerHTML = '<p class="empty-state">No participants yet</p>';
        return;
    }

    elements.participantsList.innerHTML = participants.map(p => `
        <div class="participant-item ${p.sid === room.localParticipant.sid ? 'local' : ''}">
            <span class="participant-name">${p.identity} ${p.sid === room.localParticipant.sid ? '(You)' : ''}</span>
            <span class="participant-status ${p.connectionQuality}">${p.connectionQuality || 'unknown'}</span>
        </div>
    `).join('');
}

/**
 * Update participant count
 */
function updateParticipantCount() {
    if (!room) {
        elements.participantCount.textContent = '0';
        return;
    }

    const count = room.remoteParticipants.size + 1; // +1 for local participant
    elements.participantCount.textContent = count;
}

// Event Listeners
elements.joinBtn.addEventListener('click', joinRoom);
elements.leaveBtn.addEventListener('click', leaveRoom);
elements.toggleMic.addEventListener('click', toggleMicrophone);
elements.toggleCamera.addEventListener('click', toggleCamera);
elements.toggleScreen.addEventListener('click', shareScreen);
elements.clearLogs.addEventListener('click', () => {
    elements.logs.innerHTML = '';
    log('Logs cleared');
});

// Auto-reconnect on page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && room && room.state === ConnectionState.Connected) {
        log('Page hidden, maintaining connection...');
    }
});

// Initial log
log('LiveKit Client initialized. Ready to connect!');
