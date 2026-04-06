import React from 'react';
import { cn } from '../../utils/formatters';

interface SkeletonProps {
  variant?: 'line' | 'circle' | 'card' | 'table';
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ variant = 'line', className, count = 1 }) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-surface-variant to-surface-container rounded';

  const variantClasses = {
    line: 'h-4 w-3/4',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-lg',
    table: 'h-10 w-full',
  };

  const elements = Array(count)
    .fill(0)
    .map((_, i) => (
      <div key={i} className={cn(baseClasses, variantClasses[variant], className, i > 0 && 'mt-2')} />
    ));

  return <>{elements}</>;
};

export default Skeleton;
