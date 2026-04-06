import React from 'react';
import { cn } from '../../utils/formatters';

interface AvatarProps {
  src?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, fallback, size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-white font-semibold',
        sizeClasses[size],
        className
      )}
    >
      {src ? <img src={src} alt={fallback} className="w-full h-full rounded-full object-cover" /> : fallback}
    </div>
  );
};

export default Avatar;
