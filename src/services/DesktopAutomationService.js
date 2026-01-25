/**
 * Desktop Automation Service - FREE System Control
 * 
 * JARVIS-powered desktop automation using:
 * - Volume control (loudness npm package)
 * - Brightness control (platform-specific)
 * - App launching (child_process)
 * - Screenshots (Electron desktopCapturer)
 * - System info monitoring
 * 
 * NO paid APIs, 100% local!
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { platform, arch, cpus, totalmem, freemem } from 'os';
import path from 'path';

const execAsync = promisify(exec);

class DesktopAutomationService {
    constructor() {
        this.platform = platform();
        this.isWindows = this.platform === 'win32';
        this.isMac = this.platform === 'darwin';
        this.isLinux = this.platform === 'linux';

        // Common app paths (user can customize)
        this.appPaths = {
            // Windows
            vscode: 'C:\\Program Files\\Microsoft VS Code\\Code.exe',
            chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            firefox: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
            notepad: 'notepad.exe',
            calculator: 'calc.exe',

            // Linux
            vscode_linux: '/usr/share/code/code',
            chrome_linux: '/usr/bin/google-chrome',
            firefox_linux: '/usr/bin/firefox',

            // macOS
            vscode_mac: '/Applications/Visual Studio Code.app',
            chrome_mac: '/Applications/Google Chrome.app',
            firefox_mac: '/Applications/Firefox.app'
        };
    }

    // ===== VOLUME CONTROL =====

    /**
     * Get current system volume (0-100)
     */
    async getVolume() {
        try {
            if (this.isWindows) {
                // Use nircmd or PowerShell
                const { stdout } = await execAsync(
                    'powershell -c "(New-Object -ComObject WScript.Shell).SendKeys([char]174)"'
                );
                // Alternative: Use loudness package if available
                return await this._getVolumeLoudness();
            } else if (this.isMac) {
                const { stdout } = await execAsync('osascript -e "output volume of (get volume settings)"');
                return parseInt(stdout.trim());
            } else if (this.isLinux) {
                // Use amixer
                const { stdout } = await execAsync('amixer get Master | grep -oP "\\d+%"');
                return parseInt(stdout.split('%')[0]);
            }
        } catch (error) {
            console.error('[DesktopAutomation] Get volume failed:', error);
            return 50; // Default
        }
    }

    /**
     * Set system volume (0-100)
     */
    async setVolume(level) {
        try {
            level = Math.max(0, Math.min(100, level));

            if (this.isWindows) {
                // Use nircmd (free utility) or PowerShell
                await execAsync(`nircmd.exe setsysvolume ${Math.floor(level * 655.35)}`);
                return { success: true, volume: level };
            } else if (this.isMac) {
                await execAsync(`osascript -e "set volume output volume ${level}"`);
                return { success: true, volume: level };
            } else if (this.isLinux) {
                await execAsync(`amixer set Master ${level}%`);
                return { success: true, volume: level };
            }
        } catch (error) {
            console.error('[DesktopAutomation] Set volume failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get volume using loudness package (if available)
     */
    async _getVolumeLoudness() {
        try {
            const loudness = await import('loudness');
            return await loudness.getVolume();
        } catch (error) {
            return 50;
        }
    }

    // ===== BRIGHTNESS CONTROL =====

    /**
     * Get screen brightness (0-100)
     */
    async getBrightness() {
        try {
            if (this.isWindows) {
                // Use WMI or brightness.exe
                const { stdout } = await execAsync(
                    'powershell -c "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness"'
                );
                return parseInt(stdout.trim());
            } else if (this.isMac) {
                // Requires brightness CLI tool
                const { stdout } = await execAsync('brightness -l');
                return parseFloat(stdout.trim()) * 100;
            } else if (this.isLinux) {
                // Use xrandr or ddcutil
                const { stdout } = await execAsync('ddcutil getvcp 10 | grep -oP "current value = \\d+" | grep -oP "\\d+"');
                return parseInt(stdout.trim());
            }
        } catch (error) {
            console.error('[DesktopAutomation] Get brightness failed:', error);
            return 50;
        }
    }

    /**
     * Set screen brightness (0-100)
     */
    async setBrightness(level) {
        try {
            level = Math.max(0, Math.min(100, level));

            if (this.isWindows) {
                await execAsync(
                    `powershell -c "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${level})"`
                );
                return { success: true, brightness: level };
            } else if (this.isMac) {
                const normalized = level / 100;
                await execAsync(`brightness ${normalized}`);
                return { success: true, brightness: level };
            } else if (this.isLinux) {
                await execAsync(`ddcutil setvcp 10 ${level}`);
                return { success: true, brightness: level };
            }
        } catch (error) {
            console.error('[DesktopAutomation] Set brightness failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== APP LAUNCHER =====

    /**
     * Launch application
     * @param {string} appName - App name or full path
     */
    async launchApp(appName) {
        try {
            let appPath = appName;

            // Check if it's a known app shortcut
            const knownAppKey = appName.toLowerCase().replace(/\s+/g, '');
            if (this.isWindows && this.appPaths[knownAppKey]) {
                appPath = this.appPaths[knownAppKey];
            } else if (this.isLinux && this.appPaths[`${knownAppKey}_linux`]) {
                appPath = this.appPaths[`${knownAppKey}_linux`];
            } else if (this.isMac && this.appPaths[`${knownAppKey}_mac`]) {
                appPath = this.appPaths[`${knownAppKey}_mac`];
            }

            if (this.isWindows) {
                spawn(appPath, [], { detached: true, stdio: 'ignore' });
            } else if (this.isMac) {
                exec(`open "${appPath}"`);
            } else if (this.isLinux) {
                spawn(appPath, [], { detached: true, stdio: 'ignore' });
            }

            return { success: true, app: appName };
        } catch (error) {
            console.error('[DesktopAutomation] Launch app failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close application (by name)
     */
    async closeApp(appName) {
        try {
            if (this.isWindows) {
                await execAsync(`taskkill /IM "${appName}.exe" /F`);
            } else if (this.isMac) {
                await execAsync(`killall "${appName}"`);
            } else if (this.isLinux) {
                await execAsync(`pkill -f "${appName}"`);
            }

            return { success: true, app: appName };
        } catch (error) {
            console.error('[DesktopAutomation] Close app failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== SCREENSHOT =====

    /**
     * Take screenshot
     * @param {Object} electronAPI - Electron desktopCapturer API (pass from main)
     */
    async takeScreenshot(electronAPI) {
        try {
            // This requires Electron's desktopCapturer in renderer
            // Implementation in renderer process
            return { success: true, message: 'Screenshot functionality requires renderer context' };
        } catch (error) {
            console.error('[DesktopAutomation] Screenshot failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== SYSTEM INFO =====

    /**
     * Get system information
     */
    getSystemInfo() {
        const totalRAM = totalmem();
        const freeRAM = freemem();
        const usedRAM = totalRAM - freeRAM;

        return {
            platform: this.platform,
            arch: arch(),
            cpus: cpus().length,
            cpuModel: cpus()[0]?.model || 'Unknown',
            totalMemory: (totalRAM / (1024 ** 3)).toFixed(2) + ' GB',
            freeMemory: (freeRAM / (1024 ** 3)).toFixed(2) + ' GB',
            usedMemory: (usedRAM / (1024 ** 3)).toFixed(2) + ' GB',
            memoryUsagePercent: ((usedRAM / totalRAM) * 100).toFixed(1) + '%'
        };
    }

    /**
     * Get CPU usage (requires sampling)
     */
    async getCPUUsage() {
        // Simplified: Returns instant snapshot
        // For accurate usage, need to sample over time
        const cpus = cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - (100 * idle / total);

        return parseFloat(usage.toFixed(1));
    }

    // ===== PROCESS MANAGEMENT =====

    /**
     * List running processes
     */
    async listProcesses() {
        try {
            if (this.isWindows) {
                const { stdout } = await execAsync('tasklist /FO CSV /NH');
                const processes = stdout.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        const parts = line.split(',');
                        return {
                            name: parts[0]?.replace(/"/g, ''),
                            pid: parts[1]?.replace(/"/g, '')
                        };
                    });
                return processes;
            } else {
                const { stdout } = await execAsync('ps aux');
                const processes = stdout.split('\n')
                    .slice(1)
                    .filter(line => line.trim())
                    .map(line => {
                        const parts = line.trim().split(/\s+/);
                        return {
                            user: parts[0],
                            pid: parts[1],
                            cpu: parts[2],
                            mem: parts[3],
                            command: parts.slice(10).join(' ')
                        };
                    });
                return processes;
            }
        } catch (error) {
            console.error('[DesktopAutomation] List processes failed:', error);
            return [];
        }
    }

    // ===== CLIPBOARD =====

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            if (this.isWindows) {
                await execAsync(`echo ${text} | clip`);
            } else if (this.isMac) {
                await execAsync(`echo "${text}" | pbcopy`);
            } else if (this.isLinux) {
                await execAsync(`echo "${text}" | xclip -selection clipboard`);
            }
            return { success: true };
        } catch (error) {
            console.error('[DesktopAutomation] Clipboard failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get from clipboard
     */
    async getClipboard() {
        try {
            let stdout;
            if (this.isWindows) {
                ({ stdout } = await execAsync('powershell -c "Get-Clipboard"'));
            } else if (this.isMac) {
                ({ stdout } = await execAsync('pbpaste'));
            } else if (this.isLinux) {
                ({ stdout } = await execAsync('xclip -selection clipboard -o'));
            }
            return { success: true, content: stdout.trim() };
        } catch (error) {
            console.error('[DesktopAutomation] Get clipboard failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== POWER MANAGEMENT =====

    /**
     * Lock screen
     */
    async lockScreen() {
        try {
            if (this.isWindows) {
                await execAsync('rundll32.exe user32.dll,LockWorkStation');
            } else if (this.isMac) {
                await execAsync('pmset displaysleepnow');
            } else if (this.isLinux) {
                await execAsync('gnome-screensaver-command -l || xdg-screensaver lock');
            }
            return { success: true };
        } catch (error) {
            console.error('[DesktopAutomation] Lock screen failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export singleton
export const desktopAutomation = new DesktopAutomationService();
export { DesktopAutomationService };
