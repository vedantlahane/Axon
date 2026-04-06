// ─── Button ──────────────────────────────────────────────────────────────────

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glass' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
  isIconOnly?: boolean;
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm',
};

const VARIANT_CLASSES = {
  glass: 'btn-glass',
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-glass',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'glass',
      size = 'md',
      loading = false,
      icon,
      isIconOnly = false,
      className = '',
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const dangerStyle =
      variant === 'danger'
        ? {
            color: 'var(--color-error)',
            borderColor: 'rgba(251, 113, 133, 0.20)',
            ...style,
          }
        : style;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${VARIANT_CLASSES[variant]} ${
          isIconOnly ? 'p-2' : SIZE_CLASSES[size]
        } rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        style={dangerStyle}
        {...props}
      >
        {loading ? (
          <span
            className="material-symbols-outlined animate-spin"
            style={{ fontSize: '16px' }}
          >
            sync
          </span>
        ) : (
          icon && (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '16px' }}
            >
              {icon}
            </span>
          )
        )}
        {!isIconOnly && children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;