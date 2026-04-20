import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div
        role="alert"
        style={{
          padding: '2rem',
          maxWidth: 720,
          margin: '3rem auto',
          border: '1px solid #d0d7de',
          borderRadius: 8,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Something went wrong.</h2>
        <p>The page failed to render. You can try again, or reload.</p>
        <pre
          style={{
            background: '#f6f8fa',
            padding: '0.75rem',
            borderRadius: 6,
            overflowX: 'auto',
            fontSize: 12,
          }}
        >
          {error.message}
        </pre>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={this.reset}>
            Try again
          </button>
          <button type="button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
