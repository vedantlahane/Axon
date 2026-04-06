// ─── Appearance Section ──────────────────────────────────────────────────────
// Dark-only. No theme toggle. Font size + send behavior.

import React, { useState } from 'react';
import Icon from '../ui/Icon';
import Toggle from '../ui/Toggle';

interface AppearanceSectionProps {
  fontSize?: 'small' | 'medium' | 'large';
  sendWithEnter?: boolean;
  onFontSizeChange?: (size: string) => void;
  onSendWithEnterChange?: (enabled: boolean) => void;
}

const FONT_SIZES = ['small', 'medium', 'large'] as const;

const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  fontSize = 'medium',
  sendWithEnter = true,
  onFontSizeChange,
  onSendWithEnterChange,
}) => {
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localSendEnter, setLocalSendEnter] = useState(sendWithEnter);

  return (
    <section className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <Icon
          name="palette"
          style={{ color: 'var(--accent-violet-light, #a78bfa)', fontSize: 20 }}
        />
        <h2 className="text-lg font-semibold text-white">Appearance</h2>
      </div>

      <div className="space-y-6">
        {/* Font Size */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-3">Font Size</p>
          <div className="flex gap-2">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setLocalFontSize(size);
                  onFontSizeChange?.(size);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background:
                    localFontSize === size
                      ? 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))'
                      : 'var(--glass-bg, rgba(255, 255, 255, 0.05))',
                  color:
                    localFontSize === size
                      ? 'var(--accent-violet-light, #a78bfa)'
                      : 'var(--text-secondary)',
                                    border: `1px solid ${
                    localFontSize === size
                      ? 'rgba(124, 58, 237, 0.25)'
                      : 'var(--glass-border, rgba(255, 255, 255, 0.06))'
                  }`,
                }}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Send with Enter */}
        <div>
          <Toggle
            label="Send message with Enter"
            checked={localSendEnter}
            onChange={(checked) => {
              setLocalSendEnter(checked);
              onSendWithEnterChange?.(checked);
            }}
          />
          <p className="text-xs mt-1.5 ml-14" style={{ color: 'var(--text-muted)' }}>
            When disabled, use Shift+Enter to send.
          </p>
        </div>

        {/* Theme indicator (dark-only, informational) */}
        <div className="flex items-center gap-3 pt-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-surface-high, #222a3d)' }}
          >
            <Icon
              name="dark_mode"
              style={{ color: 'var(--text-ghost)', fontSize: 20 }}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Dark Mode</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Axon uses a dark-only liquid glass design system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppearanceSection;