import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import open from 'open';

const execAsync = promisify(exec);

export function createSystemBridge() {
    const platform = process.platform;

    const bridge = {
        async getVolume() {
            try {
                if (platform === 'win32') {
                    const { stdout } = await execAsync(
                        'powershell -command "(Get-AudioDevice -PlaybackVolume).Volume"'
                    );
                    return parseFloat(stdout.trim()) / 100;
                } else if (platform === 'darwin') {
                    const { stdout } = await execAsync(
                        'osascript -e "output volume of (get volume settings)"'
                    );
                    return parseFloat(stdout.trim()) / 100;
                } else if (platform === 'linux') {
                    const { stdout } = await execAsync(
                        "pactl get-sink-volume @DEFAULT_SINK@ | grep -Po '[0-9]+(?=%)' | head -1"
                    );
                    return parseFloat(stdout.trim()) / 100;
                }
            } catch (error) {
                console.error('Failed to get volume:', error);
                return 0.5;
            }
        },

        async setVolume(level) {
            const clampedLevel = Math.max(0, Math.min(1, level));
            const percentage = Math.round(clampedLevel * 100);

            try {
                if (platform === 'win32') {
                    await execAsync(
                        `powershell -command "Set-AudioDevice -PlaybackVolume ${percentage}"`
                    );
                } else if (platform === 'darwin') {
                    await execAsync(`osascript -e "set volume output volume ${percentage}"`);
                } else if (platform === 'linux') {
                    await execAsync(`pactl set-sink-volume @DEFAULT_SINK@ ${percentage}%`);
                }
                return clampedLevel;
            } catch (error) {
                console.error('Failed to set volume:', error);
                return null;
            }
        },

        async getBrightness() {
            try {
                if (platform === 'win32') {
                    const { stdout } = await execAsync(
                        'powershell -command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightness).CurrentBrightness"'
                    );
                    return parseFloat(stdout.trim()) / 100;
                } else if (platform === 'darwin') {
                    const { stdout } = await execAsync(
                        'brightness -l | grep "display 0" | sed "s/.*brightness //"'
                    );
                    return parseFloat(stdout.trim());
                } else if (platform === 'linux') {
                    const { stdout: maxOutput } = await execAsync(
                        'cat /sys/class/backlight/*/max_brightness'
                    );
                    const { stdout: currentOutput } = await execAsync(
                        'cat /sys/class/backlight/*/brightness'
                    );
                    return parseFloat(currentOutput) / parseFloat(maxOutput);
                }
            } catch (error) {
                console.error('Failed to get brightness:', error);
                return 0.5;
            }
        },

        async setBrightness(level) {
            const clampedLevel = Math.max(0.1, Math.min(1, level));
            const percentage = Math.round(clampedLevel * 100);

            try {
                if (platform === 'win32') {
                    await execAsync(
                        `powershell -command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${percentage})"`
                    );
                } else if (platform === 'darwin') {
                    await execAsync(`brightness ${clampedLevel}`);
                } else if (platform === 'linux') {
                    const { stdout: maxOutput } = await execAsync(
                        'cat /sys/class/backlight/*/max_brightness'
                    );
                    const newBrightness = Math.round(parseFloat(maxOutput) * clampedLevel);
                    await execAsync(
                        `echo ${newBrightness} | sudo tee /sys/class/backlight/*/brightness`
                    );
                }
                return clampedLevel;
            } catch (error) {
                console.error('Failed to set brightness:', error);
                return null;
            }
        },

        async launchApp(appNameOrPath) {
            try {
                await open(appNameOrPath);
                return { success: true, app: appNameOrPath };
            } catch (error) {
                console.error('Failed to launch app:', error);
                return { success: false, error: error.message };
            }
        },

        getSystemInfo() {
            return {
                platform: platform,
                arch: os.arch(),
                hostname: os.hostname(),
                username: os.userInfo().username,
                homeDir: os.homedir(),
                cpus: os.cpus().length,
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                uptime: os.uptime(),
                nodeVersion: process.version,
                electronVersion: process.versions.electron
            };
        },

        async searchApps(query) {
            try {
                if (platform === 'win32') {
                    const { stdout } = await execAsync(
                        `powershell -command "Get-StartApps | Where-Object { $_.Name -like '*${query}*' } | Select-Object -First 10 Name, AppID | ConvertTo-Json"`
                    );
                    return JSON.parse(stdout || '[]');
                } else if (platform === 'darwin') {
                    const { stdout } = await execAsync(
                        `mdfind "kMDItemKind == 'Application'" | grep -i "${query}" | head -10`
                    );
                    return stdout.split('\n').filter(Boolean).map(path => ({
                        name: path.split('/').pop().replace('.app', ''),
                        path
                    }));
                } else if (platform === 'linux') {
                    const { stdout } = await execAsync(
                        `find /usr/share/applications -name "*${query}*.desktop" -type f | head -10`
                    );
                    return stdout.split('\n').filter(Boolean).map(path => ({
                        name: path.split('/').pop().replace('.desktop', ''),
                        path
                    }));
                }
            } catch (error) {
                console.error('Failed to search apps:', error);
                return [];
            }
        },

        async executeCommand(command) {
            try {
                const { stdout, stderr } = await execAsync(command);
                return { success: true, stdout, stderr };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },

        async getNetworkInfo() {
            const interfaces = os.networkInterfaces();
            const result = [];

            for (const [name, addrs] of Object.entries(interfaces)) {
                for (const addr of addrs) {
                    if (!addr.internal) {
                        result.push({
                            interface: name,
                            address: addr.address,
                            family: addr.family,
                            mac: addr.mac
                        });
                    }
                }
            }

            return result;
        },

        async getBatteryInfo() {
            try {
                if (platform === 'win32') {
                    const { stdout } = await execAsync(
                        'powershell -command "Get-WmiObject Win32_Battery | Select-Object EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json"'
                    );
                    const data = JSON.parse(stdout);
                    return {
                        level: data.EstimatedChargeRemaining / 100,
                        charging: data.BatteryStatus === 2
                    };
                } else if (platform === 'darwin') {
                    const { stdout } = await execAsync('pmset -g batt');
                    const match = stdout.match(/(\d+)%/);
                    const charging = stdout.includes('charging');
                    return {
                        level: match ? parseInt(match[1]) / 100 : null,
                        charging
                    };
                } else if (platform === 'linux') {
                    const { stdout: level } = await execAsync(
                        'cat /sys/class/power_supply/BAT0/capacity'
                    );
                    const { stdout: status } = await execAsync(
                        'cat /sys/class/power_supply/BAT0/status'
                    );
                    return {
                        level: parseInt(level) / 100,
                        charging: status.trim().toLowerCase() === 'charging'
                    };
                }
            } catch (error) {
                return { level: null, charging: false };
            }
        }
    };

    return bridge;
}
