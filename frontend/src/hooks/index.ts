// ─── Hooks ───────────────────────────────────────────────────────────────────
// Re-export all hooks for convenience.

export { useAuth } from '../stores/AuthProvider';
export { useTheme } from '../stores/ThemeProvider';
export { useToast } from '../stores/ToastProvider';
export { useChatStore } from '../stores/chatStore';
export { useDatabaseStore } from '../stores/databaseStore';

// Custom hooks
export { useChat } from './useChat';
export { useDatabase } from './useDatabase';
export { useCommandPalette } from './useCommandPalette';
export { useMediaQuery } from './useMediaQuery';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
