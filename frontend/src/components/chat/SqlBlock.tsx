// ─── SQL Block ───────────────────────────────────────────────────────────────
// Inline code editor card for SQL queries.
// Matches FRONTEND_CONTEXT.md §5.3 "SqlBlock"

import React from 'react';

interface SqlBlockProps {
  sql: string;
  filename?: string;
  validated?: boolean;
  onCopy: () => void;
  onRun: () => void;
  isCopied?: boolean;
}

const SqlBlock: React.FC<SqlBlockProps> = ({
  sql,
  filename = 'query.sql',
  validated = false,
  onCopy,
  onRun,
  isCopied,
}) => (
  <div
    className="liquid-glass rounded-xl overflow-hidden w-full"
    style={{
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }}
  >
    {/* ── Header ────────────────────────────────────────────────────── */}
    <div
      className="flex items-center justify-between px-5 py-3"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '16px', color: 'var(--text-secondary)' }}
        >
          terminal
        </span>
        <span className="text-xs font-mono text-slate-400">{filename}</span>
      </div>

      {/* Status badge */}
      {validated && (
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-success)' }}
          />
          <span className="text-[10px] uppercase tracking-widest text-slate-400">
            Validated
          </span>
        </div>
      )}
    </div>

    {/* ── Code Body ─────────────────────────────────────────────────── */}
    <pre
      className="p-6 font-mono text-sm leading-relaxed overflow-x-auto"
      style={{
        background: 'var(--surface-container-lowest, #060e20)',
        color: '#CBD5E1',
      }}
    >
      <code>{sql}</code>
    </pre>

    {/* ── Footer ────────────────────────────────────────────────────── */}
    <div
      className="flex items-center justify-end gap-3 px-5 py-4"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Copy */}
      <button
        type="button"
        className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium transition-colors hover:text-white"
        style={{ color: 'var(--text-secondary)' }}
        onClick={onCopy}
        aria-label="Copy SQL"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
          {isCopied ? 'check' : 'content_copy'}
        </span>
        {isCopied ? 'Copied' : 'Copy'}
      </button>

      {/* Run */}
      <button
        type="button"
        className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium transition-colors"
        style={{ color: 'var(--accent-violet-light, #a78bfa)' }}
        onClick={onRun}
        aria-label="Run SQL query"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}
        >
          play_arrow
        </span>
        Run Query
      </button>
    </div>
  </div>
);

export default SqlBlock;