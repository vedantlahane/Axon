import React, { useState } from "react";
import type { SqlQueryResult } from "../../services/chatApi";
import { exportSqlResultsXlsx } from "../../services/chatApi";

interface SqlResultsViewProps {
  result: SqlQueryResult | null;
}

export const SqlResultsView: React.FC<SqlResultsViewProps> = ({ result }) => {
  const [isExportingResults, setIsExportingResults] = useState(false);

  const handleExportResults = async (queryText: string, result: SqlQueryResult) => {
    if (result.type !== "rows" || isExportingResults) return;
    setIsExportingResults(true);
    try {
      const rows = result.rows.map((row) => {
        const obj: Record<string, unknown> = {};
        result.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
      await exportSqlResultsXlsx(queryText, result.columns, rows);
    } catch (err) {
      console.error("Failed to export results:", err);
    } finally {
      setIsExportingResults(false);
    }
  };

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-subtle)]">
        Run a query to view results.
      </div>
    );
  }

  if (result.type === "rows") {
    const rows = result.rows.map((row) =>
      row.map((cell) => (cell === null ? "NULL" : String(cell)))
    );

    return (
      <div className="flex min-w-0 w-full flex-col gap-3">
        {/* Results summary header */}
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2">
          <span className="text-sm text-[var(--text-muted)]">
            <strong className="text-[var(--text-primary)]">{result.rowCount}</strong> row{result.rowCount === 1 ? "" : "s"} • {result.columns.length} column{result.columns.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-subtle)]">{result.executionTimeMs}ms</span>
            <button
              type="button"
              disabled={isExportingResults}
              onClick={() => handleExportResults("", result)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent-soft)]/80 disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {isExportingResults ? "Exporting..." : "Export XLSX"}
            </button>
          </div>
        </div>

        {/* Results table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-panel)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
                {result.columns.map((col) => (
                  <th key={col} className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-[var(--border)]/45 transition hover:bg-[var(--bg-soft)]/60">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 font-mono text-xs text-[var(--text-secondary)]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={result.columns.length} className="px-4 py-8 text-center text-[var(--text-subtle)]">
                    No rows returned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {result.hasMore && (
          <p className="text-xs text-amber-500/80 dark:text-amber-200/80">
            Results limited to {result.rowCount} rows. Increase the limit or refine your query.
          </p>
        )}
      </div>
    );
  }

  if (result.type === "error") {
    return (
      <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-300">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-sm font-semibold text-rose-200">Query failed</span>
        </div>
        <p className="text-sm text-rose-100">{result.message}</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-rose-100/80">
          <span>{result.executionTimeMs}ms</span>
          {result.errorCode && <span>{result.errorCode}</span>}
        </div>
      </div>
    );
  }

  // Acknowledgment result
  return (
    <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
      <div className="mb-2 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">Success</span>
      </div>
      <p className="text-sm text-emerald-700 dark:text-emerald-100">{result.message}</p>
      <div className="mt-2 flex items-center gap-4 text-xs text-emerald-700/75 dark:text-emerald-200/70">
        <span>{result.rowCount} rows affected</span>
        <span>{result.executionTimeMs}ms</span>
      </div>
    </div>
  );
};
