import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import '../browserShim'; // Initialize Tauri/browser API bridge for character window
import CharacterApp from './CharacterApp';
import { ToastProvider } from '../contexts/ToastContext';
import '../styles/globals.css';

import ErrorBoundary from '../components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary name="Companion Engine" title="Mate Window Crashed">
            <ToastProvider>
                <CharacterApp />
            </ToastProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
