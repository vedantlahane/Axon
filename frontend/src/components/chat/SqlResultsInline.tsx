// ─── SQL Results Inline ──────────────────────────────────────────────────────
// Compact query results displayed inline after a SqlBlock.

import React from 'react';
import type { SqlQueryResult } from '../../types/database';

interface SqlResultsInlineProps {
  result: SqlQueryResult;
}

const SqlResultsInline: React.FC<SqlResultsInlineProps> = ({ result }) => {
  // ── Row Results ────────────────────────────────────────────────────────
  if (result.type === 'rows' && result.columns && result.rows) {
    const displayRows = result.rows.slice(0, 10);
    const hasMore = result.rows.length > 10;

    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs px-1" style={{ color: 'var(--text-secondary)' }}>
          Query Results · {result.rows.length} rows
        </span>
        <div
          className="overflow-x-auto rounded-lg"
          style={{
            border: '1px solid var(--glass-border)',
            background: 'var(--surface-container-lowest, #060e20)',
          }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                {result.columns.map((col, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-mono font-medium uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)', fontSize: '10px' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-white/5 transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {result.columns!.map((_, ci) => (
                    <td
                      key={`${idx}-${ci}`}
                      className="px-3 py-2 font-mono truncate max-w-[200px]"
                      style={{ color: '#CBD5E1' }}
                    >
                      {String(row[ci] ?? 'NULL')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div
              className="px-3 py-2 text-xs"
              style={{
                color: 'var(--text-secondary)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              Showing {displayRows.length} of {result.rows.length} rows
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Acknowledgment ─────────────────────────────────────────────────────
  if (result.type === 'ack') {
    return (
      <div className="glass-success rounded-lg p-3">
        <p className="text-xs" style={{ color: 'var(--color-success)' }}>
          ✓ {result.message} ({result.rowCount} row
          {result.rowCount === 1 ? '' : 's'})
        </p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (result.type === 'error') {
    return (
      <div className="glass-error rounded-lg p-3">
        <p className="text-xs" style={{ color: 'var(--color-error)' }}>
          SQL error: {result.message}
        </p>
      </div>
    );
  }

  return null;
};

export default SqlResultsInline;