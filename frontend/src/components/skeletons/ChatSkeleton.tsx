// ─── Chat Skeleton ───────────────────────────────────────────────────────────

import React from 'react';

const ChatSkeleton: React.FC = () => (
  <div className="space-y-6 p-4 max-w-[720px] mx-auto">
    {[1, 2, 3].map((idx) => (
      <div
        key={idx}
        className={`flex gap-3 ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
      >
        {idx % 2 === 0 && (
          <div className="skeleton-pulse w-8 h-8 rounded-full shrink-0" />
        )}
        <div className={`flex-1 max-w-[70%] ${idx % 2 !== 0 ? 'ml-auto' : ''}`}>
          <div className="liquid-glass rounded-2xl p-4 space-y-2">
            <div className="skeleton-pulse h-3 w-full rounded" />
            <div className="skeleton-pulse h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ChatSkeleton;