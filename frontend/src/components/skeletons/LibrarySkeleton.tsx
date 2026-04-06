// ─── Library Skeleton ────────────────────────────────────────────────────────

import React from 'react';

const LibrarySkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="liquid-glass rounded-xl p-5" style={{ minHeight: '140px' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="skeleton-pulse w-10 h-10 rounded-lg" />
          <div className="skeleton-pulse h-3 flex-1 rounded" />
        </div>
        <div className="space-y-2">
          <div className="skeleton-pulse h-3 w-full rounded" />
          <div className="skeleton-pulse h-3 w-2/3 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export default LibrarySkeleton;