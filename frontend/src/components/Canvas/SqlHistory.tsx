// ─── SQL History Panel ───────────────────────────────────────────────────────

import React from 'react';
import Icon from '../ui/Icon';
import type { SqlQueryHistoryEntry } from '../../types/database';
import { formatExecutionTimestamp } from '../../utils/formatters';

interface SqlHistoryPanelProps {
  history: SqlQueryHistoryEntry[];
  onSelectHistory: (entry: SqlQueryHistoryEntry) => void;
  onViewResult: (entry: SqlQueryHistoryEntry) => void;
}

export const SqlHistoryPanel: React.FC<SqlHistoryPanelProps> = ({
  history,
  onSelectHistory,
  onViewResult,
}) => (
  <section className="flex flex-col gap-3">
    <header className="flex items-center justify-between">
      <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
        {history.length} saved
      </span>
    </header>

    {history.length === 0 ? (
      <div
        className="rounded-xl p-4 text-sm text-center"
        style={{
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          color: 'var(--text-muted)',
        }}
      >
        Run queries to build your history.
      </div>
    ) : (
      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-2 rounded-lg px-3 py-2 text-xs"
            style={{
              background: 'var(--glass-bg, rgba(255, 255, 255, 0.05))',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.06))',
            }}
          >
            {/* Query preview */}
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {entry.query.slice(0, 120)}
              {entry.query.length > 120 && '…'}
            </span>

            {/* Meta row */}
            <div
              className="flex items-center justify-between text-[10px]"
              style={{ color: 'var(--text-subtle)' }}
            >
              <span className="flex items-center gap-2">
                {entry.result && (
                  <>
                    <span
                      className="rounded px-1.5 py-0.5"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {entry.result.type.toUpperCase()}
                    </span>
                    <span>{entry.result.rowCount} rows</span>
                  </>
                )}
              </span>
              <span>{formatExecutionTimestamp(entry.executedAt)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => onSelectHistory(entry)}
                className="btn-glass text-[10px] px-2 py-1"
              >
                <Icon name="edit" size={12} />
                Load Query
              </button>
              {entry.result && (
                <button
                  type="button"
                  onClick={() => onViewResult(entry)}
                  className="text-[10px] px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                  style={{
                    background: 'rgba(96, 165, 250, 0.10)',
                    border: '1px solid rgba(96, 165, 250, 0.20)',
                    color: 'var(--color-info)',
                  }}
                >
                  <Icon name="visibility" size={12} />
                  View Results
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);