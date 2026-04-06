// ─── Storage Bar ─────────────────────────────────────────────────────────────

import React from 'react';

interface StorageBarProps {
  used: number;
  total: number;
}

const StorageBar: React.FC<StorageBarProps> = ({ used, total }) => {
  const percentage = Math.min((used / total) * 100, 100);
  const remaining = total - used;

  return (
    <div className="liquid-glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Storage Usage
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {used.toFixed(1)} MB of {total.toFixed(1)} MB
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.05)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background:
              percentage > 90
                ? 'var(--color-error)'
                : percentage > 70
                ? 'var(--color-warning)'
                : 'var(--accent-violet, #7C3AED)',
          }}
        />
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        {remaining.toFixed(1)} MB available
      </p>
    </div>
  );
};

export default StorageBar;