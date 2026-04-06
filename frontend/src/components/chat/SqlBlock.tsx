import React from 'react';

interface SqlBlockProps {
  sql: string;
  onCopy: () => void;
  onRun: () => void;
  isCopied?: boolean;
}

const SqlBlock: React.FC<SqlBlockProps> = ({ sql, onCopy, onRun, isCopied }) => (
  <div className="liquid-glass rounded-lg overflow-hidden w-full" style={{ boxShadow: 'var(--shadow-glass)' }}>
    {/* Header */}
    <div className="flex justify-between items-center px-6 py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--text-ghost)' }}>description</span>
        <span className="label-sm" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>query.sql</span>
      </div>
      <div className="flex gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
      </div>
    </div>

    {/* Code */}
    <pre className="p-6 font-mono text-sm leading-relaxed overflow-x-auto" style={{ background: 'var(--surface-container-lowest)', color: '#cbd5e1' }}>
      <code>{sql}</code>
    </pre>

    {/* Footer */}
    <div className="px-6 py-4 flex justify-end gap-4" style={{ background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <button
        type="button"
        className="label-sm flex items-center gap-2 transition-colors hover:text-white"
        style={{ color: 'var(--text-secondary)', letterSpacing: '0.1em' }}
        onClick={onCopy}
        aria-label="Copy SQL"
      >
        <span className="material-symbols-outlined text-sm">{isCopied ? 'check' : 'content_copy'}</span>
        {isCopied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        className="label-sm flex items-center gap-2 transition-colors"
        style={{ color: 'var(--violet-bright)', letterSpacing: '0.1em' }}
        onClick={onRun}
        aria-label="Run SQL query"
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        Run Query
      </button>
    </div>
  </div>
);

export default SqlBlock;
