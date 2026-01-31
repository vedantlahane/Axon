import React from "react";
import type { PendingQuery } from "./types";

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
}) => {
  return (
    <section className="flex flex-col gap-3">
      <header className="mb-2">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="uppercase tracking-[0.2em]">Query Pending Approval</span>
        </span>
      </header>
      {pendingQuery ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-amber-200/70">
            <span>Source: {pendingQuery.source === "ai" ? "AI Generated" : "User Input"}</span>
            <span>{new Date(pendingQuery.timestamp).toLocaleTimeString()}</span>
          </div>
          <pre className="mb-4 overflow-x-auto rounded-lg border border-white/10 bg-slate-100 text-slate-700 dark:bg-[#060a18] dark:text-white/80 p-3 font-mono text-sm">
            {pendingQuery.query}
          </pre>
          <p className="mb-4 text-xs text-amber-200/60">
            Review the SQL query above before it runs on your database. You can edit the query in
            the editor if needed.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onApprove}
              disabled={isExecuting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Approve & Run
            </button>
            <button
              type="button"
              onClick={() => onEdit(pendingQuery.query)}
              className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <svg
                width="14"
                height="14"
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
              Edit First
            </button>
            <button
              type="button"
              onClick={onReject}
              className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Reject
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/50">
          No queries pending approval.
        </p>
      )}
    </section>
  );
};
