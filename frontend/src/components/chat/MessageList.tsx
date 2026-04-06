// ─── Message List ────────────────────────────────────────────────────────────
// Scrollable message container with auto-scroll and typing indicator.

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fadeUp } from '../../lib/animations';
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
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
        {/* Message column — max-w-[720px] centered, with TopBar + InputBar clearance */}
        <div className="w-full max-w-[720px] mx-auto px-4 md:px-6 pt-24 pb-52">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                {...fadeUp}
                layout
              >
                {message.sender === 'user' ? (
                  <UserMessage message={message} />
                ) : (
                  <AssistantMessage
                    message={message}
                    isAuthenticated={isAuthenticated}
                    executedQueries={executedQueries}
                    onViewSqlInCanvas={onViewSqlInCanvas}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {showTyping && <TypingIndicator />}
        </div>
      </div>

      <ScrollToBottom scrollRef={scrollRef} />
    </div>
  );
};

export default MessageList;