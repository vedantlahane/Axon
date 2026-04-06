// ─── Toggle ──────────────────────────────────────────────────────────────────
import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false }) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 rounded-full transition-colors"
      style={{
        background: checked
          ? 'var(--accent-violet, #7C3AED)'
          : 'var(--bg-surface-highest, #2d3449)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
    {label && (
      <label className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
        {label}
      </label>
    )}
  </div>
);

export default Toggle;