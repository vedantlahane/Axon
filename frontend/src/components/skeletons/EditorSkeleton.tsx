// ─── Editor Skeleton ─────────────────────────────────────────────────────────

import React from 'react';

const EditorSkeleton: React.FC = () => (
  <div className="liquid-glass rounded-xl overflow-hidden" style={{ minHeight: '400px' }}>
    {/* Toolbar */}
    <div
      className="flex items-center gap-3 px-5 py-3"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="skeleton-pulse h-3 w-24 rounded" />
      <div className="flex-1" />
      <div className="skeleton-pulse h-6 w-16 rounded-lg" />
      <div className="skeleton-pulse h-6 w-20 rounded-lg" />
    </div>

    {/* Code area */}
    <div
      className="p-6 space-y-3 font-mono"
      style={{ background: 'var(--bg-surface-lowest, #060e20)' }}
    >
      <div className="skeleton-pulse h-3 w-3/4 rounded" />
      <div className="skeleton-pulse h-3 w-full rounded" />
      <div className="skeleton-pulse h-3 w-2/3 rounded" />
      <div className="h-6" />
      <div className="skeleton-pulse h-3 w-4/5 rounded" />
      <div className="skeleton-pulse h-3 w-1/2 rounded" />
    </div>
  </div>
);

export default EditorSkeleton;