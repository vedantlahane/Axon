import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

// ─── Default Fallback ────────────────────────────────────────────────────────

interface ErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
    <div className="liquid-glass w-20 h-20 rounded-2xl flex items-center justify-center">
      <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--error)' }}>error_outline</span>
    </div>
    <div className="space-y-2">
      <h2 className="headline-sm text-white">Something went wrong</h2>
      <p className="body-md" style={{ maxWidth: '400px', color: 'var(--text-secondary)' }}>
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
    </div>
    {onRetry && (
      <button className="btn-glass" onClick={onRetry} type="button">
        <span className="material-symbols-outlined text-sm">refresh</span>
        Try Again
      </button>
    )}
  </div>
);

export default ErrorBoundary;
