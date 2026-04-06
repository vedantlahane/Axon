// ─── Settings Skeleton ───────────────────────────────────────────────────────

import React from 'react';

const SettingsSkeleton: React.FC = () => (
  <div className="space-y-8 p-4 max-w-[720px] mx-auto">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="liquid-glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="skeleton-pulse w-5 h-5 rounded" />
          <div className="skeleton-pulse h-4 w-32 rounded" />
        </div>
        <div className="space-y-3">
          <div className="skeleton-pulse h-3 w-full rounded" />
          <div className="skeleton-pulse h-3 w-3/4 rounded" />
          <div className="skeleton-pulse h-8 w-28 rounded-lg mt-2" />
        </div>
      </div>
    ))}
  </div>
);

export default SettingsSkeleton;