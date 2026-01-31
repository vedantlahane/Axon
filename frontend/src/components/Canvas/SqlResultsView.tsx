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
      <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/50">
        Run a query to view results.
      </div>
    );
  }

  if (result.type === "rows") {
    const rows = result.rows.map((row) =>
      row.map((cell) => (cell === null ? "NULL" : String(cell)))
    );

    return (
      <div className="flex flex-col gap-3 min-w-0 w-full">
        {/* Results summary header */}
        <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2">
          <span className="text-sm text-white/70">
            <strong className="text-white">{result.rowCount}</strong> row{result.rowCount === 1 ? "" : "s"} • {result.columns.length} column{result.columns.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50">{result.executionTimeMs}ms</span>
            <button
              type="button"
              disabled={isExportingResults}
              onClick={() => handleExportResults("", result)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/30 disabled:opacity-50"
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
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {result.columns.map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold text-white/70 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5 transition">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 text-white/70 font-mono text-xs">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={result.columns.length} className="px-4 py-8 text-center text-white/40">
                    No rows returned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {result.hasMore && (
          <p className="text-xs text-amber-200/70">
            Results limited to {result.rowCount} rows. Increase the limit or refine your query.
          </p>
        )}
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
        <span className="text-sm font-semibold text-emerald-200">Success</span>
      </div>
      <p className="text-sm text-emerald-100">{result.message}</p>
      <div className="mt-2 flex items-center gap-4 text-xs text-emerald-200/70">
        <span>{result.rowCount} rows affected</span>
        <span>{result.executionTimeMs}ms</span>
      </div>
    </div>
  );
};
