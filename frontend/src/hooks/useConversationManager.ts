// ─── useConversationManager (DEPRECATED) ─────────────────────────────────────
// DEPRECATED: This hook duplicates chatStore.ts (Zustand).
// All components should use useChatStore directly or useChat hook.
//
// This file is retained only for backward compatibility. Do not use in new code.
// Migration: Replace all usages with:
//   import { useChatStore } from '../stores/chatStore';

export { useChatStore as default } from '../stores/chatStore';