import { useCallback, useEffect, useState } from "react";
import {
  deleteConversation,
  fetchConversation,
  fetchConversations,
  sendChatMessage,
} from "../services/chatService";
import type { ChatMessage, ConversationSummary, RawConversationDetail } from "../types/chat";

// Simple mappers - can be enhanced later
const mapSummary = (raw: any): ConversationSummary => ({
  id: raw.id,
  title: raw.title,
  summary: raw.summary,
  updatedAt: raw.updatedAt,
  updatedAtISO: raw.updatedAtISO,
  messageCount: raw.messageCount,
});

const mapMessage = (raw: any): ChatMessage => ({
  id: raw.id,
  sender: raw.sender,
  content: raw.content,
  timestamp: raw.timestamp,
  attachments: raw.attachments,
});

const sortSummaries = (summaries: ConversationSummary[]) =>
  summaries.sort((a, b) => new Date(b.updatedAtISO ?? '').getTime() - new Date(a.updatedAtISO ?? '').getTime());

interface UseConversationManagerOptions {
  currentUser: any | null;
  openAuthModal: (mode: "signin" | "signup") => void;
  filterConversationMessages: (messages: ChatMessage[]) => ChatMessage[];
}

const useConversationManager = ({
  currentUser,
  openAuthModal,
  filterConversationMessages,
}: UseConversationManagerOptions) => {
  const [historyConversations, setHistoryConversations] = useState<ConversationSummary[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [inputSessionKey, setInputSessionKey] = useState<string>(() => `new-${Date.now()}`);

  const startNewChat = useCallback(() => {
    setCurrentMessages([]);
    setSelectedHistoryId(null);
    setActiveConversationId(null);
    setInputSessionKey(`new-${Date.now()}`);
  }, []);

  const clearConversations = useCallback(() => {
    setHistoryConversations([]);
    setSelectedHistoryId(null);
    setActiveConversationId(null);
    setCurrentMessages([]);
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const items = await fetchConversations();
      setHistoryConversations(sortSummaries(items.map(mapSummary)));
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setHistoryConversations([]);
      return;
    }

    void refreshConversations();
  }, [currentUser, refreshConversations]);

  const applyConversationUpdate = useCallback((detail: RawConversationDetail) => {
    const summary = mapSummary(detail);
    setHistoryConversations((prev) => {
      const filtered = prev.filter((item) => item.id !== summary.id);
      return sortSummaries([summary, ...filtered]);
    });
  }, []);

  const updateMessagesFromDetail = useCallback(
    (detail: RawConversationDetail) => {
      const mappedMessages = detail.messages.map(mapMessage);
      setSelectedHistoryId(detail.id);
      setActiveConversationId(detail.id);
      setInputSessionKey(detail.id);

      const messagesToDisplay = filterConversationMessages(mappedMessages);

      setCurrentMessages(messagesToDisplay);
    },
    [filterConversationMessages]
  );

  const appendMessage = useCallback((message: ChatMessage) => {
    setCurrentMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        documentIds?: string[];
      }
    ) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (!currentUser) {
        openAuthModal("signin");
        return;
      }

      const optimisticMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setCurrentMessages((prev) => [...prev, optimisticMessage]);
      setIsChatLoading(true);

      try {
        const detail = await sendChatMessage({
          message: trimmed,
          conversationId: activeConversationId ?? undefined,
          title: activeConversationId ? undefined : trimmed,
          documentIds: options?.documentIds,
        });

        updateMessagesFromDetail(detail);
        applyConversationUpdate(detail);
      } catch (error) {
        console.error("Failed to send chat message", error);
        const fallbackReply: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          content: "Sorry, I could not reach the assistant just now.",
          timestamp: new Date().toISOString(),
        };
        setCurrentMessages((prev) => [...prev, fallbackReply]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [activeConversationId, applyConversationUpdate, currentUser, openAuthModal, updateMessagesFromDetail]
  );

  const selectHistoryConversation = useCallback(
    async (conversationId: string) => {
      setSelectedHistoryId(conversationId);
      setActiveConversationId(conversationId);
      setInputSessionKey(conversationId);
      setIsChatLoading(true);

      try {
        const detail = await fetchConversation(conversationId);
        updateMessagesFromDetail(detail);
        applyConversationUpdate(detail);
      } catch (error) {
        console.error("Failed to load conversation detail", error);
      } finally {
        setIsChatLoading(false);
      }
    },
    [applyConversationUpdate, updateMessagesFromDetail]
  );

  const deleteConversationFn = useCallback(
    async (conversationId: string) => {
      try {
        await deleteConversation(conversationId);
        setHistoryConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));

        if (selectedHistoryId === conversationId || activeConversationId === conversationId) {
          startNewChat();
        }
      } catch (error) {
        console.error("Failed to delete conversation", error);
      }
    },
    [activeConversationId, selectedHistoryId, startNewChat]
  );

  return {
    historyConversations,
    selectedHistoryId,
    activeConversationId,
    currentMessages,
    isChatLoading,
    inputSessionKey,
    refreshConversations,
    startNewChat,
    sendMessage,
    selectHistoryConversation,
    deleteConversation: deleteConversationFn,
    appendMessage,
    clearConversations,
  };
};

export default useConversationManager;
