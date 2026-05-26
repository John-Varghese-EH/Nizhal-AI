/**
 * background.js — Nizhal AI Browser Extension Service Worker
 *
 * Implements the NizhalBridge class that:
 *  1. Maintains a persistent WebSocket connection to the local Tauri backend
 *  2. Handles connect / disconnect / reconnect (with exponential backoff)
 *  3. Routes messages between the WebSocket and the Sidebar UI
 *     via browser.runtime messaging
 *
 * This file runs as a Manifest V3 service worker (Chrome) or a
 * background script (Firefox). The webextension-polyfill normalises APIs.
 */

import {
    WS_URL,
    RECONNECT,
    MSG,
    ACTION,
    CONNECTION_STATE,
} from '../shared/constants.js';

// ─── NizhalBridge ─────────────────────────────────────────────────────

class NizhalBridge {
    constructor() {
        /** @type {WebSocket|null} */
        this.ws = null;

        /** Current connection state. */
        this.state = CONNECTION_STATE.DISCONNECTED;

        /** Consecutive reconnection attempts counter. */
        this.reconnectAttempts = 0;

        /** Handle for the reconnect timeout. */
        this.reconnectTimer = null;

        /** Handle for the heartbeat interval. */
        this.heartbeatTimer = null;

        /** Capabilities reported by the Tauri backend on connect. */
        this.capabilities = [];

        /** Pending request map: id → { resolve, reject, timeout } */
        this.pending = new Map();

        /** Monotonic request counter for unique IDs. */
        this.requestCounter = 0;
    }

    // ── Lifecycle ──────────────────────────────────────────────────

    /**
     * Initiate a WebSocket connection to the Tauri backend.
     * Safe to call multiple times — idempotent.
     */
    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return; // Already connected or connecting
        }

        this.setState(CONNECTION_STATE.CONNECTING);

        try {
            this.ws = new WebSocket(WS_URL);
        } catch (err) {
            console.error('[NizhalBridge] WebSocket constructor error:', err);
            this.setState(CONNECTION_STATE.DISCONNECTED);
            this.scheduleReconnect();
            return;
        }

        this.ws.onopen = () => {
            console.log('[NizhalBridge] Connected to Nizhal AI Desktop');
            this.reconnectAttempts = 0;
            this.setState(CONNECTION_STATE.CONNECTED);
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (err) => {
            console.warn('[NizhalBridge] WebSocket error:', err);
            // onerror is always followed by onclose, so we handle cleanup there
        };

        this.ws.onclose = (event) => {
            console.log(`[NizhalBridge] Connection closed (code: ${event.code})`);
            this.stopHeartbeat();
            this.ws = null;
            this.setState(CONNECTION_STATE.DISCONNECTED);
            this.scheduleReconnect();
        };
    }

    /**
     * Gracefully disconnect. Stops reconnection attempts.
     */
    disconnect() {
        this.clearReconnect();
        this.stopHeartbeat();

        if (this.ws) {
            this.ws.onclose = null; // Prevent triggering reconnect
            this.ws.close(1000, 'Extension disconnecting');
            this.ws = null;
        }

        this.setState(CONNECTION_STATE.DISCONNECTED);
        console.log('[NizhalBridge] Disconnected gracefully');
    }

    // ── Reconnection with Exponential Backoff ──────────────────────

    scheduleReconnect() {
        if (this.reconnectTimer) return; // Already scheduled

        const delay = Math.min(
            RECONNECT.BASE_DELAY * Math.pow(RECONNECT.MULTIPLIER, this.reconnectAttempts),
            RECONNECT.MAX_DELAY
        );

        this.reconnectAttempts++;
        this.setState(CONNECTION_STATE.RECONNECTING);

        console.log(
            `[NizhalBridge] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt #${this.reconnectAttempts})`
        );

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    clearReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.reconnectAttempts = 0;
    }

    // ── Heartbeat ──────────────────────────────────────────────────

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            this.send({ type: MSG.PING });
        }, 25000); // Every 25 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // ── Messaging ──────────────────────────────────────────────────

    /**
     * Send a typed message to the Tauri backend over WebSocket.
     * @param {object} envelope - { type, id?, payload? }
     * @returns {string|null} The request ID (if generated), or null on failure.
     */
    send(envelope) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[NizhalBridge] Cannot send — not connected');
            return null;
        }

        // Auto-assign a request ID if none provided
        if (!envelope.id) {
            envelope.id = `ext-${++this.requestCounter}-${Date.now()}`;
        }
        if (!envelope.payload) {
            envelope.payload = {};
        }

        try {
            this.ws.send(JSON.stringify(envelope));
            return envelope.id;
        } catch (err) {
            console.error('[NizhalBridge] Send error:', err);
            return null;
        }
    }

    /**
     * Handle an inbound message from the WebSocket.
     * Routes to the Sidebar UI via browser.runtime messaging.
     */
    handleMessage(raw) {
        let envelope;
        try {
            envelope = JSON.parse(raw);
        } catch (err) {
            console.error('[NizhalBridge] Invalid JSON from server:', err);
            return;
        }

        const { type, id, payload } = envelope;

        // Handle the welcome message
        if (type === MSG.CONNECTED) {
            this.capabilities = payload?.capabilities || [];
            console.log('[NizhalBridge] Server capabilities:', this.capabilities);
        }

        // Forward everything to the sidebar via runtime messaging
        try {
            // Use chrome.runtime directly since service workers can't use the polyfill
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: ACTION.EVENT,
                    type,
                    id,
                    payload,
                }).catch(() => {
                    // Sidebar may not be open — that's fine, silently discard
                });
            }
        } catch (err) {
            // No listener (sidebar closed) — expected, ignore
        }
    }

    // ── State Management ───────────────────────────────────────────

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;

        // Broadcast state change to sidebar
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: ACTION.STATUS_UPDATE,
                    state: newState,
                    capabilities: this.capabilities,
                    reconnectAttempts: this.reconnectAttempts,
                }).catch(() => {});
            }
        } catch (err) {
            // No listener — sidebar may not be open
        }
    }

    /**
     * Get a snapshot of the current bridge status.
     */
    getStatus() {
        return {
            state: this.state,
            capabilities: this.capabilities,
            reconnectAttempts: this.reconnectAttempts,
            wsUrl: WS_URL,
        };
    }
}

// ─── Singleton Instance ───────────────────────────────────────────────

const bridge = new NizhalBridge();

// Start connecting immediately when the service worker loads
bridge.connect();

// ─── Message Router (Sidebar → Background) ───────────────────────────

/**
 * Listen for messages from the Sidebar UI and route them.
 */
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            switch (message.action) {
                case ACTION.GET_STATUS:
                    sendResponse(bridge.getStatus());
                    break;

                case ACTION.SEND_CHAT: {
                    const reqId = bridge.send({
                        type: MSG.CHAT,
                        payload: {
                            message: message.text || '',
                            pageContext: message.pageContext || null,
                        },
                    });
                    sendResponse({ success: !!reqId, id: reqId });
                    break;
                }

                case ACTION.GET_PAGE_CONTEXT: {
                    // Forward to the content script in the active tab
                    if (typeof chrome !== 'undefined' && chrome.tabs) {
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs[0]?.id) {
                                chrome.tabs.sendMessage(
                                    tabs[0].id,
                                    { action: ACTION.GET_PAGE_CONTEXT },
                                    (response) => {
                                        sendResponse(response || { error: 'No response from content script' });
                                    }
                                );
                            } else {
                                sendResponse({ error: 'No active tab found' });
                            }
                        });
                    } else {
                        sendResponse({ error: 'Tabs API not available' });
                    }
                    return true; // Keep the message channel open for async response
                }

                default:
                    sendResponse({ error: `Unknown action: ${message.action}` });
            }
        } catch (err) {
            console.error('[Background] Message handler error:', err);
            sendResponse({ error: err.message });
        }

        // Return true to keep the sendResponse channel open for async
        return true;
    });
}

// ─── Side Panel / Sidebar Registration ────────────────────────────────

/**
 * Chromium: open the side panel when the extension action button is clicked.
 * Firefox: sidebar_action in the manifest handles this automatically.
 */
if (typeof chrome !== 'undefined' && chrome.action) {
    chrome.action.onClicked.addListener((tab) => {
        try {
            if (chrome.sidePanel) {
                chrome.sidePanel.open({ windowId: tab.windowId });
            }
        } catch (err) {
            console.error('[Background] Failed to open side panel:', err);
        }
    });
}

// ─── Service Worker Keep-Alive ────────────────────────────────────────

/**
 * Chromium MV3 service workers can be suspended after ~30s of inactivity.
 * The heartbeat in the bridge keeps the WebSocket alive, and the alarm API
 * can be used as a fallback wake-up mechanism if needed.
 */
if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.create('nizhal-keepalive', { periodInMinutes: 0.4 });
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'nizhal-keepalive') {
            // Reconnect if we've been disconnected
            if (bridge.state === CONNECTION_STATE.DISCONNECTED) {
                bridge.connect();
            }
        }
    });
}

console.log('[NizhalBridge] Background service worker loaded');
