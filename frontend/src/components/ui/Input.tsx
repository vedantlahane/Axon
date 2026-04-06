// ─── Input ───────────────────────────────────────────────────────────────────

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconPosition = 'left', className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined"
            style={{ fontSize: '18px', color: 'var(--text-ghost)' }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`input-glass ${
            icon && iconPosition === 'left' ? 'pl-10' : ''
          } ${icon && iconPosition === 'right' ? 'pr-10' : ''} ${
            error ? 'border-[var(--color-error)]' : ''
          } ${className}`}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined"
            style={{ fontSize: '18px', color: 'var(--text-ghost)' }}
          >
            {icon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  )
);

Input.displayName = 'Input';
export default Input;