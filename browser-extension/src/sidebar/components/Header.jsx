/**
 * Header.jsx — Sidebar header bar
 *
 * Displays the Nizhal AI brand, connection status dot,
 * and a clear-chat action button.
 */

import React from 'react';
import useBridgeStore from '../hooks/useBridgeStore.js';
import { CONNECTION_STATE } from '@shared/constants.js';

export default function Header() {
    const connectionState = useBridgeStore((s) => s.connectionState);
    const clearMessages = useBridgeStore((s) => s.clearMessages);

    const isConnected = connectionState === CONNECTION_STATE.CONNECTED;

    const statusDotClass = isConnected
        ? 'status-dot status-dot--connected'
        : connectionState === CONNECTION_STATE.CONNECTING || connectionState === CONNECTION_STATE.RECONNECTING
            ? 'status-dot status-dot--connecting'
            : 'status-dot status-dot--disconnected';

    const statusLabel = isConnected
        ? 'Connected'
        : connectionState === CONNECTION_STATE.RECONNECTING
            ? 'Reconnecting'
            : 'Offline';

    return (
        <header className="sidebar-header">
            <div className="sidebar-header__brand">
                <div className="sidebar-header__logo">N</div>
                <span className="sidebar-header__title">Nizhal AI</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="sidebar-header__status">
                    <div className={statusDotClass} />
                    <span>{statusLabel}</span>
                </div>

                <button
                    className="btn-icon"
                    onClick={clearMessages}
                    title="Clear chat"
                    style={{ width: 28, height: 28, fontSize: 12 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
