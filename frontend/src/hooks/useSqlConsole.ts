// ─── useSqlConsole (DEPRECATED) ──────────────────────────────────────────────
// DEPRECATED: This 300+ line hook duplicates databaseStore.ts (Zustand).
// The CanvasPanel component now reads directly from databaseStore.
//
// Migration: Replace all usages with:
//   import { useDatabaseStore } from '../stores/databaseStore';

export { useDatabaseStore as default } from '../stores/databaseStore';