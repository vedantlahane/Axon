// ─── Query Results Table ─────────────────────────────────────────────────────
// Full results table card with export actions.
// Matches FRONTEND_CONTEXT.md §5.3 "QueryResultsTable"

import React from 'react';

interface QueryResultsTableProps {
  columns: string[];
  rows: Array<Record<string, any>>;
  executionTime: number;
  rowCount: number;
  onExportCSV?: () => void;
  onExportXLSX?: () => void;
  onVisualize?: () => void;
}

const isNumeric = (val: unknown): boolean =>
  typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)));

const formatGrowth = (val: unknown): { text: string; positive: boolean } | null => {
  const str = String(val);
  const match = str.match(/^([+-]?\d+\.?\d*)%$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return { text: str, positive: num >= 0 };
};

const QueryResultsTable: React.FC<QueryResultsTableProps> = ({
  columns,
  rows,
  executionTime,
  rowCount,
  onExportCSV,
  onExportXLSX,
  onVisualize,
}) => (
  <div
    className="liquid-glass rounded-xl overflow-hidden p-1 mb-4"
    style={{ border: '1px solid rgba(255, 255, 255, 0.05)' }}
  >
    {/* ── Header ────────────────────────────────────────────────────── */}
    <div className="px-6 py-4">
      <span
        className="text-[10px] uppercase tracking-widest font-medium"
        style={{ color: 'rgba(196, 199, 201, 0.6)' }}
      >
        Query Results · {rowCount} rows · {executionTime}ms
      </span>
    </div>

    {/* ── Table ─────────────────────────────────────────────────────── */}
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr
            style={{
              borderBottom: '1px solid rgba(68, 71, 73, 0.10)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col}
                className="px-6 py-3 text-[10px] uppercase tracking-widest font-medium"
                style={{ color: 'rgba(196, 199, 201, 0.6)' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-white/5 transition-colors"
              style={{
                borderBottom:
                  idx < rows.length - 1
                    ? '1px solid rgba(255, 255, 255, 0.03)'
                    : undefined,
              }}
            >
              {columns.map((col) => {
                const val = row[col];
                const growth = formatGrowth(val);
                const numeric = isNumeric(val);

                return (
                  <td
                    key={col}
                    className={`px-6 py-4 text-sm ${
                      numeric ? 'text-right tabular-nums' : ''
                    }`}
                    style={{
                      color: growth
                        ? growth.positive
                          ? 'var(--color-success)'
                          : 'var(--color-error)'
                        : 'var(--on-surface)',
                      fontWeight: growth ? 700 : 400,
                    }}
                  >
                    {String(val ?? '')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ── Footer ────────────────────────────────────────────────────── */}
    {(onExportCSV || onExportXLSX || onVisualize) && (
      <div
        className="flex items-center justify-end gap-4 px-6 py-3"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {onExportCSV && (
          <button
            type="button"
            className="text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            onClick={onExportCSV}
          >
            CSV
          </button>
        )}
        {onExportXLSX && (
          <button
            type="button"
            className="text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            onClick={onExportXLSX}
          >
            XLSX
          </button>
        )}
        {onVisualize && (
          <button
            type="button"
            className="text-xs uppercase tracking-widest transition-colors"
            style={{ color: 'var(--accent-violet-light, #a78bfa)' }}
            onClick={onVisualize}
          >
            Visualize
          </button>
        )}
      </div>
    )}
  </div>
);

export default QueryResultsTable;