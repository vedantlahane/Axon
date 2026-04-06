import React from 'react';
import Skeleton from '../ui/Skeleton';

const LibrarySkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <div key={idx} className="liquid-glass rounded-lg p-4 border border-white/10">
          <div className="mb-3 flex items-center gap-2">
            <Skeleton variant="circle" />
            <Skeleton variant="line" className="flex-1" />
          </div>
          <Skeleton variant="line" count={2} />
        </div>
      ))}
    </div>
  );
};

export default LibrarySkeleton;
