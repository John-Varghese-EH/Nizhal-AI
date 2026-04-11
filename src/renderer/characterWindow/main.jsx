import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import '../browserShim'; // Initialize Tauri/browser API bridge for character window
import CharacterApp from './CharacterApp';
import '../styles/globals.css';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Character Window Crash:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: 'rgba(255,0,0,0.8)', color: 'white', position: 'absolute', top: 0, left: 0, zIndex: 9999 }}>
                    <h2>Character App Crashed</h2>
                    <pre>{this.state.error?.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <CharacterApp />
        </ErrorBoundary>
    </React.StrictMode>
);
