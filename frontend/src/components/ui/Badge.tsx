// ─── Badge ───────────────────────────────────────────────────────────────────

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'violet';
  size?: 'sm' | 'md';
}

const VARIANTS: Record<string, { bg: string; color: string; border: string }> = {
  default: {
    bg: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-ghost)',
    border: 'rgba(255, 255, 255, 0.06)',
  },
  success: {
    bg: 'rgba(52, 211, 153, 0.10)',
    color: 'var(--color-success)',
    border: 'rgba(52, 211, 153, 0.20)',
  },
  error: {
    bg: 'rgba(251, 113, 133, 0.10)',
    color: 'var(--color-error)',
    border: 'rgba(251, 113, 133, 0.20)',
  },
  warning: {
    bg: 'rgba(251, 191, 36, 0.10)',
    color: 'var(--color-warning)',
    border: 'rgba(251, 191, 36, 0.20)',
  },
  info: {
    bg: 'rgba(96, 165, 250, 0.10)',
    color: 'var(--color-info)',
    border: 'rgba(96, 165, 250, 0.20)',
  },
  violet: {
    bg: 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))',
    color: 'var(--accent-violet-light, #a78bfa)',
    border: 'rgba(124, 58, 237, 0.20)',
  },
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const v = VARIANTS[variant] ?? VARIANTS.default;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium uppercase ${
        size === 'sm'
          ? 'px-1.5 py-0.5 text-[9px] tracking-[0.05em]'
          : 'px-2 py-0.5 text-[11px] tracking-[0.05em]'
      } ${className}`}
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;