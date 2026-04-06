import React from 'react';
import { cn } from '../../utils/formatters';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconPosition = 'left', className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-on-surface mb-2">{label}</label>}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-base">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg bg-surface-container-lowest border border-surface-variant',
              'text-on-surface placeholder-on-surface-variant',
              'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon && iconPosition === 'left' && 'pl-10 pr-4 py-2',
              icon && iconPosition === 'right' && 'pr-10 pl-4 py-2',
              !icon && 'px-4 py-2',
              error && 'border-error focus:ring-error',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-base">
              {icon}
            </span>
          )}
        </div>
        {error && <p className="text-error text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
