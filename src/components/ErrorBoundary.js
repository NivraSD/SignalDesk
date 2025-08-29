import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when there's an error
      return (
        <div className="error-boundary-container" style={{
          padding: '40px',
          margin: '20px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ 
              color: '#dc2626', 
              fontSize: '24px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span role="img" aria-label="error">⚠️</span>
              Something went wrong
            </h2>
            
            <p style={{ 
              color: '#7f1d1d', 
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              We encountered an unexpected error. The application may still work if you refresh or try again.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ 
                marginBottom: '20px',
                padding: '12px',
                backgroundColor: '#fee2e2',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  color: '#991b1b',
                  marginBottom: '8px'
                }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ 
                  overflow: 'auto',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fca5a5',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ffffff',
                  color: '#dc2626',
                  border: '2px solid #dc2626',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#ffffff'}
              >
                Refresh Page
              </button>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Go to Home
              </button>
            </div>

            {this.state.errorCount > 2 && (
              <p style={{ 
                marginTop: '20px',
                padding: '12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '4px',
                color: '#78350f'
              }}>
                <strong>Multiple errors detected.</strong> If this continues, please contact support or try clearing your browser cache.
              </p>
            )}
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;