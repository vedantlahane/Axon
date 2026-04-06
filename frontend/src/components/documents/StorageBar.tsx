import React from 'react';

interface StorageBarProps {
  used: number; // in MB
  total: number; // in MB
}

const StorageBar: React.FC<StorageBarProps> = ({ used, total }) => {
  const percentage = (used / total) * 100;
  const remaining = total - used;

  return (
    <div className="liquid-glass rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-on-surface">Storage Usage</p>
        <p className="text-sm text-on-surface-variant">
          {used.toFixed(1)} MB of {total.toFixed(1)} MB
        </p>
      </div>
      <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-on-surface-variant mt-2">
        {remaining.toFixed(1)} MB available
      </p>
    </div>
  );
};

export default StorageBar;
