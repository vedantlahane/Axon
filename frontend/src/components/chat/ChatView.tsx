// ─── Chat View ───────────────────────────────────────────────────────────────
// Full chat page: empty state → active chat. Input bar always visible.
// Matches FRONTEND_CONTEXT.md §5.2

import React, { useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useChatStore } from '../../stores/chatStore';
import { useAuth } from '../../stores/AuthProvider';
import { useDatabaseStore } from '../../stores/databaseStore';
import MessageList from './MessageList';
import EmptyState from './EmptyState';
import ChatInput from '../input/ChatInput';
import type { LLMModel } from '../../types/models';

interface OutletContext {
  availableModels: LLMModel[];
  currentModel: string;
}

const ChatView: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { availableModels, currentModel } = useOutletContext<OutletContext>();
  const { isAuthenticated } = useAuth();

  const messages = useChatStore((s) => s.messages);
  const isSending = useChatStore((s) => s.isSending);
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const setInputValue = useChatStore((s) => s.setInputValue);

  const executedQueries = useDatabaseStore((s) => s.executedQueries);
  const setQueryText = useDatabaseStore((s) => s.setQueryText);
  const toggleSideWindow = useDatabaseStore((s) => s.toggleSideWindow);

  // ── Sync URL ↔ conversation ────────────────────────────────────────────
  useEffect(() => {
    if (conversationId && conversationId !== selectedConversationId) {
      void selectConversation(conversationId);
    }
  }, [conversationId, selectedConversationId, selectConversation]);

  useEffect(() => {
    if (selectedConversationId && !conversationId) {
      navigate(`/chat/${selectedConversationId}`, { replace: true });
    }
  }, [selectedConversationId, conversationId, navigate]);

  const handleViewSqlInCanvas = (sql: string) => {
    setQueryText(sql);
    toggleSideWindow();
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
  };

  const showEmpty = messages.length === 0 && !isSending;

  return (
    <div className="flex h-full flex-col">
      {showEmpty ? (
        <EmptyState onSuggestClick={handleSuggestionClick} />
      ) : (
        <MessageList
          messages={messages}
          isSending={isSending}
          isAuthenticated={isAuthenticated}
          executedQueries={executedQueries}
          onViewSqlInCanvas={handleViewSqlInCanvas}
        />
      )}

      <ChatInput availableModels={availableModels} currentModel={currentModel} />
    </div>
  );
};

export default ChatView;