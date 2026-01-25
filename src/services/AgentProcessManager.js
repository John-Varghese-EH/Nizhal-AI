/**
 * AgentProcessManager.js
 * Manages the Python LiveKit AI agent as a child process
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AgentProcessManager {
    constructor(livekitService) {
        this.livekitService = livekitService;
        this.agentProcess = null;
        this.isRunning = false;
        this.restartAttempts = 0;
        this.maxRestartAttempts = 3;
        this.currentPersonality = 'gf';
        this.currentRoomName = null;

        console.log('[AgentProcessManager] Initialized');
    }

    /**
     * Start the Python AI agent
     * @param {string} personality - Personality mode (gf, bf, jarvis, lachu)
     * @param {string} roomName - Room for agent to join
     */
    async start(personality = 'gf', roomName = null) {
        if (this.isRunning) {
            console.log('[AgentProcessManager] Agent already running');
            return { success: true, pid: this.agentProcess?.pid };
        }

        this.currentPersonality = personality;
        this.currentRoomName = roomName;

        try {
            // Path to agent script
            const agentPath = path.join(__dirname, '..', '..', 'livekit-agent', 'agent.py');
            const agentDir = path.join(__dirname, '..', '..', 'livekit-agent');

            // Python executable (try venv first, then system)
            const pythonExe = process.platform === 'win32'
                ? path.join(agentDir, 'venv', 'Scripts', 'python.exe')
                : path.join(agentDir, 'venv', 'bin', 'python');

            // Check if venv exists, else use system python
            const { spawn: spawnFunc } = await import('fs');
            const fs = await import('fs/promises');

            let pythonCmd = 'python';
            try {
                await fs.access(pythonExe);
                pythonCmd = pythonExe;
                console.log('[AgentProcessManager] Using venv Python:', pythonCmd);
            } catch {
                console.log('[AgentProcessManager] Using system Python');
            }

            // Environment variables for agent
            const env = {
                ...process.env,
                PERSONALITY: personality,
                ROOM_NAME: roomName || '',
                PYTHONUNBUFFERED: '1', // For real-time logging
            };

            // Spawn agent process
            console.log('[AgentProcessManager] Starting agent:', pythonCmd, agentPath);
            this.agentProcess = spawn(pythonCmd, ['agent.py', 'dev'], {
                cwd: agentDir,
                env,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            this.isRunning = true;

            // Handle stdout
            this.agentProcess.stdout.on('data', (data) => {
                const msg = data.toString().trim();
                console.log(`[Agent] ${msg}`);
            });

            // Handle stderr
            this.agentProcess.stderr.on('data', (data) => {
                const msg = data.toString().trim();
                console.error(`[Agent Error] ${msg}`);
            });

            // Handle exit
            this.agentProcess.on('exit', (code, signal) => {
                console.log(`[AgentProcessManager] Agent exited with code ${code}, signal ${signal}`);
                this.isRunning = false;

                // Auto-restart if crashed unexpectedly
                if (code !== 0 && this.restartAttempts < this.maxRestartAttempts) {
                    this.restartAttempts++;
                    console.log(`[AgentProcessManager] Attempting restart (${this.restartAttempts}/${this.maxRestartAttempts})...`);

                    setTimeout(() => {
                        this.start(this.currentPersonality, this.currentRoomName);
                    }, 5000); // Wait 5s before restart
                } else if (this.restartAttempts >= this.maxRestartAttempts) {
                    console.error('[AgentProcessManager] Max restart attempts reached. Agent stopped.');
                }
            });

            // Handle errors
            this.agentProcess.on('error', (error) => {
                console.error('[AgentProcessManager] Failed to start agent:', error);
                this.isRunning = false;
            });

            console.log('[AgentProcessManager] Agent started with PID:', this.agentProcess.pid);
            this.restartAttempts = 0; // Reset on successful start

            return {
                success: true,
                pid: this.agentProcess.pid,
                personality,
                roomName
            };

        } catch (error) {
            console.error('[AgentProcessManager] Failed to start agent:', error);
            this.isRunning = false;
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop the agent process
     */
    async stop() {
        if (!this.isRunning || !this.agentProcess) {
            console.log('[AgentProcessManager] Agent not running');
            return { success: true };
        }

        try {
            console.log('[AgentProcessManager] Stopping agent...');

            // Send SIGTERM for graceful shutdown
            this.agentProcess.kill('SIGTERM');

            // Wait for exit
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    // Force kill if doesn't stop
                    if (this.isRunning) {
                        console.log('[AgentProcessManager] Force killing agent');
                        this.agentProcess.kill('SIGKILL');
                    }
                    resolve();
                }, 5000);

                this.agentProcess.once('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });

            this.isRunning = false;
            this.agentProcess = null;
            console.log('[AgentProcessManager] Agent stopped');

            return { success: true };
        } catch (error) {
            console.error('[AgentProcessManager] Error stopping agent:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Restart agent with new personality
     */
    async restart(personality = null, roomName = null) {
        console.log('[AgentProcessManager] Restarting agent...');

        await this.stop();

        // Wait a bit before restarting
        await new Promise(resolve => setTimeout(resolve, 2000));

        return this.start(personality || this.currentPersonality, roomName || this.currentRoomName);
    }

    /**
     * Update personality (requires restart for now)
     * TODO: In future, send IPC message to agent for hot-reload
     */
    async updatePersonality(newPersonality) {
        if (newPersonality === this.currentPersonality) {
            console.log('[AgentProcessManager] Personality unchanged');
            return { success: true };
        }

        console.log(`[AgentProcessManager] Updating personality: ${this.currentPersonality} -> ${newPersonality}`);
        return this.restart(newPersonality, this.currentRoomName);
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            pid: this.agentProcess?.pid || null,
            personality: this.currentPersonality,
            roomName: this.currentRoomName,
            restartAttempts: this.restartAttempts
        };
    }
}

export default AgentProcessManager;
