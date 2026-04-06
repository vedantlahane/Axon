// ─── Library View ────────────────────────────────────────────────────────────
// Conversation history with search, filters, and pin support.
// Matches FRONTEND_CONTEXT.md §5.5 "Library (/library)"

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../../lib/animations';
import { useChatStore } from '../../stores/chatStore';
import PageContainer from '../layout/PageContainer';
import ConversationCard from './ConversationCard';
import LibrarySearch from './LibrarySearch';
import Icon from '../ui/Icon';
import { formatRelativeTime } from '../../utils/formatters';

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isThisWeek = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
};

const isThisMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

const LibraryView: React.FC = () => {
  const navigate = useNavigate();
  const conversations = useChatStore((s) => s.conversations);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const pinnedIds = useChatStore((s) => s.pinnedIds);
  const togglePinConversation = useChatStore((s) => s.togglePinConversation);
  const isLoading = useChatStore((s) => s.isLoadingConversations);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const filtered = useMemo(() => {
    let result = conversations;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q)
      );
    }

    // Time/pin filter
    const dateField = (c: typeof result[0]) => c.updatedAtISO || c.updatedAt;

    switch (activeFilter) {
      case 'Today':
        result = result.filter((c) => isToday(dateField(c)));
        break;
      case 'This Week':
        result = result.filter((c) => isThisWeek(dateField(c)));
        break;
      case 'This Month':
        result = result.filter((c) => isThisMonth(dateField(c)));
        break;
      case 'Pinned':
        result = result.filter((c) => pinnedIds.has(c.id));
        break;
    }

    return result;
  }, [conversations, searchQuery, activeFilter, pinnedIds]);

  const handleOpen = (id: string) => {
    void selectConversation(id);
    navigate(`/chat/${id}`);
  };

  return (
    <PageContainer maxWidth="900px">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div className="mb-8" variants={fadeUp}>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Library
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your conversation history and saved artifacts.
          </p>
        </motion.div>

        {/* ── Search + Filters ─────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <LibrarySearch
            query={searchQuery}
            onSearch={setSearchQuery}
            activeFilter={activeFilter}
            onFilter={setActiveFilter}
          />
        </motion.div>

        {/* ── Section Label ────────────────────────────────────────────── */}
        <motion.div className="flex items-center gap-3 mb-6" variants={fadeUp}>
          <span
            className="text-[10px] uppercase tracking-[0.15em] font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {searchQuery
              ? `Results (${filtered.length})`
              : activeFilter === 'All'
              ? 'Recent Conversations'
              : activeFilter}
          </span>
          <div className="gradient-separator flex-grow" />
        </motion.div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-pulse h-36 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="liquid-glass rounded-xl p-12 text-center"
          >
            <Icon
              name={searchQuery ? 'search_off' : activeFilter === 'Pinned' ? 'push_pin' : 'inbox'}
              className="text-4xl mb-4 block"
              style={{ color: 'var(--text-ghost)' }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>
              {searchQuery
                ? 'No conversations match your search.'
                : activeFilter === 'Pinned'
                ? 'No pinned conversations yet.'
                : 'No conversations yet. Your chats will appear here.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={staggerContainer}
          >
            {filtered.map((conversation) => (
              <motion.div key={conversation.id} variants={fadeUp}>
                <ConversationCard
                  conversation={conversation}
                  timeLabel={formatRelativeTime(
                    conversation.updatedAtISO || conversation.updatedAt
                  )}
                  isPinned={pinnedIds.has(conversation.id)}
                  onOpen={() => handleOpen(conversation.id)}
                  onDelete={() => void deleteConversation(conversation.id)}
                  onTogglePin={() => togglePinConversation(conversation.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
};

export default LibraryView;