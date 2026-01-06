export class ContextService {
    constructor() {
        this.lastActiveTitle = '';
        this.isMonitoring = false;
        this.checkInterval = null;
    }

    startMonitoring(interval = 2000) {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        // In a real Electron app with native node modules active-win could be used.
        // For this implementation, we will simulate or use available clipboard/focus APIs.
        // Since we are in the renderer, we rely on the implementation capabilities.
        // Real implementation would require a native module in the main process communicating via IPC.

        console.log('Context monitoring started (Simulated/Placeholder for Native Module)');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    async getActiveContext() {
        // Placeholder: In production, this would call main process -> active-win
        return {
            app: 'VS Code',
            title: 'App.jsx - Nizhal-AI',
            url: null
        };
    }
}

export const contextService = new ContextService();
