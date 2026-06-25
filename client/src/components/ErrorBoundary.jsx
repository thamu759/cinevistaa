import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, remountKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, error: null, remountKey: prev.remountKey + 1 }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: '1rem',
          padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)'
        }}>
          <AlertTriangle size={48} style={{ color: 'var(--color-accent-red, #ef4444)' }} />
          <h2 style={{ color: 'var(--color-text-main)', fontSize: '1.5rem', margin: 0 }}>Something went wrong</h2>
          <p style={{ maxWidth: '400px', lineHeight: 1.6, margin: 0 }}>
            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={this.handleRetry}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.5rem', background: 'var(--color-accent-gold)',
                color: '#000', border: 'none', borderRadius: '8px',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
              }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.5rem', background: 'transparent',
                color: 'var(--color-text-main)', border: '1px solid var(--color-border)',
                borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return <div key={this.state.remountKey}>{this.props.children}</div>;
  }
}
