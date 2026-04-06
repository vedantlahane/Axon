// ─── SQL Results View ────────────────────────────────────────────────────────

import React, { useState } from 'react';
import type { SqlQueryResult } from '../../types/database';
import { exportSqlResultsXlsx } from '../../utils/formatters';

interface SqlResultsViewProps {
  result: SqlQueryResult | null;
}

export const SqlResultsView: React.FC<SqlResultsViewProps> = ({ result }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (res: SqlQueryResult) => {
    if (res.type !== 'rows' || isExporting) return;
    setIsExporting(true);
    try {
      const rows = res.rows.map((row) => {
        const obj: Record<string, unknown> = {};
        res.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
      await exportSqlResultsXlsx('', res.columns, rows);
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Empty State ──────────────────────────────────────────────────────
  if (!result) {
    return (
      <div
        className="rounded-xl p-4 text-sm text-center"
        style={{
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          color: 'var(--text-muted)',
        }}
      >
        Run a query to view results.
      </div>
    );
  }

  // ── Row Results ──────────────────────────────────────────────────────
  if (result.type === 'rows') {
    const rows = result.rows.map((row) =>
      row.map((cell) => (cell === null ? 'NULL' : String(cell)))
    );

    return (
      <div className="flex min-w-0 w-full flex-col gap-3">
        {/* Summary */}
        <div
          className="flex items-center justify-between rounded-lg px-4 py-2"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong className="text-white">{result.rowCount}</strong> row
            {result.rowCount === 1 ? '' : 's'} · {result.columns.length} column
            {result.columns.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              {result.executionTimeMs}ms
            </span>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExport(result)}
              className="btn-glass text-[10px] px-2 py-1"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                download
              </span>
              {isExporting ? 'Exporting…' : 'Export XLSX'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-x-auto rounded-xl"
          style={{
            background: 'var(--bg-surface-lowest, #060e20)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] uppercase tracking-widest font-medium"
                    style={{ color: 'rgba(196, 199, 201, 0.6)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-white/5 transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-4 py-2 font-mono text-xs"
                        style={{ color: '#CBD5E1' }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={result.columns.length}
                    className="px-4 py-8 text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No rows returned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {result.hasMore && (
          <p className="text-xs" style={{ color: 'var(--color-warning)' }}>
            Results limited to {result.rowCount} rows. Increase the limit or refine your query.
          </p>
        )}
      </div>
    );
  }

  // ── Error Result ─────────────────────────────────────────────────────
  if (result.type === 'error') {
    return (
      <div className="glass-error rounded-xl p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '16px',
              color: 'var(--color-error)',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            error
          </span>
          <span className="text-sm font-medium" style={{ color: '#FB7185' }}>
            Query failed
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {result.message}
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{result.executionTimeMs}ms</span>
          {result.errorCode && <span>{result.errorCode}</span>}
        </div>
      </div>
    );
  }

  // ── Acknowledgment Result ────────────────────────────────────────────
  return (
    <div className="glass-success rounded-xl p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '16px',
            color: 'var(--color-success)',
            fontVariationSettings: "'FILL' 1",
          }}
        >
          check_circle
        </span>
        <span className="text-sm font-medium" style={{ color: '#34D399' }}>
          Success
        </span>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {result.message}
      </p>
            <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{result.rowCount} rows affected</span>
        <span>{result.executionTimeMs}ms</span>
      </div>
    </div>
  );
};