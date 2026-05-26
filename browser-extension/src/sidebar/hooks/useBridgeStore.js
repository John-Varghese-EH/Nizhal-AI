/**
 * useBridgeStore.js — Zustand store for sidebar ↔ bridge state
 *
 * Purely reflects the state pushed by the NizhalBridge service worker
 * over chrome.runtime messaging. The sidebar never owns state — it
 * mirrors what the bridge tells it (the "Dumb Terminal" pattern).
 */

import { create } from 'zustand';
import { ACTION, CONNECTION_STATE } from '@shared/constants.js';

/**
 * @typedef {object} ChatMessage
 * @property {'user'|'assistant'|'system'} role
 * @property {string} content
 * @property {number} timestamp
 * @property {string} [id]
 */

const useBridgeStore = create((set, get) => ({
    // ── Connection State ──
    connectionState: CONNECTION_STATE.DISCONNECTED,
    capabilities: [],
    reconnectAttempts: 0,

    // ── Chat State ──
    messages: [],
    isWaitingForResponse: false,

    // ── Page Context ──
    pageContext: null,
    isExtractingContext: false,

    // ── Actions ──

    /**
     * Fetch the current bridge status from the background worker.
     */
    fetchStatus: async () => {
        try {
            const response = await chrome.runtime.sendMessage({
                action: ACTION.GET_STATUS,
            });
            if (response) {
                set({
                    connectionState: response.state || CONNECTION_STATE.DISCONNECTED,
                    capabilities: response.capabilities || [],
                    reconnectAttempts: response.reconnectAttempts || 0,
                });
            }
        } catch (err) {
            console.warn('[Store] Failed to fetch status:', err);
            set({ connectionState: CONNECTION_STATE.DISCONNECTED });
        }
    },

    /**
     * Send a chat message through the bridge.
     * @param {string} text
     */
    sendMessage: async (text) => {
        if (!text.trim()) return;

        const userMessage = {
            role: 'user',
            content: text.trim(),
            timestamp: Date.now(),
            id: `user-${Date.now()}`,
        };

        set((state) => ({
            messages: [...state.messages, userMessage],
            isWaitingForResponse: true,
        }));

        try {
            const response = await chrome.runtime.sendMessage({
                action: ACTION.SEND_CHAT,
                text: text.trim(),
                pageContext: get().pageContext,
            });

            if (!response?.success) {
                // Connection issue — add a system message
                set((state) => ({
                    messages: [
                        ...state.messages,
                        {
                            role: 'system',
                            content: 'Could not reach Nizhal AI Desktop. Please make sure the app is running.',
                            timestamp: Date.now(),
                            id: `sys-${Date.now()}`,
                        },
                    ],
                    isWaitingForResponse: false,
                }));
            }
        } catch (err) {
            console.error('[Store] Send error:', err);
            set({ isWaitingForResponse: false });
        }
    },

    /**
     * Extract context from the current page via the content script.
     */
    extractPageContext: async () => {
        set({ isExtractingContext: true });
        try {
            const response = await chrome.runtime.sendMessage({
                action: ACTION.GET_PAGE_CONTEXT,
            });
            if (response && !response.error) {
                set({ pageContext: response, isExtractingContext: false });
            } else {
                set({ isExtractingContext: false });
            }
        } catch (err) {
            console.warn('[Store] Page context extraction failed:', err);
            set({ isExtractingContext: false });
        }
    },

    /**
     * Clear the page context.
     */
    clearPageContext: () => set({ pageContext: null }),

    /**
     * Handle incoming events from the background worker.
     */
    handleBridgeEvent: (event) => {
        switch (event.action) {
            case ACTION.STATUS_UPDATE:
                set({
                    connectionState: event.state || CONNECTION_STATE.DISCONNECTED,
                    capabilities: event.capabilities || [],
                    reconnectAttempts: event.reconnectAttempts || 0,
                });
                break;

            case ACTION.EVENT:
                // Handle chat responses from Tauri
                if (event.type === 'chat_response' && event.payload) {
                    const assistantMsg = {
                        role: 'assistant',
                        content: event.payload.message || event.payload.hint || JSON.stringify(event.payload),
                        timestamp: Date.now(),
                        id: event.id || `ai-${Date.now()}`,
                    };
                    set((state) => ({
                        messages: [...state.messages, assistantMsg],
                        isWaitingForResponse: false,
                    }));
                }
                break;

            default:
                break;
        }
    },

    /**
     * Clear the chat history.
     */
    clearMessages: () => set({ messages: [], isWaitingForResponse: false }),
}));

export default useBridgeStore;
