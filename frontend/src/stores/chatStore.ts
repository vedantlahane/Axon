// ─── Chat Store (Zustand) ────────────────────────────────────────────────────
// Manages conversations, messages, streaming state, and input attachments.
// Selective subscriptions prevent MessageList re-renders during input typing.

import { create } from 'zustand';
import type {
  ChatMessage,
  ConversationSummary,
  RawConversationDetail,
} from '../types/chat';
import * as chatService from '../services/chatService';

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface FileTile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'uploaded' | 'error';
  documentId?: string;
  error?: string;
}

export interface StreamingStep {
  label: string;
  status: 'done' | 'active' | 'pending';
}

interface ChatState {
  // ── Conversations ────────────────────────────────────────────────────
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // ── Sending / Streaming ──────────────────────────────────────────────
  isSending: boolean;
  isStreaming: boolean;
  streamingContent: string;
  streamingProgress: number | null;
  streamingSteps: StreamingStep[];

  // ── Input ────────────────────────────────────────────────────────────
  inputValue: string;
  files: FileTile[];
  inputSessionKey: string;

  // ── Library ──────────────────────────────────────────────────────────
  pinnedIds: Set<string>;
  searchQuery: string;

  // ── Actions — Conversations ──────────────────────────────────────────
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  clearConversations: () => void;

  // ── Actions — Messaging ──────────────────────────────────────────────
  sendMessage: (content: string, documentIds?: string[]) => Promise<void>;
  appendMessage: (message: ChatMessage) => void;
  startNewChat: () => void;

  // ── Actions — Streaming ──────────────────────────────────────────────
  startStreaming: () => void;
  updateStreamingContent: (content: string) => void;
  updateStreamingState: (updates: {
    progress?: number | null;
    steps?: StreamingStep[];
    content?: string;
  }) => void;
  finishStreaming: (finalMessage?: ChatMessage) => void;

  // ── Actions — Input ──────────────────────────────────────────────────
  setInputValue: (value: string) => void;
  addFile: (tile: FileTile) => void;
  updateFile: (id: string, updates: Partial<FileTile>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;

  // ── Actions — Library ────────────────────────────────────────────────
  pinConversation: (id: string) => void;
  unpinConversation: (id: string) => void;
  togglePinConversation: (id: string) => void;
  setSearchQuery: (query: string) => void;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function mapConversationDetail(detail: RawConversationDetail): {
  summary: ConversationSummary;
  messages: ChatMessage[];
} {
  return {
    summary: {
      id: detail.id,
      title: detail.title,
      summary: detail.summary,
      updatedAt: detail.updatedAt,
      updatedAtISO: detail.updatedAtISO,
      messageCount: detail.messageCount,
    },
    messages: detail.messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
      attachments: m.attachments,
    })),
  };
}

/* ── Store ────────────────────────────────────────────────────────────────── */

export const useChatStore = create<ChatState>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────────
  conversations: [],
  selectedConversationId: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  isStreaming: false,
  streamingContent: '',
  streamingProgress: null,
  streamingSteps: [],
  inputValue: '',
  files: [],
  inputSessionKey: `session-${Date.now()}`,
  pinnedIds: new Set<string>(),
  searchQuery: '',

  // ── Conversations ──────────────────────────────────────────────────────

  loadConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const raw = await chatService.fetchConversations();
      const conversations: ConversationSummary[] = raw.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        updatedAt: r.updatedAt,
        updatedAtISO: r.updatedAtISO,
        messageCount: r.messageCount,
      }));
      set({ conversations });
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  selectConversation: async (id: string) => {
    set({ isLoadingMessages: true, selectedConversationId: id });
    try {
      const detail = await chatService.fetchConversation(id);
      const { messages } = mapConversationDetail(detail);
      set({ messages, isLoadingMessages: false });
    } catch (err) {
      console.error('Failed to load conversation:', err);
      set({ isLoadingMessages: false });
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await chatService.deleteConversation(id);
      const state = get();
      const pinnedIds = new Set(state.pinnedIds);
      pinnedIds.delete(id);
      set({
        conversations: state.conversations.filter((c) => c.id !== id),
        pinnedIds,
        ...(state.selectedConversationId === id
          ? { selectedConversationId: null, messages: [] }
          : {}),
      });
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  },

  renameConversation: async (id: string, title: string) => {
    // Optimistic update
    set({
      conversations: get().conversations.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    });
    try {
      // If your chatService has a rename endpoint, call it here:
      // await chatService.renameConversation(id, title);
    } catch (err) {
      console.error('Failed to rename conversation:', err);
      // Could rollback here if needed
    }
  },

  clearConversations: () => {
    set({
      conversations: [],
      selectedConversationId: null,
      messages: [],
      pinnedIds: new Set(),
    });
  },

  // ── Messaging ──────────────────────────────────────────────────────────

  sendMessage: async (content: string, documentIds?: string[]) => {
    const state = get();
    if (state.isSending || state.isStreaming) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set({
      isSending: true,
      messages: [...state.messages, userMessage],
      inputValue: '',
      files: [],
    });

    try {
      const detail = await chatService.sendChatMessage({
        message: content,
        conversationId: state.selectedConversationId ?? undefined,
        documentIds,
      });
      const { summary, messages } = mapConversationDetail(detail);

      const conversations = get().conversations;
      const exists = conversations.find((c) => c.id === summary.id);

      set({
        selectedConversationId: summary.id,
        messages,
        conversations: exists
          ? conversations.map((c) => (c.id === summary.id ? summary : c))
          : [summary, ...conversations],
        isSending: false,
        inputSessionKey: `session-${Date.now()}`,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Rollback optimistic user message
      set({
        messages: state.messages,
        isSending: false,
      });
      throw err;
    }
  },

  appendMessage: (message: ChatMessage) => {
    set({ messages: [...get().messages, message] });
  },

  startNewChat: () => {
    set({
      selectedConversationId: null,
      messages: [],
      inputValue: '',
      files: [],
      isStreaming: false,
      streamingContent: '',
      streamingProgress: null,
      streamingSteps: [],
      inputSessionKey: `session-${Date.now()}`,
    });
  },

  // ── Streaming ──────────────────────────────────────────────────────────

  startStreaming: () => {
    set({
      isStreaming: true,
      streamingContent: '',
      streamingProgress: 0,
      streamingSteps: [],
    });
  },

  updateStreamingContent: (content: string) => {
    set({ streamingContent: content });
  },

  updateStreamingState: (updates) => {
    const current = get();
    set({
      ...(updates.content != null && { streamingContent: updates.content }),
      ...(updates.progress !== undefined && {
        streamingProgress: updates.progress,
      }),
      ...(updates.steps && { streamingSteps: updates.steps }),
    });
  },

  finishStreaming: (finalMessage?: ChatMessage) => {
    const state = get();
    set({
      isStreaming: false,
      streamingContent: '',
      streamingProgress: null,
      streamingSteps: [],
      isSending: false,
      ...(finalMessage
        ? { messages: [...state.messages, finalMessage] }
        : {}),
    });
  },

  // ── Input ──────────────────────────────────────────────────────────────

  setInputValue: (value: string) => set({ inputValue: value }),

  addFile: (tile: FileTile) => {
    set({ files: [...get().files, tile] });
  },

  updateFile: (id: string, updates: Partial<FileTile>) => {
    set({
      files: get().files.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  },

  removeFile: (id: string) => {
    set({ files: get().files.filter((f) => f.id !== id) });
  },

  clearFiles: () => set({ files: [] }),

  // ── Library ────────────────────────────────────────────────────────────

  pinConversation: (id: string) => {
    const pinnedIds = new Set(get().pinnedIds);
    pinnedIds.add(id);
    set({ pinnedIds });
  },

  unpinConversation: (id: string) => {
    const pinnedIds = new Set(get().pinnedIds);
    pinnedIds.delete(id);
    set({ pinnedIds });
  },

  togglePinConversation: (id: string) => {
    const pinnedIds = new Set(get().pinnedIds);
    if (pinnedIds.has(id)) {
      pinnedIds.delete(id);
    } else {
      pinnedIds.add(id);
    }
    set({ pinnedIds });
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
}));