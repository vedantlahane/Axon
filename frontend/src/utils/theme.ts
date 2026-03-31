export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

export const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const applyTheme = (theme: ThemeMode): void => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const currentTheme = (): ThemeMode => {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

export const toggleTheme = (): ThemeMode => {
  const nextTheme = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  return nextTheme;
};
