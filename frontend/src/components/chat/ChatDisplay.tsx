import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import type { ChatMessage, ConversationSummary } from '../../types/chat';
import type { SqlQueryResult, FeedbackType } from '../../services/chatApi';
import { submitMessageFeedback, deleteMessageFeedback } from '../../services/chatApi';
import { normalizeSql } from '../../utils/sqlUtils';
import MarkdownRenderer from './MarkdownRenderer';
import ScrollToBottom from './ScrollToBottom';

interface ChatDisplayProps {
  view: 'chat' | 'history';
  messages: ChatMessage[];
  historyConversations: ConversationSummary[];
  selectedHistoryId: string | null;
  onSelectHistory: (conversationId: string) => void;
  onViewChange: (view: 'chat' | 'history') => void;
  onDeleteConversation: (conversationId: string) => Promise<void> | void;
  isChatLoading: boolean;
  onViewSqlInCanvas?: (sql: string) => void;
  isAuthenticated?: boolean;
  executedQueries?: Map<string, SqlQueryResult>; // sql -> result
  onSuggestionClick?: (text: string) => void;
}

// Detect sources used in a message based on content patterns
const detectSources = (content: string): string[] => {
  const sources: string[] = [];
  
  // Check for tavily/web search usage
  if (content.includes('tavily_search') || 
      content.includes('searched the web') || 
      content.includes('search results') ||
      content.includes('According to') ||
      content.includes('Based on the search')) {
    sources.push('Web Search');
  }
  
  // Check for PDF/document usage
  if (content.includes('Document excerpts') || 
      content.includes('search_pdf') ||
      content.includes('uploaded document') ||
      content.includes('PDF')) {
    sources.push('Uploaded Documents');
  }
  
  // Check for database/SQL usage
  if (content.includes('database schema') || 
      content.includes('```sql') ||
      content.includes('get_database_schema')) {
    sources.push('Database');
  }
  
  return sources;
};

const suggestions = [
  'What is artificial intelligence?',
  'How does machine learning work?',
  'Explain quantum computing',
  'What are the benefits of cloud computing?',
  'How do I migrate a legacy project?'
];

const formatDisplayTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatAttachmentSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const ChatDisplay: React.FC<ChatDisplayProps> = ({
  view,
  messages,
  historyConversations,
  selectedHistoryId,
  onSelectHistory,
  onViewChange,
  onDeleteConversation,
  isChatLoading,
  onViewSqlInCanvas,
  executedQueries,
  isAuthenticated = false,
  onSuggestionClick,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const showLanding = view === 'chat' && messages.length === 0;
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Map<string, FeedbackType>>(new Map());
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);

  // Handle copy with feedback
  const handleCopy = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {
      // Fallback for non-HTTPS or denied permissions
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
      } catch {
        console.error('Copy failed: clipboard access denied');
      }
      document.body.removeChild(textarea);
    }
  };

  // Handle message feedback
  const handleFeedback = useCallback(async (messageId: string, type: FeedbackType) => {
    if (!isAuthenticated) return;
    
    const currentFeedback = messageFeedback.get(messageId);
    setFeedbackLoading(messageId);
    
    try {
      if (currentFeedback === type) {
        // Remove feedback if clicking same type
        await deleteMessageFeedback(messageId);
        setMessageFeedback((prev) => {
          const next = new Map(prev);
          next.delete(messageId);
          return next;
        });
      } else {
        // Set new feedback
        await submitMessageFeedback(messageId, type);
        setMessageFeedback((prev) => new Map(prev).set(messageId, type));
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setFeedbackLoading(null);
    }
  }, [isAuthenticated, messageFeedback]);

  // Helper to extract SQL from message content
  const extractSql = (content: string): string | null => {
    const match = content.match(/```sql\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : null;
  };

  // Helper to render SQL query results inline
  const renderSqlResults = (result: SqlQueryResult) => {
    if (result.type === 'rows' && result.columns && result.rows) {
      const maxRows = 10; // Show max 10 rows in chat
      const displayRows = result.rows.slice(0, maxRows);
      const hasMore = result.rows.length > maxRows;

      return (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
              <tr>
                {result.columns.map((col, colIdx) => (
                  <th key={colIdx} className="px-3 py-2 text-left text-[var(--text-muted)] font-mono font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {displayRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-soft)]">
                  {result.columns.map((_, colIdx) => (
                    <td key={`${idx}-${colIdx}`} className="px-3 py-2 text-[var(--text-secondary)] font-mono truncate max-w-[200px]">
                      {String(row[colIdx] ?? 'NULL')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div className="px-3 py-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)] bg-[var(--bg-soft)]">
              Showing {displayRows.length} of {result.rows.length} rows. <span className="text-[var(--text-subtle)]">View all in Canvas</span>
            </div>
          )}
        </div>
      );
    }

    // For ACK results (INSERT, UPDATE, DELETE)
    if (result.type === 'ack') {
      return (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-300">
            ✓ {result.message} ({result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} affected)
          </p>
        </div>
      );
    }

    return null;
  };

  // Rendered via MarkdownRenderer component (replaces hand-rolled parser)

  // Helper to render message content with clickable SQL blocks
  const renderMessageContent = (message: ChatMessage) => {
    // Extract ALL SQL blocks from the message
    const sqlBlockRegex = /```sql\s*([\s\S]*?)```/gi;
    const sqlMatches = [...message.content.matchAll(sqlBlockRegex)];

    if (sqlMatches.length > 0 && onViewSqlInCanvas) {
      // Split content around all SQL blocks
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      sqlMatches.forEach((match, matchIdx) => {
        const sql = match[1].trim();
        const normalizedSql = normalizeSql(sql);
        const queryResult = normalizedSql && executedQueries ? executedQueries.get(normalizedSql) : null;
        const hasExecutedResults = !!queryResult;
        const matchStart = match.index ?? 0;
        const matchEnd = matchStart + match[0].length;

        // Text before this SQL block
        const beforeText = message.content.slice(lastIndex, matchStart).trim();
        if (beforeText) {
          parts.push(<div key={`text-${matchIdx}`} className="prose-content"><MarkdownRenderer content={beforeText} /></div>);
        }

        // SQL block
        parts.push(
          <div key={`sql-${matchIdx}`} className="rounded-lg border border-white/10 bg-slate-50 dark:bg-[#0d1117] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-soft)]">
              <span className="text-xs text-[var(--text-muted)] font-mono">SQL Query</span>
              <button
                type="button"
                onClick={() => onViewSqlInCanvas(sql)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-[#2563eb]/80 hover:bg-[#2563eb] rounded-md transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                {hasExecutedResults ? 'View in Canvas' : 'Open in Canvas'}
              </button>
            </div>
            <pre className="p-3 text-sm font-mono text-slate-700 dark:text-sky-300 overflow-x-auto">
              <code>{sql}</code>
            </pre>
          </div>
        );

        // Display results if query has been executed
        if (hasExecutedResults && queryResult) {
          parts.push(
            <div key={`result-${matchIdx}`} className="flex flex-col gap-2">
              <div className="text-xs text-[var(--text-subtle)] px-1">Query Results:</div>
              {renderSqlResults(queryResult)}
            </div>
          );
        }

        lastIndex = matchEnd;
      });

      // Remaining text after the last SQL block
      const afterText = message.content.slice(lastIndex).trim();
      if (afterText) {
        parts.push(<div key="text-after" className="prose-content"><MarkdownRenderer content={afterText} /></div>);
      }

      return <div className="flex flex-col gap-2">{parts}</div>;
    }
    
    // For non-SQL messages, render with full formatting
    if (message.sender === 'assistant') {
      return <div className="prose-content"><MarkdownRenderer content={message.content} /></div>;
    }
    
    // User messages - simpler formatting
    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const historyEmpty = useMemo(() => historyConversations.length === 0, [historyConversations]);

  return (
    <section className="relative flex h-full flex-col items-center">
      <div ref={scrollRef} className="flex h-full w-full flex-col items-center overflow-y-auto px-6 pb-10 pt-6">
        <div className="flex w-full max-w-3xl flex-1 flex-col">
          <AnimatePresence mode="wait">
            {view === 'chat' && showLanding && (
              <motion.div
                key="landing"
                className="flex flex-1 flex-col items-center justify-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -60 }}
                transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <LayoutGroup id="landing-toggle">
                  <div className="mb-10 flex  gap-2">
                    {(['chat', 'history'] as const).map((mode) => {
                      const isActive = view === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => onViewChange(mode)}
                          className={`relative flex flex-col items-center  px-2 pb-1 text-xl font-semibold transition-colors ${
                            isActive
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white/80'
                          }`}
                        >
                          <span>{mode === 'chat' ? 'Chat' : 'History'}</span>
                          {isActive && (
                            <motion.span
                              layoutId="landing-underline"
                              className="h-[2px] w-full rounded-full bg-[#2563eb]"
                              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                              initial={false}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </LayoutGroup>
                <motion.div className="grid w-full max-w-lg place-items-center gap-8 text-center">
                  <div className="grid place-items-center gap-5">
                    <motion.div
                      className="relative"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#7dd3fc] opacity-40 blur-3xl" />
                      <div className="relative grid h-28 w-28 place-items-center rounded-[26px] border border-slate-200 dark:border-white/15 bg-white/90 dark:bg-[#0b1220]/90 shadow-[0_25px_60px_-30px_rgba(37,99,235,0.35)] dark:shadow-[0_25px_60px_-30px_rgba(37,99,235,0.8)] backdrop-blur-sm">
                        <div className="absolute h-20 w-20 rounded-[22px] border border-[#3b82f6]/40" />
                        <motion.div
                          className="relative flex h-20 w-20 items-center justify-center rounded-[22px] bg-[conic-gradient(from_140deg,_rgba(125,211,252,0.4),_rgba(37,99,235,0.85),_rgba(14,165,233,0.4))] shadow-[0_18px_45px_-18px_rgba(14,165,233,0.9)]"
                        
                          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          
                          <div className="relative flex items-center gap-1 text-xl  font-semibold tracking-wide text-white">
                            <svg
                              width="26"
                              height="26"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-sky-200"
                            >
                              <path d="M4 4h9l7 8-7 8H4l7-8z" />
                              <path d="M11 4 7 12l4 8" />
                            </svg>
                            <span className="text-lg font-bold">Axon</span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <p className="text-2xl leading-relaxed text-[var(--text-secondary)]">Start your conversation with Axon</p>
                      <p className="text-sm text-[var(--text-subtle)]">Draft a message below or pick one of the quick ideas.</p>
                    </motion.div>
                  </div>

                  <motion.div
                    className="flex max-w-lg flex-wrap justify-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        type="button"
                        key={`${suggestion}-${index}`}
                        className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] cursor-pointer"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                        onClick={() => onSuggestionClick?.(suggestion)}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {view === 'chat' && !showLanding && (
              <motion.div
                key="messages"
                className="flex flex-1 flex-col gap-6"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 32 }}
                transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              >
                {messages.map((message) => {
                  const isUser = message.sender === 'user';
                  const title = isUser ? 'You' : 'Axon';
                  const avatarClasses = isUser
                    ? 'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white'
                    : 'bg-[var(--bg-soft)] text-[var(--text-primary)]';
                  const bubbleClasses = isUser
                    ? 'border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--text-primary)]'
                    : 'border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-primary)]';
                  const hasAttachments = (message.attachments?.length ?? 0) > 0;
                  const sources = !isUser ? detectSources(message.content) : [];

                  return (
                    <motion.div
                      key={message.id}
                      className={`flex w-full items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                    >
                      {/* Avatar */}
                      <div
                        className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-[var(--border)] shadow-inner ${avatarClasses}`}
                        aria-hidden
                      >
                        {isUser ? (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-sky-200"
                          >
                            <path d="M4 4h9l7 8-7 8H4l7-8z" />
                            <path d="M11 4 7 12l4 8" />
                          </svg>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className={`flex flex-col gap-1.5 min-w-0 ${isUser ? 'items-end max-w-[75%]' : 'flex-1 max-w-full'}`}>
                        {/* Header */}
                        <div className={`flex items-center gap-2 text-xs text-[var(--text-muted)] ${isUser ? 'flex-row-reverse' : ''}`}>
                          <span className="font-medium text-[var(--text-secondary)]">{title}</span>
                          <span className="h-1 w-1 rounded-full bg-[var(--text-subtle)]" aria-hidden />
                          <span>{formatDisplayTime(message.timestamp)}</span>
                        </div>

                        {/* Message Bubble */}
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg backdrop-blur overflow-hidden ${bubbleClasses}`}>
                          {renderMessageContent(message)}
                          {hasAttachments && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.attachments!.map((attachment) => (
                                <a
                                  key={attachment.id}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)]/30 hover:bg-[var(--bg-soft)]"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                  </svg>
                                  <span className="truncate max-w-[120px]" title={attachment.name}>
                                    {attachment.name}
                                  </span>
                                  <span className="text-[var(--text-subtle)]">
                                    {formatAttachmentSize(attachment.size)}
                                  </span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Sources & Actions - Only for assistant messages */}
                        {!isUser && (
                          <div className="flex items-center gap-3 mt-1">
                            {/* Sources */}
                            {sources.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-subtle)]">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <span className="text-[10px] text-[var(--text-subtle)]">Sources:</span>
                                {sources.map((source) => (
                                  <span key={source} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-soft)] text-[var(--text-muted)] border border-[var(--border)]">
                                    {source}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-0.5 ml-auto">
                              {/* Copy */}
                              <button
                                type="button"
                                onClick={() => handleCopy(message.id, message.content)}
                                className={`p-1.5 rounded-lg transition ${
                                  copiedMessageId === message.id
                                    ? 'text-green-400 bg-green-500/10'
                                    : 'text-[var(--text-subtle)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-soft)]'
                                }`}
                                title={copiedMessageId === message.id ? 'Copied!' : 'Copy message'}
                              >
                                {copiedMessageId === message.id ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>

                              {/* Like */}
                              <button
                                type="button"
                                onClick={() => handleFeedback(message.id, 'like')}
                                disabled={feedbackLoading === message.id}
                                className={`p-1.5 rounded-lg transition ${
                                  messageFeedback.get(message.id) === 'like'
                                    ? 'text-green-400 bg-green-500/15'
                                    : 'text-[var(--text-subtle)] hover:text-green-400 hover:bg-green-500/10'
                                } ${feedbackLoading === message.id ? 'opacity-50' : ''}`}
                                title="Good response"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                </svg>
                              </button>

                              {/* Dislike */}
                              <button
                                type="button"
                                onClick={() => handleFeedback(message.id, 'dislike')}
                                disabled={feedbackLoading === message.id}
                                className={`p-1.5 rounded-lg transition ${
                                  messageFeedback.get(message.id) === 'dislike'
                                    ? 'text-rose-400 bg-rose-500/15'
                                    : 'text-[var(--text-subtle)] hover:text-rose-400 hover:bg-rose-500/10'
                                } ${feedbackLoading === message.id ? 'opacity-50' : ''}`}
                                title="Bad response"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                                </svg>
                              </button>

                              {/* Report */}
                              <button
                                type="button"
                                onClick={() => handleFeedback(message.id, 'report')}
                                disabled={feedbackLoading === message.id}
                                className={`p-1.5 rounded-lg transition ${
                                  messageFeedback.get(message.id) === 'report'
                                    ? 'text-amber-400 bg-amber-500/15'
                                    : 'text-[var(--text-subtle)] hover:text-amber-400 hover:bg-amber-500/10'
                                } ${feedbackLoading === message.id ? 'opacity-50' : ''}`}
                                title="Report issue"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                  <line x1="4" y1="22" x2="4" y2="15" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {view === 'history' && (
              <motion.div
                key="history"
                className="flex flex-1 flex-col gap-4"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 32 }}
                transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              >
                {historyEmpty ? (
                  <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)] text-center text-[var(--text-subtle)]">
                    <p>No saved conversations yet. Your next chats will appear here.</p>
                  </div>
                ) : (
                  historyConversations.map((conversation) => {
                    const isSelected = conversation.id === selectedHistoryId;
                    return (
                      <motion.div
                        key={conversation.id}
                        className={`relative flex w-full flex-col gap-2 rounded-2xl border px-5 py-4 text-left transition ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--text-primary)]'
                            : 'border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-panel)]'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectHistory(conversation.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onSelectHistory(conversation.id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-[var(--text-primary)]">{conversation.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">
                              {conversation.updatedAt}
                            </span>
                            <button
                              type="button"
                              className="rounded-lg border border-transparent p-1 text-[var(--text-subtle)] hover:border-[var(--border)] hover:text-[var(--text-secondary)]"
                              onClick={(event) => {
                                event.stopPropagation();
                                void onDeleteConversation(conversation.id);
                              }}
                              aria-label="Delete conversation"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-[var(--text-muted)]">{conversation.summary}</p>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
                          <span>{conversation.messageCount ?? conversation.messages?.length ?? 0} messages</span>
                          <span>•</span>
                          <span>Tap to reopen this chat</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {view === 'chat' && !showLanding && isChatLoading && messages.length > 0 && messages[messages.length - 1]?.sender === 'user' && (
            <motion.div
              key="assistant-typing"
              className="mt-6 flex w-full items-start gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-primary)]"
                aria-hidden
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h9l7 8-7 8H4l7-8z" />
                  <path d="M11 4 7 12l4 8" />
                </svg>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--text-primary)]">Axon</span>
                  <span className="h-1 w-1 rounded-full bg-[var(--text-subtle)]" aria-hidden />
                  <span>Thinking…</span>
                </div>
                <div className="w-fit rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] shadow-lg">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        className="h-2 w-2 rounded-full bg-[var(--text-secondary)]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating scroll-to-bottom button */}
      {view === 'chat' && !showLanding && (
        <ScrollToBottom scrollRef={scrollRef} />
      )}
    </section>
  );
};

export default ChatDisplay;
