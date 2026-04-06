import React from 'react';
import Skeleton from '../ui/Skeleton';

const DocumentsSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      {/* Upload dropzone skeleton */}
      <div className="liquid-glass rounded-lg p-8 border-2 border-dashed border-surface-variant">
        <Skeleton variant="circle" className="mx-auto mb-2" />
        <Skeleton variant="line" className="w-1/2 mx-auto" />
      </div>

      {/* Document cards grid */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="liquid-glass rounded-lg p-4 border border-white/10">
            <div className="mb-3 flex items-start gap-3">
              <Skeleton variant="circle" />
              <Skeleton variant="line" className="flex-1" count={2} />
            </div>
            <Skeleton variant="card" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsSkeleton;
