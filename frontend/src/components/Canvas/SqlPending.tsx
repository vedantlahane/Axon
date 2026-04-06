// ─── SQL Pending Approval Panel ──────────────────────────────────────────────

import React from 'react';
import Icon from '../ui/Icon';
import type { PendingQuery } from '../../types/database';

interface SqlPendingApprovalPanelProps {
  pendingQuery: PendingQuery | null;
  isExecuting: boolean;
  onApprove: () => void;
  onEdit: (query: string) => void;
  onReject: () => void;
}

export const SqlPendingApprovalPanel: React.FC<SqlPendingApprovalPanelProps> = ({
  pendingQuery,
  isExecuting,
  onApprove,
  onEdit,
  onReject,
}) => (
  <section className="flex flex-col gap-3">
    <header className="mb-2">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--color-warning)' }}>
        <Icon name="pending" size={14} />
        Query Pending Approval
      </span>
    </header>

    {pendingQuery ? (
      <div className="glass-warning rounded-xl p-4">
        {/* Meta */}
        <div
          className="mb-3 flex items-center justify-between text-xs"
          style={{ color: 'rgba(251, 191, 36, 0.70)' }}
        >
          <span>
            Source: {pendingQuery.source === 'assistant' ? 'AI Generated' : 'Suggestion'}
          </span>
          <span>{new Date(pendingQuery.timestamp).toLocaleTimeString()}</span>
        </div>

        {/* Query */}
        <pre
          className="mb-4 overflow-x-auto rounded-lg p-3 font-mono text-sm"
          style={{
            background: 'var(--bg-surface-lowest, #060e20)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
          }}
        >
          {pendingQuery.query}
        </pre>

        <p className="mb-4 text-xs" style={{ color: 'rgba(251, 191, 36, 0.60)' }}>
          Review the SQL query above before it runs on your database.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onApprove}
            disabled={isExecuting}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(52, 211, 153, 0.20)',
              border: '1px solid rgba(52, 211, 153, 0.30)',
              color: 'var(--color-success)',
            }}
          >
            <Icon name="check" size={14} />
            Approve & Run
          </button>
          <button
            type="button"
            onClick={() => onEdit(pendingQuery.query)}
            className="btn-glass text-sm"
          >
            <Icon name="edit" size={14} />
            Edit First
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: 'rgba(251, 113, 133, 0.10)',
              border: '1px solid rgba(251, 113, 133, 0.20)',
              color: 'var(--color-error)',
            }}
          >
            <Icon name="close" size={14} />
            Reject
          </button>
        </div>
      </div>
    ) : (
      <div
        className="rounded-xl p-4 text-sm text-center"
        style={{
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          color: 'var(--text-muted)',
        }}
      >
        No queries pending approval.
      </div>
    )}
  </section>
);