// ─── Library View ────────────────────────────────────────────────────────────

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import PageContainer from '../layout/PageContainer';
import ConversationCard from './ConversationCard';
import { formatRelativeTime } from '../../utils/formatters';

const LibraryView: React.FC = () => {
  const navigate = useNavigate();
  const conversations = useChatStore((s) => s.conversations);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const isLoading = useChatStore((s) => s.isLoadingConversations);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const handleOpen = (id: string) => {
    void selectConversation(id);
    navigate(`/chat/${id}`);
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
  };

  return (
    <PageContainer maxWidth="960px">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="display-sm text-white mb-2">Library</h1>
          <p className="body-md" style={{ color: 'var(--text-secondary)' }}>Your conversation history and saved artifacts.</p>
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg" style={{ color: 'var(--text-ghost)' }}>search</span>
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-glass pl-10"
            aria-label="Search conversations"
          />
        </div>

        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="label-md" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery ? `Results (${filtered.length})` : 'Recent Conversations'}
          </span>
          <div className="h-px flex-grow" style={{ background: 'rgba(68,71,73,0.15)' }} />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-pulse h-36 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="liquid-glass rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl mb-4 block" style={{ color: 'var(--text-ghost)' }}>
              {searchQuery ? 'search_off' : 'inbox'}
            </span>
            <p style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'No conversations match your search.' : 'No conversations yet. Your chats will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((conversation, i) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ConversationCard
                  conversation={conversation}
                  timeLabel={formatRelativeTime(conversation.updatedAt)}
                  onOpen={() => handleOpen(conversation.id)}
                  onDelete={() => void handleDelete(conversation.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </PageContainer>
  );
};

export default LibraryView;
