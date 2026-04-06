import React from 'react';
import { cn } from '../../utils/formatters';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  isIconOnly?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'glass',
      size = 'md',
      loading = false,
      icon,
      isIconOnly = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const variantClasses = {
      glass: 'liquid-glass text-on-surface hover:bg-white/[0.08] active:scale-95 transition-all',
      primary: 'bg-gradient-to-br from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700 active:scale-95 transition-all',
      ghost: 'text-on-surface hover:bg-white/5 active:scale-95 transition-all',
      danger: 'bg-error/20 text-error hover:bg-error/30 active:scale-95 transition-all',
    };

    const iconOnlyClasses = isIconOnly ? 'p-2' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center gap-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          isIconOnly && iconOnlyClasses,
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="animate-spin">
            <span className="material-symbols-outlined text-sm">sync</span>
          </span>
        ) : (
          icon && <span className="material-symbols-outlined text-base">{icon}</span>
        )}
        {!isIconOnly && children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
