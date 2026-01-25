/**
 * ClipboardWatcherService - Monitor clipboard for AI context
 * 
 * Watches clipboard changes and provides content to AI for context
 */

class ClipboardWatcherService {
    constructor() {
        this.history = [];
        this.isWatching = false;
        this.watchInterval = null;
        this.lastContent = '';
        this.maxHistory = 50;
        this.callbacks = new Set();
    }

    /**
     * Start watching clipboard
     */
    start(intervalMs = 1000) {
        if (this.isWatching) return;

        this.isWatching = true;
        console.log('[ClipboardWatcher] Started monitoring clipboard');

        this.watchInterval = setInterval(async () => {
            try {
                const content = await this.readClipboard();
                if (content && content !== this.lastContent) {
                    this.lastContent = content;
                    this._addToHistory(content);
                    this._notifyCallbacks(content);
                }
            } catch (error) {
                // Silent fail - clipboard access may be restricted
            }
        }, intervalMs);
    }

    /**
     * Stop watching clipboard
     */
    stop() {
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
        this.isWatching = false;
        console.log('[ClipboardWatcher] Stopped monitoring clipboard');
    }

    /**
     * Read current clipboard content
     */
    async readClipboard() {
        try {
            // Try Electron API first
            if (window.nizhal?.clipboard?.read) {
                return await window.nizhal.clipboard.read();
            }

            // Fallback to browser Clipboard API
            if (navigator.clipboard && navigator.clipboard.readText) {
                return await navigator.clipboard.readText();
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Write to clipboard
     */
    async writeClipboard(text) {
        try {
            // Try Electron API first
            if (window.nizhal?.clipboard?.write) {
                await window.nizhal.clipboard.write(text);
                return true;
            }

            // Fallback to browser Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            return false;
        } catch (error) {
            console.error('[ClipboardWatcher] Write failed:', error);
            return false;
        }
    }

    /**
     * Add content to history
     */
    _addToHistory(content) {
        const entry = {
            id: Date.now(),
            content: content.substring(0, 1000), // Limit size
            timestamp: Date.now(),
            type: this._detectContentType(content)
        };

        this.history.unshift(entry);

        // Trim history
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }
    }

    /**
     * Detect content type
     */
    _detectContentType(content) {
        // URL detection
        if (/^https?:\/\//.test(content)) {
            return 'url';
        }

        // Email detection
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content)) {
            return 'email';
        }

        // Code detection (common patterns)
        if (/^(function|const|let|var|import|export|class|def|public|private)/.test(content) ||
            /[{}\[\]();]/.test(content)) {
            return 'code';
        }

        // JSON detection
        try {
            JSON.parse(content);
            return 'json';
        } catch { }

        // Default to text
        return 'text';
    }

    /**
     * Subscribe to clipboard changes
     */
    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    /**
     * Notify all callbacks
     */
    _notifyCallbacks(content) {
        for (const callback of this.callbacks) {
            try {
                callback(content, this._detectContentType(content));
            } catch (error) {
                console.error('[ClipboardWatcher] Callback error:', error);
            }
        }
    }

    /**
     * Get clipboard history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Get recent items
     */
    getRecent(count = 10) {
        return this.history.slice(0, count);
    }

    /**
     * Search history
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.history.filter(item =>
            item.content.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
    }

    /**
     * Get last copied content
     */
    getLastContent() {
        return this.lastContent;
    }

    /**
     * Check if watching
     */
    isActive() {
        return this.isWatching;
    }
}

export const clipboardWatcherService = new ClipboardWatcherService();
export default ClipboardWatcherService;
