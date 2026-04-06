// ─── Input Metadata ──────────────────────────────────────────────────────────
// Subtle metadata row below the input bar.
// Matches FRONTEND_CONTEXT.md §5.1 "ChatInput — Metadata row"

import React from 'react';
import Icon from '../ui/Icon';

interface InputMetadataProps {
  modelName: string;
  documentCount: number;
  hasDatabase?: boolean;
}

const InputMetadata: React.FC<InputMetadataProps> = ({
  modelName,
  documentCount,
  hasDatabase,
}) => (
  <div
    className="flex items-center justify-center gap-6 font-mono text-[10px] uppercase tracking-widest"
    style={{ opacity: 0.4, color: 'var(--text-muted)' }}
  >
    {/* Model */}
    <span className="flex items-center gap-1.5">
      <span style={{ color: 'var(--accent-violet-light)', fontSize: '8px' }}>●</span>
      Model: {modelName}
    </span>

    {/* Documents */}
    <span className="flex items-center gap-1.5">
      📎 {documentCount} document{documentCount !== 1 ? 's' : ''}
    </span>

    {/* Database (optional) */}
    {hasDatabase && (
      <span className="flex items-center gap-1.5">
        <Icon name="database" size={12} />
        Connected
      </span>
    )}

    {/* Command palette shortcut */}
    <span>⌘K</span>
  </div>
);

export default InputMetadata;