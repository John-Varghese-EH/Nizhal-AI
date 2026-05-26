/**
 * constants.js — Shared constants for the Nizhal browser extension.
 * Single source of truth for ports, timeouts, and message types.
 */

/** Default WebSocket port matching the Tauri ws_bridge server. */
export const WS_PORT = 9721;

/** WebSocket URL template. */
export const WS_URL = `ws://localhost:${WS_PORT}`;

/** Reconnection strategy. */
export const RECONNECT = {
    /** Initial delay before first reconnect attempt (ms). */
    BASE_DELAY: 1000,
    /** Maximum delay between reconnect attempts (ms). */
    MAX_DELAY: 30000,
    /** Backoff multiplier per consecutive failure. */
    MULTIPLIER: 1.5,
    /** Maximum number of reconnect attempts before giving up. */
    MAX_ATTEMPTS: Infinity,
};

/** Typed message types for the WS envelope protocol. */
export const MSG = {
    // Outbound → Tauri
    PING: 'ping',
    CHAT: 'chat',
    STATUS: 'status',
    PAGE_CONTEXT: 'page_context',

    // Inbound ← Tauri
    CONNECTED: 'connected',
    PING_RESPONSE: 'ping_response',
    CHAT_RESPONSE: 'chat_response',
    STATUS_RESPONSE: 'status_response',
    ERROR: 'error',
};

/** Runtime message actions (extension internal, between service worker ↔ sidebar). */
export const ACTION = {
    /** Sidebar → Background: request current bridge status. */
    GET_STATUS: 'nizhal:get_status',
    /** Sidebar → Background: send a chat message. */
    SEND_CHAT: 'nizhal:send_chat',
    /** Sidebar → Content: extract page context. */
    GET_PAGE_CONTEXT: 'nizhal:get_page_context',
    /** Background → Sidebar: bridge status update. */
    STATUS_UPDATE: 'nizhal:status_update',
    /** Background → Sidebar: chat response. */
    CHAT_RESPONSE: 'nizhal:chat_response',
    /** Background → Sidebar: incoming event from Tauri. */
    EVENT: 'nizhal:event',
};

/** Connection states for the bridge. */
export const CONNECTION_STATE = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    FAILED: 'failed',
};
