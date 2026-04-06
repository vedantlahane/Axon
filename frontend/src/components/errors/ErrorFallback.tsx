// ─── Error Fallback ──────────────────────────────────────────────────────────

import React from 'react';
import Icon from '../ui/Icon';

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
    {/* Icon */}
    <div className="liquid-glass w-20 h-20 rounded-2xl flex items-center justify-center">
      <Icon
        name="error_outline"
        className="text-4xl"
        style={{
          color: 'var(--color-error, #FB7185)',
          fontVariationSettings: "'FILL' 1",
        }}
      />
    </div>

    {/* Text */}
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-white">Something went wrong</h2>
      <p
        className="text-sm leading-relaxed"
        style={{ maxWidth: '400px', color: 'var(--text-secondary)' }}
      >
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
    </div>

    {/* Error detail */}
    {error?.message && (
      <div
        className="rounded-lg p-3 text-left max-w-md w-full"
        style={{
          background: 'var(--bg-surface-lowest, #060e20)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <p className="text-xs font-mono break-words" style={{ color: 'var(--text-muted)' }}>
          {error.message}
        </p>
      </div>
    )}

    {/* Actions */}
    <div className="flex gap-3">
      {resetError && (
        <button type="button" className="btn-primary" onClick={resetError}>
          <Icon name="refresh" size={16} />
          Try Again
        </button>
      )}
      <button
        type="button"
        className="btn-glass"
        onClick={() => (window.location.href = '/')}
      >
        <Icon name="home" size={16} />
        Go Home
      </button>
    </div>
  </div>
);

export default ErrorFallback;