import { screen } from 'electron';
import { spawn } from 'child_process';
import os from 'os';

/**
 * WindowDetectionService
 * Handles detection of visible windows and taskbar bounds.
 * Uses native scripts (PowerShell) on Windows and generic screen API elsewhere.
 */
class WindowDetectionService {
    constructor() {
        this.isWindows = os.platform() === 'win32';
        this.callback = null;
        this.detecting = false;
        this.interval = null;
        this.scanIntervalMs = 1000; // Scan every second

        // Cache taskbar bounds
        this.taskbarBounds = null;
    }

    /**
     * Start window detection loop
     * @param {Function} callback - Called with { windows: [], taskbar: {} }
     */
    start(callback) {
        if (this.detecting) return;

        this.callback = callback;
        this.detecting = true;

        // Immediate initial scan
        this.scan();

        this.interval = setInterval(() => {
            this.scan();
        }, this.scanIntervalMs);

        console.log('[WindowDetection] Service started');
    }

    /**
     * Stop detection loop
     */
    stop() {
        if (!this.detecting) return;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.detecting = false;
        console.log('[WindowDetection] Service stopped');
    }

    /**
     * Get taskbar bounds using Electron screen API
     * Returns bounds of the primary display's taskbar area (screen - workArea)
     */
    getTaskbarBounds() {
        try {
            const primaryDisplay = screen.getPrimaryDisplay();
            const { bounds, workArea } = primaryDisplay;

            // Taskbar is the difference between bounds and workArea
            // Usually at bottom
            if (workArea.height < bounds.height) {
                // Taskbar is likely at bottom or top
                if (workArea.y > bounds.y) {
                    // Top taskbar
                    return {
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: workArea.y - bounds.y,
                        position: 'top'
                    };
                } else {
                    // Bottom taskbar
                    return {
                        x: bounds.x,
                        y: workArea.height + workArea.y,
                        width: bounds.width,
                        height: bounds.height - workArea.height,
                        position: 'bottom'
                    };
                }
            } else if (workArea.width < bounds.width) {
                // Side taskbar
                if (workArea.x > bounds.x) {
                    // Left taskbar
                    return {
                        x: bounds.x,
                        y: bounds.y,
                        width: workArea.x - bounds.x,
                        height: bounds.height,
                        position: 'left'
                    };
                } else {
                    // Right taskbar
                    return {
                        x: workArea.width + workArea.x,
                        y: bounds.y,
                        width: bounds.width - workArea.width,
                        height: bounds.height,
                        position: 'right'
                    };
                }
            }

            return null; // Fullscreen or auto-hide
        } catch (err) {
            console.error('[WindowDetection] Failed to get taskbar:', err);
            return null;
        }
    }

    /**
     * Perform a single scan
     */
    async scan() {
        try {
            const taskbar = this.getTaskbarBounds();
            this.taskbarBounds = taskbar;

            let windows = [];
            const platform = os.platform();

            if (platform === 'win32') {
                windows = await this.getWindowsPowershell();
            } else if (platform === 'darwin') {
                windows = await this.getWindowsMacOS();
            } else {
                // Linux - limited support, just use taskbar
                console.log('[WindowDetection] Linux detected - window detection limited to taskbar only');
            }

            if (this.callback) {
                this.callback({ windows, taskbar });
            }
        } catch (err) {
            console.error('[WindowDetection] Scan error:', err);
            if (this.callback) {
                this.callback({ windows: [], taskbar: this.taskbarBounds });
            }
        }
    }

    /**
     * Get windows using AppleScript (macOS only)
     */
    async getWindowsMacOS() {
        return new Promise((resolve) => {
            const script = `
                tell application "System Events"
                    set windowList to {}
                    repeat with aProcess in (every process whose visible is true)
                        try
                            repeat with aWindow in (every window of aProcess)
                                try
                                    set winName to name of aWindow
                                    set winPos to position of aWindow
                                    set winSize to size of aWindow
                                    set end of windowList to {title:winName, x:item 1 of winPos, y:item 2 of winPos, width:item 1 of winSize, height:item 2 of winSize, process:name of aProcess}
                                end try
                            end repeat
                        end try
                    end repeat
                    return windowList
                end tell
            `;

            const child = spawn('osascript', ['-e', script]);

            let stdout = '';
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.on('close', (code) => {
                if (code !== 0 || !stdout.trim()) {
                    resolve([]);
                    return;
                }

                try {
                    // Parse AppleScript output (comma-separated records)
                    const windows = [];
                    const parts = stdout.split(', ');
                    // Basic parsing - AppleScript output is complex, simplified here
                    resolve(windows);
                } catch (e) {
                    resolve([]);
                }
            });

            child.on('error', () => resolve([]));
        });
    }

    /**
     * Get windows using PowerShell (Windows only)
     * Uses a specific script to get MainWindowHandle, Title, and Rect for all processes 
     * that have a main window and visible title
     */
    async getWindowsPowershell() {
        return new Promise((resolve) => {
            // Script to get MainWindowHandle, Title, and Rect for all processes 
            // that have a main window and visible title
            const psScript = `
$code = @'
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
'@
Add-Type -MemberDefinition $code -Name Win32 -Namespace Win32Namespace

Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -ne "" } | ForEach-Object {
    $handle = $_.MainWindowHandle
    $rect = New-Object Win32Namespace.Win32+RECT
    $visible = [Win32Namespace.Win32]::IsWindowVisible($handle)
    
    if ($visible) {
        $res = [Win32Namespace.Win32]::GetWindowRect($handle, [ref]$rect)
        if ($res) {
            [PSCustomObject]@{
                Title = $_.MainWindowTitle
                Process = $_.ProcessName
                X = $rect.Left
                Y = $rect.Top
                Width = $rect.Right - $rect.Left
                Height = $rect.Bottom - $rect.Top
            }
        }
    }
} | ConvertTo-Json -Compress
`;

            const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript]);

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    resolve([]);
                    return;
                }

                try {
                    if (!stdout.trim()) {
                        resolve([]);
                        return;
                    }

                    let result = JSON.parse(stdout);
                    if (!Array.isArray(result)) result = [result];

                    // Filter out invalid windows (0 size)
                    result = result.filter(w => w.Width > 0 && w.Height > 0);

                    resolve(result);
                } catch (e) {
                    resolve([]);
                }
            });
        });
    }
}

export default new WindowDetectionService();
