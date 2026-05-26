/**
 * DisconnectedView.jsx — Polished fallback UI
 *
 * Shown when the Nizhal AI Desktop app is not running or unreachable.
 * Displays a premium, animated "Waiting for Nizhal AI Desktop..." state
 * with reconnection attempt info.
 */

import React from 'react';
import useBridgeStore from '../hooks/useBridgeStore.js';
import { CONNECTION_STATE } from '@shared/constants.js';

export default function DisconnectedView() {
    const connectionState = useBridgeStore((s) => s.connectionState);
    const reconnectAttempts = useBridgeStore((s) => s.reconnectAttempts);

    const isReconnecting = connectionState === CONNECTION_STATE.RECONNECTING ||
                           connectionState === CONNECTION_STATE.CONNECTING;

    const statusLabel = isReconnecting
        ? `Reconnecting... (attempt #${reconnectAttempts})`
        : 'Desktop app not detected';

    return (
        <div className="disconnected-overlay">
            {/* Animated icon */}
            <div className="disconnected-overlay__icon">
                <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: 'var(--primary)', animation: isReconnecting ? 'float 2s ease-in-out infinite' : 'none' }}
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h.01" />
                    <path d="M12 12h.01" />
                    <path d="M16 12h.01" />
                </svg>
            </div>

            <h2 className="disconnected-overlay__title">
                {isReconnecting ? 'Connecting to Nizhal AI...' : 'Waiting for Nizhal AI'}
            </h2>

            <p className="disconnected-overlay__subtitle">
                {isReconnecting
                    ? 'Attempting to connect to your desktop companion. This happens automatically.'
                    : 'Please launch the Nizhal AI desktop app to use the browser extension. The connection will be established automatically.'}
            </p>

            <span className="disconnected-overlay__status">
                {isReconnecting && (
                    <span style={{ marginRight: 6, display: 'inline-block', animation: 'pulse 1s infinite' }}>⟳</span>
                )}
                {statusLabel}
            </span>
        </div>
    );
}
