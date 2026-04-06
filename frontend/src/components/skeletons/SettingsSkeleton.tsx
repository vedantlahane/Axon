import React from 'react';
import Skeleton from '../ui/Skeleton';

const SettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3, 4].map((idx) => (
        <div key={idx} className="liquid-glass rounded-lg p-6 border border-white/10">
          <Skeleton variant="line" className="w-1/3 mb-4" />
          <Skeleton variant="line" count={3} />
        </div>
      ))}
    </div>
  );
};

export default SettingsSkeleton;
