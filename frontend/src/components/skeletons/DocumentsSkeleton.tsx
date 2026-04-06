// ─── Documents Skeleton ──────────────────────────────────────────────────────

import React from 'react';

const DocumentsSkeleton: React.FC = () => (
  <div className="space-y-6 p-4">
    {/* Dropzone skeleton */}
    <div
      className="rounded-2xl p-8 flex flex-col items-center justify-center"
      style={{
        minHeight: '160px',
        border: '2px dashed rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="skeleton-pulse w-10 h-10 rounded-full mb-3" />
      <div className="skeleton-pulse h-3 w-40 rounded" />
    </div>

    {/* Document grid — responsive: 3 / 2 / 1 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="liquid-glass rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="skeleton-pulse w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-pulse h-3 w-3/4 rounded" />
              <div className="skeleton-pulse h-2 w-1/2 rounded" />
            </div>
          </div>
          <div className="skeleton-pulse h-2 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export default DocumentsSkeleton;