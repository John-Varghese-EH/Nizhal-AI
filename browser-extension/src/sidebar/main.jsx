/**
 * main.jsx — Sidebar React entry point
 *
 * Mounts the ConnectionBoundary (which decides between
 * ChatView and DisconnectedView) into the sidebar root.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ConnectionBoundary from './components/ConnectionBoundary.jsx';
import './styles/sidebar.css';

ReactDOM.createRoot(document.getElementById('sidebar-root')).render(
    <React.StrictMode>
        <ConnectionBoundary />
    </React.StrictMode>
);
