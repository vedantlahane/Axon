import React from "react";
import type { SqlQueryHistoryEntry } from "./types";
import { formatExecutionTimestamp } from "./types";

interface SqlHistoryPanelProps {
  history: SqlQueryHistoryEntry[];
  onSelectHistory: (entry: SqlQueryHistoryEntry) => void;
  onViewResult: (entry: SqlQueryHistoryEntry) => void;
}

export const SqlHistoryPanel: React.FC<SqlHistoryPanelProps> = ({
  history,
  onSelectHistory,
  onViewResult,
}) => {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <span className="text-xs text-white/40">{history.length} saved</span>
      </header>
      {history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Run queries to build your history.
        </p>
      ) : (
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] text-white/60 flex-1">
                  {entry.query.slice(0, 120)}
                  {entry.query.length > 120 && "..."}
                </span>
                {entry.source === "ai" && (
                  <span className="shrink-0 rounded bg-[#2563eb]/20 px-1.5 py-0.5 text-[9px] font-medium text-[#60a5fa]">
                    AI
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <span className="flex items-center gap-2">
                  <span className="rounded bg-white/10 px-1.5 py-0.5">
                    {entry.type.toUpperCase()}
                  </span>
                  <span>{entry.rowCount} rows</span>
                </span>
                <span>{formatExecutionTimestamp(entry.executedAt)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => onSelectHistory(entry)}
                  className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Load Query
                </button>
                {entry.result && (
                  <button
                    type="button"
                    onClick={() => onViewResult(entry)}
                    className="flex items-center gap-1 rounded-md border border-[#2563eb]/30 bg-[#2563eb]/10 px-2 py-1 text-[10px] text-[#60a5fa] transition hover:bg-[#2563eb]/20"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
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
};
