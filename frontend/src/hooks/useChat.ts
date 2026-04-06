import { useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';

export const useChat = () => {
  const messages = useChatStore((state) => state.messages);
  const isSending = useChatStore((state) => state.isSending);
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const inputValue = useChatStore((state) => state.inputValue);
  const files = useChatStore((state) => state.files);

  const sendMessage = useCallback(
    async (content: string, documentIds?: string[]) => {
      return useChatStore.getState().sendMessage(content, documentIds);
    },
    []
  );

  const selectConversation = useCallback((conversationId: string) => {
    return useChatStore.getState().selectConversation(conversationId);
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

  const addFile = useCallback((file: any) => {
    useChatStore.getState().addFile(file);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    useChatStore.getState().removeFile(fileId);
  }, []);

  return {
    messages,
    isSending,
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
