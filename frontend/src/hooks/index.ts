// ─── Hooks Barrel Export ─────────────────────────────────────────────────────
// Active hooks that components should import from.

// ── From stores (canonical source) ──────────────────────────────────────────
export { useAuth } from '../stores/AuthProvider';
export { useToast } from '../stores/ToastProvider';
export { useTheme } from '../stores/ThemeProvider';

// ── Thin wrappers around Zustand stores ─────────────────────────────────────
export { useChat } from './useChat';
export { useDatabase } from './useDatabase';

// ── Utility hooks ───────────────────────────────────────────────────────────
export { useCommandPalette } from './useCommandPalette';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useMediaQuery } from './useMediaQuery';

// ── DEPRECATED — Do not use in new code ─────────────────────────────────────
// hooks/useAuth.ts           → use stores/AuthProvider
// hooks/useConversationManager.ts → use stores/chatStore
// hooks/useDatabaseSettings.ts    → use stores/databaseStore
// hooks/useSqlConsole.ts          → use stores/databaseStore