/**
 * ChatView.jsx — Main chat interface
 *
 * Renders the full connected UI: header + message list + input area.
 * All state is pulled from the Zustand bridge store.
 */

import React, { useRef, useEffect } from 'react';
import useBridgeStore from '../hooks/useBridgeStore.js';
import Header from './Header.jsx';
import InputArea from './InputArea.jsx';

export default function ChatView() {
    const messages = useBridgeStore((s) => s.messages);
    const isWaitingForResponse = useBridgeStore((s) => s.isWaitingForResponse);
    const chatEndRef = useRef(null);

    // Auto-scroll to the bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isWaitingForResponse]);

    return (
        <>
            <Header />

            <div className="chat-area">
                {messages.length === 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        gap: 12,
                        color: 'var(--text-dim)',
                        textAlign: 'center',
                        padding: '32px 16px',
                    }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: 'var(--primary-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                        }}>
                            💬
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                            Start a conversation with Nizhal AI.
                            <br />
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                You can also share the current page for context.
                            </span>
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`chat-message chat-message--${msg.role}`}
                    >
                        {msg.content}
                    </div>
                ))}

                {isWaitingForResponse && (
                    <div className="typing-indicator">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            <InputArea />
        </>
    );
}
