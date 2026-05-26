/**
 * InputArea.jsx — Chat input with page context extraction
 *
 * Features:
 *   - Auto-resizing textarea
 *   - "Attach page" button to extract current tab context
 *   - Context badge showing the attached page
 *   - Send button with keyboard shortcut (Enter to send, Shift+Enter for newline)
 */

import React, { useState, useRef, useCallback } from 'react';
import useBridgeStore from '../hooks/useBridgeStore.js';

export default function InputArea() {
    const [inputText, setInputText] = useState('');
    const textareaRef = useRef(null);

    const sendMessage = useBridgeStore((s) => s.sendMessage);
    const isWaitingForResponse = useBridgeStore((s) => s.isWaitingForResponse);
    const pageContext = useBridgeStore((s) => s.pageContext);
    const extractPageContext = useBridgeStore((s) => s.extractPageContext);
    const clearPageContext = useBridgeStore((s) => s.clearPageContext);
    const isExtractingContext = useBridgeStore((s) => s.isExtractingContext);

    const canSend = inputText.trim().length > 0 && !isWaitingForResponse;

    const handleSend = useCallback(() => {
        if (!canSend) return;
        sendMessage(inputText);
        setInputText('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = '40px';
        }
    }, [canSend, inputText, sendMessage]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleInput = useCallback((e) => {
        setInputText(e.target.value);

        // Auto-resize textarea
        const el = e.target;
        el.style.height = '40px';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }, []);

    return (
        <div className="input-area">
            {/* Page context badge */}
            {pageContext && (
                <div className="input-area__context-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pageContext.title || pageContext.url}
                    </span>
                    <button onClick={clearPageContext} title="Remove page context">
                        ✕
                    </button>
                </div>
            )}

            <div className="input-area__form">
                <textarea
                    ref={textareaRef}
                    className="input-area__textarea"
                    value={inputText}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={pageContext ? 'Ask about this page...' : 'Message Nizhal AI...'}
                    rows={1}
                    disabled={isWaitingForResponse}
                />

                <div className="input-area__actions">
                    {/* Attach page context */}
                    <button
                        className="btn-icon"
                        onClick={extractPageContext}
                        disabled={isExtractingContext}
                        title="Attach current page context"
                    >
                        {isExtractingContext ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'pulse 1s infinite' }}>
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                        )}
                    </button>

                    {/* Send */}
                    <button
                        className="btn-icon btn-icon--primary"
                        onClick={handleSend}
                        disabled={!canSend}
                        title="Send message (Enter)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
