// ─── Chat Store (Zustand) ────────────────────────────────────────────────────
// Manages conversations, messages, streaming state, and input attachments.
// Selective subscriptions prevent MessageList re-renders during input typing.

import { create } from 'zustand';
import type { ChatMessage, ConversationSummary, RawConversationDetail } from '../types/chat';
import * as chatService from '../services/chatService';

interface FileTile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'uploaded' | 'error';
  documentId?: string;
  error?: string;
}

interface ChatState {
  // Conversations
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;

  // Input
  inputValue: string;
  files: FileTile[];
  inputSessionKey: string;

  // Actions — conversations
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearConversations: () => void;

  // Actions — messaging
  sendMessage: (content: string, documentIds?: string[]) => Promise<void>;
  appendMessage: (message: ChatMessage) => void;
  startNewChat: () => void;

  // Actions — input
  setInputValue: (value: string) => void;
  addFile: (tile: FileTile) => void;
  updateFile: (id: string, updates: Partial<FileTile>) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
}

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

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  selectedConversationId: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  inputValue: '',
  files: [],
  inputSessionKey: `session-${Date.now()}`,

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
      set({
        conversations: state.conversations.filter((c) => c.id !== id),
        ...(state.selectedConversationId === id
          ? { selectedConversationId: null, messages: [] }
          : {}),
      });
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  },

  clearConversations: () => {
    set({
      conversations: [],
      selectedConversationId: null,
      messages: [],
    });
  },

  sendMessage: async (content: string, documentIds?: string[]) => {
    const state = get();
    if (state.isSending) return;

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
      inputSessionKey: `session-${Date.now()}`,
    });
  },

  setInputValue: (value: string) => set({ inputValue: value }),

  addFile: (tile: FileTile) => {
    set({ files: [...get().files, tile] });
  },

  updateFile: (id: string, updates: Partial<FileTile>) => {
    set({
      files: get().files.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  },

  removeFile: (id: string) => {
    set({ files: get().files.filter((f) => f.id !== id) });
  },

  clearFiles: () => set({ files: [] }),
}));
