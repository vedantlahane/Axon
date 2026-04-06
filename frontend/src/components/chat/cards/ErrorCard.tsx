// ─── Error Card ──────────────────────────────────────────────────────────────
// Inline error display with retry/dismiss actions.
// Matches FRONTEND_CONTEXT.md §5.3 "ErrorCard"

import React from 'react';
import Icon from '../../ui/Icon';

interface ErrorCardProps {
  title: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  onEdit?: () => void;
  onDismiss?: () => void;
  recoveryTip?: string;
}

const ErrorCard: React.FC<ErrorCardProps> = ({
  title,
  message,
  errorCode,
  onRetry,
  onEdit,
  onDismiss,
  recoveryTip,
}) => (
  <div className="mb-4">
    {/* Error ambient glow */}
    <div className="relative">
      <div
        className="absolute -inset-4 error-ambient-bg rounded-3xl -z-10 pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="glass-error rounded-xl p-6 md:p-8"
        style={{ border: '1px solid rgba(239, 68, 68, 0.20)' }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Icon
            name="warning"
            className="text-rose-400 shrink-0"
            style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
          />
          <h3 className="font-medium text-rose-300">{title}</h3>
        </div>

        {/* Body */}
        <p className="text-sm text-slate-400 leading-relaxed mb-4">
          {message}
        </p>

        {/* Error code badge */}
        {errorCode && (
          <span
            className="inline-flex items-center rounded-full px-3 py-1 font-mono text-xs mb-4"
            style={{
              background: 'rgba(239, 68, 68, 0.10)',
              border: '1px solid rgba(239, 68, 68, 0.20)',
              color: '#FB7185',
            }}
          >
            {errorCode}
          </span>
        )}

        {/* Separator */}
        {(onRetry || onEdit || onDismiss) && (
          <div
            className="my-4 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.20), transparent)',
            }}
          />
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onRetry && (
            <button
              type="button"
              className="btn-glass text-xs"
              style={{
                color: '#FB7185',
                borderColor: 'rgba(239, 68, 68, 0.20)',
              }}
              onClick={onRetry}
            >
              <Icon name="refresh" size={14} />
              Retry
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className="btn-glass text-xs"
              onClick={onEdit}
            >
              Edit Connection
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-auto"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Recovery Tip */}
    {recoveryTip && (
      <div className="flex justify-center mt-3">
        <div
          className="glass-info rounded-full px-4 py-2 flex items-center gap-2"
        >
          <Icon
            name="lightbulb"
            style={{ fontSize: 14, color: 'var(--color-warning)' }}
          />
          <p className="text-xs text-slate-500 italic">{recoveryTip}</p>
        </div>
      </div>
    )}
  </div>
);

export default ErrorCard;