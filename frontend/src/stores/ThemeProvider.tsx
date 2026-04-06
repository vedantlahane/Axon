// ─── Theme Provider (Context) ────────────────────────────────────────────────
// Currently dark-only. The liquid glass design system has no light tokens.
// Kept as a provider for future extensibility (e.g., accent color themes).
//
// The TopBar theme toggle was removed in Round 2 per context doc:
// "No theme toggle exists in the UI."

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type Theme = 'dark';

interface ThemeContextValue {
  theme: Theme;
  /** @deprecated No-op. Design system is dark-only. Kept for compat. */
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.remove('light');
  root.classList.add('dark');
  root.style.colorScheme = 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme] = useState<Theme>('dark');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // No-op — dark only. Preserved for backward compatibility.
  const toggleTheme = useCallback(() => {
    // Design system is dark-only. This is intentionally a no-op.
    // If you add light mode in the future, implement toggling here
    // and create a full light token set in tokens.css.
  }, []);

  const setTheme = useCallback((_t: Theme) => {
    // Always dark. No-op.
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}