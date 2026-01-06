/**
 * CuteErrorHandler - Transforms errors into cute companion messages
 * Also provides safe IPC wrappers and complements
 */
class CuteErrorHandlerService {
    constructor() {
        this.errorMessages = [
            { text: "Ouchie! Something went wrong...", variant: 'error' },
            { text: "My brain hurts a little...", variant: 'error' },
            { text: "I'm confused! Can we try again?", variant: 'error' },
            { text: "Oops! I tripped on a bug.", variant: 'error' },
            { text: "Processing error... bleep bloop!", variant: 'error' },
            { text: "I couldn't do that, sorry!", variant: 'error' },
            { text: "Eep! Glitch in the matrix.", variant: 'error' }
        ];

        this.complements = [
            { text: "You're doing great!", variant: 'love' },
            { text: "You are awesome!", variant: 'love' },
            { text: "I believe in you!", variant: 'love' },
            { text: "You are the best!", variant: 'love' },
            { text: "Keep up the good work!", variant: 'success' },
            { text: "You make me happy!", variant: 'love' },
            { text: "I'm so glad you're here!", variant: 'love' },
            { text: "You're my favorite human!", variant: 'love' }
        ];

        this.greetings = [
            { text: "Good morning, sunshine!", variant: 'default' },
            { text: "Hello! Ready for a great day?", variant: 'default' },
            { text: "Welcome back! I missed you.", variant: 'love' },
            { text: "Hey there, superstar!", variant: 'success' }
        ];

        this.messageCallback = null;
        this.variantCallback = null;
    }

    /**
     * Initialize with message callback
     * @param {Function} callback - (message, variant) => void
     */
    initialize(callback) {
        this.messageCallback = callback;

        // Global error handlers
        window.addEventListener('unhandledrejection', (event) => {
            console.warn('[CuteErrorHandler] Unhandled rejection:', event.reason);
            this.handleError(event.reason);
            event.preventDefault(); // Prevent console error spam
        });

        window.addEventListener('error', (event) => {
            console.warn('[CuteErrorHandler] Caught error:', event.error);
            this.handleError(event.error);
        });
    }

    handleError(error) {
        const pick = this.errorMessages[Math.floor(Math.random() * this.errorMessages.length)];
        if (this.messageCallback) {
            this.messageCallback(pick.text, pick.variant);
        }
    }

    triggerComplement() {
        const pick = this.complements[Math.floor(Math.random() * this.complements.length)];
        if (this.messageCallback) {
            this.messageCallback(pick.text, pick.variant);
        }
    }

    triggerGreeting() {
        const hour = new Date().getHours();
        let pool = this.greetings;

        if (hour >= 22 || hour < 6) {
            pool = [{ text: "You should sleep soon...", variant: 'default' },
            { text: "Late night? Don't overwork!", variant: 'love' }];
        }

        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (this.messageCallback) {
            this.messageCallback(pick.text, pick.variant);
        }
    }

    /**
     * Safe async wrapper - catches errors and shows cute message
     * @param {Promise} promise - The promise to wrap
     * @returns {Promise} - Resolved value or null on error
     */
    async try(promise) {
        try {
            return await promise;
        } catch (e) {
            this.handleError(e);
            return null;
        }
    }

    /**
     * Safe IPC invoke wrapper
     * @param {string} channel - IPC channel
     * @param {...any} args - Arguments
     */
    async safeInvoke(channel, ...args) {
        try {
            if (!window.nizhal?.invoke) {
                console.warn('[CuteErrorHandler] IPC not available');
                return null;
            }
            return await window.nizhal.invoke(channel, ...args);
        } catch (e) {
            console.warn(`[CuteErrorHandler] IPC ${channel} failed:`, e);
            // Don't show error bubble for every IPC failure to avoid spam
            return null;
        }
    }
}

export const cuteErrorHandler = new CuteErrorHandlerService();
