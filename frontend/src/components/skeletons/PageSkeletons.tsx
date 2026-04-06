// ─── Loading Skeletons ───────────────────────────────────────────────────────

import React from 'react';

export const ChatSkeleton: React.FC = () => (
  <div className="w-full max-w-[720px] mx-auto px-4 pt-24 space-y-10">
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
        {i % 2 !== 0 && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full skeleton-pulse" />
            <div className="w-12 h-3 skeleton-pulse rounded-md" />
          </div>
        )}
        <div className={`skeleton-pulse rounded-lg ${i % 2 === 0 ? 'w-3/4' : 'w-full'}`} style={{ height: i % 2 === 0 ? '48px' : '120px' }} />
      </div>
    ))}
  </div>
);

export const LibrarySkeleton: React.FC = () => (
  <div className="w-full max-w-[960px] mx-auto px-4 pt-24 space-y-6">
    <div className="skeleton-pulse h-12 w-48 rounded-lg" />
    <div className="skeleton-pulse h-4 w-72 rounded-md" />
    <div className="skeleton-pulse h-10 rounded-lg mt-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton-pulse h-36 rounded-xl" />)}
    </div>
  </div>
);

export const DocumentsSkeleton: React.FC = () => (
  <div className="w-full max-w-[960px] mx-auto px-4 pt-24 space-y-6">
    <div className="skeleton-pulse h-12 w-48 rounded-lg" />
    <div className="skeleton-pulse h-4 w-64 rounded-md" />
    <div className="skeleton-pulse h-32 rounded-2xl mt-6" />
    <div className="space-y-3 mt-6">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton-pulse h-16 rounded-xl" />)}
    </div>
  </div>
);

export const SettingsSkeleton: React.FC = () => (
  <div className="w-full max-w-[640px] mx-auto px-4 pt-24 space-y-6">
    <div className="skeleton-pulse h-12 w-40 rounded-lg" />
    <div className="skeleton-pulse h-4 w-56 rounded-md" />
    {[...Array(4)].map((_, i) => <div key={i} className="skeleton-pulse h-40 rounded-2xl" />)}
  </div>
);
