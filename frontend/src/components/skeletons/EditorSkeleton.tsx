import React from 'react';
import Skeleton from '../ui/Skeleton';

const EditorSkeleton: React.FC = () => {
  return (
    <div className="liquid-glass rounded-lg p-4 border border-white/10 min-h-[400px]">
      <div className="font-mono space-y-2 opacity-60">
        <Skeleton variant="line" className="w-3/4" />
        <Skeleton variant="line" className="w-full" />
        <Skeleton variant="line" className="w-2/3" />
        <div className="mt-8" />
        <Skeleton variant="line" className="w-3/4" />
        <Skeleton variant="line" className="w-4/5" />
      </div>
    </div>
  );
};

export default EditorSkeleton;
