// ─── Avatar ──────────────────────────────────────────────────────────────────
// Solid CSS circle. No images per FRONTEND_CONTEXT.md:
// "NO external avatar images (use solid CSS circles)"

import React from 'react';

interface AvatarProps {
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'brand';
}

const sizes = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const Avatar: React.FC<AvatarProps> = ({
  fallback,
  size = 'md',
  className = '',
  variant = 'default',
}) => (
  <div
    className={`flex items-center justify-center rounded-full font-semibold shrink-0 ${sizes[size]} ${className}`}
    style={{
      background:
        variant === 'brand'
          ? 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))'
          : 'rgb(51, 65, 85)',
      color:
        variant === 'brand'
          ? 'var(--accent-violet-light, #a78bfa)'
          : 'var(--text-secondary)',
      border: '1px solid rgba(255, 255, 255, 0.10)',
    }}
  >
    {fallback || ''}
  </div>
);

export default Avatar;