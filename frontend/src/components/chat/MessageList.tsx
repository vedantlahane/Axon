// ─── Message List ────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ChatMessage } from '../../types/chat';
import type { SqlQueryResult } from '../../types/database';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import TypingIndicator from './TypingIndicator';
import ScrollToBottom from './ScrollToBottom';

interface MessageListProps {
  messages: ChatMessage[];
  isSending: boolean;
  isAuthenticated?: boolean;
  executedQueries?: Map<string, SqlQueryResult>;
  onViewSqlInCanvas?: (sql: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isSending,
  isAuthenticated,
  executedQueries,
  onViewSqlInCanvas,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const showTyping =
    isSending &&
    messages.length > 0 &&
    messages[messages.length - 1]?.sender === 'user';

  return (
    <div className="relative flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="w-full max-w-[720px] mx-auto px-4 pt-20 pb-48">
          <AnimatePresence initial={false}>
            <motion.div
              key="messages"
              className="flex flex-col"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {messages.map((message) =>
                message.sender === 'user' ? (
                  <UserMessage key={message.id} message={message} />
                ) : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    isAuthenticated={isAuthenticated}
                    executedQueries={executedQueries}
                    onViewSqlInCanvas={onViewSqlInCanvas}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>

          {showTyping && <TypingIndicator />}
        </div>
      </div>

      <ScrollToBottom scrollRef={scrollRef} />
    </div>
  );
};

export default MessageList;
