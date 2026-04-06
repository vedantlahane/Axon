// ─── Theme Utilities ─────────────────────────────────────────────────────────
// Dark-only design system. Light mode tokens don't exist.

export type Theme = 'dark';

/**
 * Always returns 'dark'. The liquid glass design system has no light tokens.
 * Kept for backward compatibility with any code that calls it.
 */
export function resolveInitialTheme(): Theme {
  return 'dark';
}

/**
 * Applies the dark theme to the document root.
 * Light mode is a no-op — there are no light tokens.
 */
export function applyTheme(_theme: Theme = 'dark'): void {
  void _theme;
  const root = document.documentElement;
  root.classList.remove('light');
  root.classList.add('dark');
  root.style.colorScheme = 'dark';
  // Don't persist to localStorage — it's always dark
}