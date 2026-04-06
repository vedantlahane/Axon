import React from 'react';
import { cn } from '../../utils/formatters';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'violet';
  size?: 'sm' | 'md';
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-surface-container text-on-surface',
    success: 'bg-emerald-500/20 text-emerald-300',
    error: 'bg-error/20 text-error',
    warning: 'bg-amber-500/20 text-amber-300',
    info: 'bg-blue-500/20 text-blue-300',
    violet: 'bg-violet-500/20 text-violet-300',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Badge;
