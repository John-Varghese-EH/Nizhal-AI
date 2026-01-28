
/**
 * setup.js
 * One-Command Setup for Nizhal AI
 * Handles: Dependencies, Env Vars, Python Venv, and System Checks.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${CYAN}
  _   _ _     _           _      _    ___ 
 | \\ | (_)___| |__   __ _| |    / \\  |_ _|
 |  \\| | |_  / '_ \\ / _\` | |   / _ \\  | | 
 | |\\  | |/ /| | | | (_| | |  / ___ \\ | | 
 |_| \\_|_/___|_| |_|\\__,_|_| /_/   \\_\\___|
 \n      🚀 One-Command Setup Wizard 🚀
${RESET}`);

async function runStep(label, fn) {
    process.stdout.write(`[*] ${label}... `);
    try {
        await fn();
        console.log(`${GREEN}DONE${RESET}`);
    } catch (e) {
        console.log(`${RED}FAILED${RESET}`);
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
}

async function runCommand(cmd, args, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
        // FIX: Prevent command injection by disabling shell execution
        // Handle Windows-specific executable extensions manually
        if (os.platform() === 'win32' && cmd === 'npm') {
            cmd = 'npm.cmd';
        }

        const proc = spawn(cmd, args, { cwd, shell: false, stdio: 'inherit' });
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with code ${code}`));
        });
    });
}

// --- Steps ---

(async () => {

    await runStep('Checking Node.js version', async () => {
        const version = process.version;
        if (parseInt(version.slice(1)) < 18) {
            throw new Error(`Node.js v18+ required. Current: ${version}`);
        }
    });

    await runStep('Installing Root Dependencies', async () => {
        await runCommand('npm', ['install']);
    });

    await runStep('Setting up Environment Variables', async () => {
        const envPath = path.join(__dirname, '..', '.env');
        const examplePath = path.join(__dirname, '..', '.env.example');

        if (!fs.existsSync(envPath)) {
            // Create default .env content if .env.example doesn't exist
            const defaultEnv = `
VITE_LIVEKIT_URL=wss://nizhal-ai-gconweth.livekit.cloud
VITE_LIVEKIT_TOKEN=
OPENAI_API_KEY=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
            `.trim();

            fs.writeFileSync(envPath, defaultEnv);
            console.log(`\n    ${CYAN}Created .env file. Please fill in your API keys!${RESET}`);
        }
    });

    console.log(`\n${CYAN}--- Python Agent Setup ---${RESET}`);
    const agentDir = path.join(__dirname, '..', 'livekit-agent');

    await runStep('Creating Python Virtual Environment', async () => {
        const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';
        if (!fs.existsSync(path.join(agentDir, 'venv'))) {
            await runCommand(pythonCmd, ['-m', 'venv', 'venv'], agentDir);
        }
    });

    await runStep('Installing Python Dependencies', async () => {
        const pipCmd = os.platform() === 'win32'
            ? path.join(agentDir, 'venv', 'Scripts', 'pip')
            : path.join(agentDir, 'venv', 'bin', 'pip');

        await runCommand(pipCmd, ['install', '-r', 'requirements.txt'], agentDir);
    });

    console.log(`\n${GREEN}
✅ Setup Complete!
----------------------------------
👉 To start the app:
   npm run dev
   
👉 To build for Windows:
   npm run build:win
${RESET}`);

})();
