// ─── Skeleton ────────────────────────────────────────────────────────────────

import React from 'react';

interface SkeletonProps {
  variant?: 'line' | 'circle' | 'card' | 'table';
  className?: string;
  count?: number;
}

const VARIANT_CLASSES = {
  line: 'h-3 w-3/4 rounded',
  circle: 'h-10 w-10 rounded-full',
  card: 'h-32 w-full rounded-xl',
  table: 'h-10 w-full rounded-lg',
};

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'line',
  className = '',
  count = 1,
}) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`skeleton-pulse ${VARIANT_CLASSES[variant]} ${
          i > 0 ? 'mt-2' : ''
        } ${className}`}
      />
    ))}
  </>
);

export default Skeleton;