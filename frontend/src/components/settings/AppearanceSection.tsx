import React, { useState } from 'react';
import Toggle from '../ui/Toggle';

interface AppearanceSectionProps {
  theme?: 'dark' | 'light' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  onThemeChange?: (theme: string) => void;
  onFontSizeChange?: (size: string) => void;
}

const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  theme = 'dark',
  fontSize = 'medium',
  onThemeChange,
  onFontSizeChange,
}) => {
  const [localTheme, setLocalTheme] = useState(theme);
  const [localFontSize, setLocalFontSize] = useState(fontSize);

  return (
    <div className="liquid-glass rounded-xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-on-surface mb-6">Appearance</h2>
      <div className="space-y-6">
        <div>
          <p className="text-on-surface-variant text-sm mb-3">Theme</p>
          <div className="flex gap-2">
            {['dark', 'light', 'system'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setLocalTheme(t as 'dark' | 'light' | 'system');
                  onThemeChange?.(t);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  localTheme === t
                    ? 'bg-violet-500 text-white'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-on-surface-variant text-sm mb-3">Font Size</p>
          <div className="flex gap-2">
            {['small', 'medium', 'large'].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setLocalFontSize(size as 'small' | 'medium' | 'large');
                  onFontSizeChange?.(size);
                }}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  localFontSize === size
                    ? 'bg-violet-500 text-white'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Toggle label="Send message with Enter" checked={true} onChange={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;
