// ─── useDatabaseSettings (DEPRECATED) ────────────────────────────────────────
// DEPRECATED: This hook duplicates databaseStore.ts (Zustand).
// All components should use useDatabaseStore directly or useDatabase hook.
//
// Migration: Replace all usages with:
//   import { useDatabaseStore } from '../stores/databaseStore';

export { useDatabaseStore as default } from '../stores/databaseStore';