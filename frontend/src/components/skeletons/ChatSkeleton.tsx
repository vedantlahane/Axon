import React from 'react';
import Skeleton from '../ui/Skeleton';

const ChatSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((idx) => (
        <div
          key={idx}
          className={`flex gap-3 ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          {idx % 2 === 0 && <div className="w-10 h-10 rounded-full bg-gradient-to-r from-surface-variant to-surface-container flex-shrink-0 animate-pulse" />}
          <div className={`flex-1 ${idx % 2 === 0 ? '' : 'text-right'}`}>
            <div className="liquid-glass rounded-lg p-4 inline-block">
              <Skeleton variant="line" count={2} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatSkeleton;
