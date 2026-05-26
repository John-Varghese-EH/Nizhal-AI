import React, { Component } from 'react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error(`[ErrorBoundary - ${this.props.name || 'Component'}] caught error:`, error, errorInfo);
        this.setState({ errorInfo });
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            // Elegant premium fallback UI
            return (
                <div style={{
                    padding: '24px',
                    margin: '12px',
                    borderRadius: '16px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f8fafc',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                    minHeight: this.props.mini ? 'auto' : '200px',
                    justifyContent: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                        }}>
                            ⚠️
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500', letterSpacing: '0.02em', color: '#fca5a5' }}>
                                {this.props.title || 'Service Block Degraded'}
                            </h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                                Isolated fault in {this.props.name || 'avatar render loop'}.
                            </p>
                        </div>
                    </div>

                    {!this.props.mini && (
                        <div style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            padding: '12px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: '#e2e8f0',
                            maxHeight: '120px',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {this.state.error?.toString() || 'Unknown runtime anomaly'}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
                                border: 'none',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)'
                            }}
                            onMouseOver={(e) => e.target.style.opacity = '0.9'}
                            onMouseOut={(e) => e.target.style.opacity = '1'}
                        >
                            Reset Component
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
