/**
 * ConnectionBoundary.jsx — Higher-Order Component
 *
 * Wraps the main sidebar UI. Listens to the NizhalBridge connection
 * status and renders either:
 *   - The Chat UI (when connected)
 *   - The Disconnected Fallback UI (when not connected)
 *
 * Also registers the chrome.runtime.onMessage listener to receive
 * state updates and events from the background service worker.
 */

import React, { useEffect } from 'react';
import useBridgeStore from '../hooks/useBridgeStore.js';
import { CONNECTION_STATE, ACTION } from '@shared/constants.js';
import DisconnectedView from './DisconnectedView.jsx';
import ChatView from './ChatView.jsx';

export default function ConnectionBoundary() {
    const connectionState = useBridgeStore((s) => s.connectionState);
    const fetchStatus = useBridgeStore((s) => s.fetchStatus);
    const handleBridgeEvent = useBridgeStore((s) => s.handleBridgeEvent);

    // Fetch the initial bridge status on mount
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Register the runtime message listener for background → sidebar events
    useEffect(() => {
        const listener = (message) => {
            if (message.action === ACTION.STATUS_UPDATE || message.action === ACTION.EVENT) {
                handleBridgeEvent(message);
            }
        };

        if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
            chrome.runtime.onMessage.addListener(listener);
        }

        return () => {
            if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
                chrome.runtime.onMessage.removeListener(listener);
            }
        };
    }, [handleBridgeEvent]);

    // Periodically poll status (backup for missed messages)
    useEffect(() => {
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    // Decide what to render based on connection state
    const isConnected = connectionState === CONNECTION_STATE.CONNECTED;

    return (
        <div className="sidebar-container">
            {/* Ambient aura blobs */}
            <div className="aura-container">
                <div className="aura-blob aura-blob--cyan" />
                <div className="aura-blob aura-blob--purple" />
            </div>

            {isConnected ? <ChatView /> : <DisconnectedView />}
        </div>
    );
}
