/**
 * BootService - Orchestrates application Startup
 * 
 * Responsibilities:
 * 1. Preload critical assets (VRM, Voices)
 * 2. Initialize Core Services
 * 3. Report progress to UI
 */
export class BootService {
    constructor() {
        this.isReady = false;
        this.loadingProgress = 0;
    }

    _emitToast(message, type = 'info') {
        window.dispatchEvent(new CustomEvent('nizhal-toast', {
            detail: { message, type, duration: 4000 }
        }));
    }

    async initialize() {
        console.log('[BootService] Starting initialization sequence...');

        try {
            // 1. Environment Check
            await this._runCheck('Environment', async () => {
                const env = await window.nizhal?.env?.getAll?.() || {};
                const missing = [];
                if (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY) missing.push('AI API Key');

                if (missing.length > 0) {
                    this._emitToast(`Missing configuration: ${missing.join(', ')}`, 'error');
                    // We don't throw, we just warn
                }
            }, 20);

            // 2. Core State
            await this._runCheck('Core State', async () => {
                await window.nizhal?.state?.getAll?.();
            }, 20);

            // 3. LiveKit Status
            await this._runCheck('Voice Services', async () => {
                if (window.nizhal?.livekit) {
                    try {
                        const status = await window.nizhal.livekit.getStatus();
                        console.log('[BootService] LiveKit Status:', status);
                    } catch (e) {
                        console.warn('LiveKit check failed', e);
                    }
                }
            }, 30);

            // 4. Finalize
            this.loadingProgress = 100;
            this.isReady = true;
            console.log('[BootService] Initialization complete.');

            // Send success toast
            this._emitToast('Nizhal AI Ready', 'success');
            return true;

        } catch (error) {
            console.error('[BootService] Init failed:', error);
            this._emitToast('Initialization failed. Check console.', 'error');
            return false;
        }
    }

    async _runCheck(name, taskFn, weight) {
        console.log(`[BootService] Checking: ${name}...`);
        try {
            await taskFn();
        } catch (e) {
            console.error(`[BootService] ${name} check failed:`, e);
            this._emitToast(`Startup check failed: ${name}`, 'error');
        }
        this.loadingProgress += weight;
    }
}

export const bootService = new BootService();
