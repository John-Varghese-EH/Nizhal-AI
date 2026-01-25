import { Server } from 'socket.io';
import http from 'http';
import fs from 'fs';
import path from 'path';

/**
 * MobileServerService - Socket.io Server for PWA Sync
 */
class MobileServerService {
    constructor() {
        this.io = null;
        this.server = null;
        this.port = 3000;
        this.connectedDevices = new Set();
        this.teamMembers = new Map(); // socketId -> memberName
        this.onCommand = null;
    }

    /**
     * Start the socket server
     * @param {Function} onCommand - Callback for voice commands from phone
     */
    start(onCommand) {
        this.onCommand = onCommand;

        // Simple HTTP server to serve the PWA (simulated)
        this.server = http.createServer((req, res) => {
            // Serve static PWA files
            if (req.url === '/' || req.url === '/index.html') {
                const filePath = path.join(process.cwd(), 'src/mobile/public/index.html');
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Error loading PWA');
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                });
            } else {
                res.writeHead(404);
                res.end();
            }
        });

        this.io = new Server(this.server, {
            cors: {
                origin: "*", // Allow local network
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`[Mobile] Device connected: ${socket.id}`);
            this.connectedDevices.add(socket.id);
            this.notifyStatus(socket);

            socket.on('disconnect', () => {
                console.log(`[Mobile] Device disconnected: ${socket.id}`);
                this.connectedDevices.delete(socket.id);
            });

            // Handle voice commands from mobile
            socket.on('voice-command', (data) => {
                console.log(`[Mobile] Command received: ${data.text}`);
                if (this.onCommand) {
                    this.onCommand(data.text);
                }
            });

            // Team Collaboration
            socket.on('join-team', (name) => {
                this.teamMembers.set(socket.id, name);
                console.log(`[Team] ${name} joined the war room`);
                this.broadcastTeamEvent('member_joined', { name });
            });

            socket.on('team-chat', (msg) => {
                const name = this.teamMembers.get(socket.id) || 'Anonymous';
                this.broadcastTeamEvent('chat_message', { sender: name, text: msg });
            });

            // Handle sync requests
            socket.on('sync-request', () => {
                // Send current state
                socket.emit('sync-state', {
                    status: 'online',
                    activity: 'idle',
                    teamCount: this.teamMembers.size
                });
            });
        });

        try {
            this.server.listen(this.port, () => {
                console.log(`[Mobile] Server running on port ${this.port}`);
            });
        } catch (e) {
            console.error('[Mobile] Failed to start server:', e);
        }
    }

    /**
     * Broadcast event to all team members
     */
    broadcastTeamEvent(type, data) {
        if (!this.io) return;
        this.io.emit('team-event', { type, ...data, timestamp: Date.now() });
    }

    /**
     * Send notification to all connected devices
     */
    sendNotification(title, message) {
        if (!this.io) return;
        this.io.emit('notification', { title, message });
    }

    /**
     * Notify status update
     */
    notifyStatus(socket = null) {
        const payload = { online: true, timestamp: Date.now() };
        if (socket) {
            socket.emit('status', payload);
        } else if (this.io) {
            this.io.emit('status', payload);
        }
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

export const mobileServer = new MobileServerService();
