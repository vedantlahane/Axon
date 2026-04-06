// ─── Chat View ───────────────────────────────────────────────────────────────
// Full chat page: empty state → landing → active chat + input.

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import { useAuth } from '../../stores/AuthProvider';
import { useDatabaseStore } from '../../stores/databaseStore';
import MessageList from './MessageList';
import ChatInput from '../input/ChatInput';
import type { LLMModel } from '../../types/models';

interface ChatViewProps {
  availableModels?: LLMModel[];
  currentModel?: string;
}

const suggestions = [
  { icon: 'terminal', text: 'Optimize a SQL query' },
  { icon: 'description', text: 'Analyze a document' },
  { icon: 'database', text: 'Explore database schema' },
  { icon: 'code', text: 'Write a Python function' },
];

const ChatView: React.FC<ChatViewProps> = ({ availableModels, currentModel }) => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const messages = useChatStore((s) => s.messages);
  const isSending = useChatStore((s) => s.isSending);
  const selectedConversationId = useChatStore((s) => s.selectedConversationId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const setInputValue = useChatStore((s) => s.setInputValue);

  const executedQueries = useDatabaseStore((s) => s.executedQueries);
  const setQueryText = useDatabaseStore((s) => s.setQueryText);
  const toggleSideWindow = useDatabaseStore((s) => s.toggleSideWindow);

  // Load conversation from URL params
  useEffect(() => {
    if (conversationId && conversationId !== selectedConversationId) {
      void selectConversation(conversationId);
    } else if (!conversationId && selectedConversationId) {
      // URL is / but we have a conversation selected — sync URL
      // Only if messages exist
    }
  }, [conversationId, selectedConversationId, selectConversation]);

  // Keep URL in sync with selected conversation
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

  const showLanding = messages.length === 0 && !isSending;

  return (
    <div className="flex h-full flex-col">
      {showLanding ? (
        /* ── Empty State — Landing ─────────────────────────────────────── */
        <motion.main
          className="flex-1 flex flex-col items-center justify-center px-6 pb-48"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center max-w-2xl w-full text-center gap-8">
            {/* Logo with glow */}
            <div className="relative">
              <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: 'rgba(124, 58, 237, 0.15)' }} />
              <div className="relative liquid-glass w-20 h-20 rounded-2xl flex items-center justify-center logo-breathe">
                <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--violet-bright)', fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-3">
              <h2 className="label-sm" style={{ color: 'var(--on-surface-variant)', letterSpacing: '0.2em', opacity: 0.8 }}>
                Ask anything. Upload anything.
              </h2>
              <div className="h-px w-12 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)' }} />
            </div>

            {/* Suggestion chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl pt-4">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="glass-card px-5 py-3 flex items-center gap-3 text-left active:scale-[0.98] group cursor-pointer"
                  onClick={() => handleSuggestionClick(s.text)}
                >
                  <span className="material-symbols-outlined text-xl transition-colors group-hover:text-[var(--violet-bright)]" style={{ color: 'var(--text-ghost)' }}>{s.icon}</span>
                  <span className="text-sm font-medium" style={{ color: '#cbd5e1' }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.main>
      ) : (
        /* ── Active Chat ───────────────────────────────────────────────── */
        <MessageList
          messages={messages}
          isSending={isSending}
          isAuthenticated={isAuthenticated}
          executedQueries={executedQueries}
          onViewSqlInCanvas={handleViewSqlInCanvas}
        />
      )}

      {/* Input — always visible */}
      <ChatInput availableModels={availableModels} currentModel={currentModel} />
    </div>
  );
};

export default ChatView;
