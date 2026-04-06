import React from 'react';
import Button from '../ui/Button';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full">
        <div className="liquid-glass rounded-xl border border-error/30 bg-error/5 p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-error block mb-4">error_outline</span>
          <h1 className="text-2xl font-bold text-error mb-2">Something went wrong</h1>
          <p className="text-on-surface-variant mb-6">We encountered an unexpected error. Please try again.</p>
          {error && (
            <div className="bg-surface-container rounded-lg p-3 mb-6 text-left">
              <p className="text-xs font-mono text-on-surface-variant break-words">{error.message}</p>
            </div>
          )}
          <div className="flex gap-3">
            {resetError && (
              <Button variant="primary" onClick={resetError} className="flex-1">
                Reload
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => (window.location.href = '/')}
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
