import React from 'react';
import { cn } from '../../utils/formatters';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false }) => {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-violet-500' : 'bg-surface-variant',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
      {label && <label className="text-on-surface font-medium">{label}</label>}
    </div>
  );
};

export default Toggle;
