// ─── useChat Hook ────────────────────────────────────────────────────────────
// Thin convenience wrapper around chatStore Zustand selectors.

import { useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import type { FileTile } from '../stores/chatStore';

export const useChat = () => {
  const messages = useChatStore((s) => s.messages);
  const isSending = useChatStore((s) => s.isSending);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const inputValue = useChatStore((s) => s.inputValue);
  const files = useChatStore((s) => s.files);

  const sendMessage = useCallback(
    async (content: string, documentIds?: string[]) => {
      return useChatStore.getState().sendMessage(content, documentIds);
    },
    []
  );

  const selectConversation = useCallback((id: string) => {
    return useChatStore.getState().selectConversation(id);
  }, []);

  const loadConversations = useCallback(() => {
    return useChatStore.getState().loadConversations();
  }, []);

  const startNewChat = useCallback(() => {
    useChatStore.getState().startNewChat();
  }, []);

  const setInputValue = useCallback((value: string) => {
    useChatStore.getState().setInputValue(value);
  }, []);

  const addFile = useCallback((file: FileTile) => {
    useChatStore.getState().addFile(file);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    useChatStore.getState().removeFile(fileId);
  }, []);

  return {
    messages,
    isSending,
    isStreaming,
    selectedConversationId,
    inputValue,
    files,
    sendMessage,
    selectConversation,
    loadConversations,
    startNewChat,
    setInputValue,
    addFile,
    removeFile,
  };
};