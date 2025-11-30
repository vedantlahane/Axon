import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import type { ChatMessage, ConversationSummary } from '../App';
import type { SqlQueryResult } from '../services/chatApi';

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
  executedQueries?: Map<string, SqlQueryResult>; // sql -> result
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
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const showLanding = view === 'chat' && messages.length === 0;
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Handle copy with feedback
  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Helper to extract SQL from message content
  const extractSql = (content: string): string | null => {
    const match = content.match(/```sql\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : null;
  };

  // Parse markdown-like content into formatted elements
  const parseFormattedContent = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockContent: string[] = [];
    let listItems: { level: number; content: string; ordered: boolean; num?: number }[] = [];
    
    const flushList = () => {
      if (listItems.length > 0) {
        const renderList = (items: typeof listItems, startIdx = 0): React.ReactNode => {
          const result: React.ReactNode[] = [];
          let i = startIdx;
          const baseLevel = items[startIdx]?.level ?? 0;
          
          while (i < items.length && items[i].level >= baseLevel) {
            const item = items[i];
            if (item.level === baseLevel) {
              result.push(
                <li key={i} className="ml-4">
                  {renderInlineFormatting(item.content)}
                </li>
              );
              i++;
            } else {
              // Find nested items
              const nestedStart = i;
              while (i < items.length && items[i].level > baseLevel) i++;
              result.push(
                <li key={`nested-${nestedStart}`} className="ml-4 list-none">
                  {renderList(items.slice(nestedStart, i), 0)}
                </li>
              );
            }
          }
          
          const isOrdered = items[startIdx]?.ordered;
          return isOrdered ? (
            <ol className="list-decimal space-y-1 pl-4 text-white/70">{result}</ol>
          ) : (
            <ul className="list-disc space-y-1 pl-4 text-white/70">{result}</ul>
          );
        };
        
        elements.push(<div key={`list-${elements.length}`} className="my-2">{renderList(listItems)}</div>);
        listItems = [];
      }
    };

    const renderInlineFormatting = (text: string): React.ReactNode => {
      // Handle inline code, bold, italic
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let keyIdx = 0;

      while (remaining.length > 0) {
        // Inline code `code`
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
          parts.push(
            <code key={keyIdx++} className="rounded bg-blue-500/15 px-1.5 py-0.5 font-mono text-[13px] text-blue-200">
              {codeMatch[1]}
            </code>
          );
          remaining = remaining.slice(codeMatch[0].length);
          continue;
        }

        // Bold **text** or __text__
        const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
        if (boldMatch) {
          parts.push(<strong key={keyIdx++} className="font-semibold text-white/90">{boldMatch[2]}</strong>);
          remaining = remaining.slice(boldMatch[0].length);
          continue;
        }

        // Italic *text* or _text_
        const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
        if (italicMatch) {
          parts.push(<em key={keyIdx++} className="italic text-white/80">{italicMatch[2]}</em>);
          remaining = remaining.slice(italicMatch[0].length);
          continue;
        }

        // Regular character
        const nextSpecial = remaining.slice(1).search(/[`*_]/);
        if (nextSpecial === -1) {
          parts.push(remaining);
          break;
        } else {
          parts.push(remaining.slice(0, nextSpecial + 1));
          remaining = remaining.slice(nextSpecial + 1);
        }
      }

      return parts.length === 1 ? parts[0] : <>{parts}</>;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Code block start/end
      const codeBlockMatch = line.match(/^```(\w*)/);
      if (codeBlockMatch) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeBlockLang = codeBlockMatch[1] || 'text';
          codeBlockContent = [];
        } else {
          // End code block
          const langLabel = codeBlockLang.toUpperCase() || 'CODE';
          elements.push(
            <div key={`code-${elements.length}`} className="my-3 rounded-xl border border-white/10 bg-[#0b1220]/80 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">{langLabel}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(codeBlockContent.join('\n'))}
                  className="text-[10px] text-white/40 hover:text-white/70 transition"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 text-sm font-mono text-sky-200/90 overflow-x-auto leading-relaxed">
                <code>{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeBlockLang = '';
          codeBlockContent = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        flushList();
        const level = headerMatch[1].length;
        const headerClasses: Record<number, string> = {
          1: 'text-lg font-semibold text-white/90 mt-4 mb-2',
          2: 'text-base font-semibold text-white/85 mt-3 mb-2',
          3: 'text-sm font-semibold text-white/80 mt-3 mb-1',
          4: 'text-sm font-medium text-white/75 mt-2 mb-1',
          5: 'text-xs font-medium text-white/70 mt-2 mb-1',
          6: 'text-xs font-medium text-white/60 mt-2 mb-1',
        };
        elements.push(
          <div key={`h-${elements.length}`} className={headerClasses[level]}>
            {renderInlineFormatting(headerMatch[2])}
          </div>
        );
        continue;
      }

      // Unordered list items
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
      if (ulMatch) {
        const level = Math.floor(ulMatch[1].length / 2);
        listItems.push({ level, content: ulMatch[2], ordered: false });
        continue;
      }

      // Ordered list items
      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)/);
      if (olMatch) {
        const level = Math.floor(olMatch[1].length / 2);
        listItems.push({ level, content: olMatch[3], ordered: true, num: parseInt(olMatch[2]) });
        continue;
      }

      // Blockquote
      const quoteMatch = line.match(/^>\s*(.+)/);
      if (quoteMatch) {
        flushList();
        elements.push(
          <blockquote key={`q-${elements.length}`} className="my-2 border-l-2 border-blue-400/40 pl-3 italic text-white/60">
            {renderInlineFormatting(quoteMatch[1])}
          </blockquote>
        );
        continue;
      }

      // Horizontal rule
      if (/^[-*_]{3,}$/.test(line.trim())) {
        flushList();
        elements.push(<hr key={`hr-${elements.length}`} className="my-4 border-white/10" />);
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${elements.length}`} className="my-1 text-white/80 leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  // Helper to render message content with clickable SQL blocks
  const renderMessageContent = (message: ChatMessage) => {
    const sql = extractSql(message.content);
    const hasExecutedResults = sql ? executedQueries?.has(sql.trim()) : false;
    
    if (sql && onViewSqlInCanvas) {
      // Split content around the SQL block
      const parts = message.content.split(/```sql[\s\S]*?```/i);
      const beforeSql = parts[0] || '';
      const afterSql = parts[1] || '';
      
      return (
        <div className="flex flex-col gap-2">
          {beforeSql.trim() && <div className="prose-content">{parseFormattedContent(beforeSql.trim())}</div>}
          
          {/* SQL Block with View in Canvas button */}
          <div className="rounded-lg border border-white/10 bg-[#0d1117] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
              <span className="text-xs text-white/50 font-mono">SQL Query</span>
              <button
                type="button"
                onClick={() => onViewSqlInCanvas(sql)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white/80 bg-[#2563eb]/80 hover:bg-[#2563eb] rounded-md transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                {hasExecutedResults ? 'View Results' : 'Open in Canvas'}
              </button>
            </div>
            <pre className="p-3 text-sm font-mono text-sky-300 overflow-x-auto">
              <code>{sql}</code>
            </pre>
          </div>
          
          {afterSql.trim() && <div className="prose-content">{parseFormattedContent(afterSql.trim())}</div>}
        </div>
      );
    }
    
    // For non-SQL messages, render with full formatting
    if (message.sender === 'assistant') {
      return <div className="prose-content">{parseFormattedContent(message.content)}</div>;
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
    <section className="flex h-full flex-col items-center">
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
                            isActive ? 'text-white' : 'text-white/60 hover:text-white/80'
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
                      <div className="relative grid h-28 w-28 place-items-center rounded-[26px] border border-white/15 bg-[#0b1220]/90 shadow-[0_25px_60px_-30px_rgba(37,99,235,0.8)] backdrop-blur-sm">
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
                      <p className="text-2xl leading-relaxed text-white/70">Start your conversation with Axon</p>
                      <p className="text-sm text-white/45">Draft a message below or pick one of the quick ideas.</p>
                    </motion.div>
                  </div>

                  <motion.div
                    className="flex max-w-lg flex-wrap justify-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <motion.span
                        key={`${suggestion}-${index}`}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                      >
                        {suggestion}
                      </motion.span>
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
                    : 'bg-white/10 text-white';
                  const bubbleClasses = isUser
                    ? 'border border-white/10 bg-[#2563eb]/20 text-white'
                    : 'border border-white/5 bg-white/5 text-white';
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
                        className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-white/10 shadow-inner ${avatarClasses}`}
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
                        <div className={`flex items-center gap-2 text-xs text-white/50 ${isUser ? 'flex-row-reverse' : ''}`}>
                          <span className="font-medium text-white/70">{title}</span>
                          <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden />
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
                                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 transition hover:border-white/20 hover:bg-white/10"
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
                                  <span className="text-white/40">
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
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                <span className="text-[10px] text-white/40">Sources:</span>
                                {sources.map((source) => (
                                  <span key={source} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/10">
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
                                    : 'text-white/30 hover:text-white/70 hover:bg-white/5'
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
                                className="p-1.5 rounded-lg text-white/30 hover:text-green-400 hover:bg-green-500/10 transition"
                                title="Good response"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                </svg>
                              </button>

                              {/* Dislike */}
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Bad response"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                                </svg>
                              </button>

                              {/* Report */}
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition"
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
                  <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 text-center text-white/40">
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
                            ? 'border-[#2563eb] bg-[#2563eb]/15 text-white'
                            : 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
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
                          <h3 className="text-base font-semibold text-white">{conversation.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                              {conversation.updatedAt}
                            </span>
                            <button
                              type="button"
                              className="rounded-lg border border-transparent p-1 text-white/40 hover:border-white/20 hover:text-white/80"
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
                        <p className="text-sm text-white/60">{conversation.summary}</p>
            <div className="flex items-center gap-2 text-xs text-white/40">
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
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 text-white"
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
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="font-semibold text-white">Axon</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden />
                  <span>Thinking…</span>
                </div>
                <div className="w-fit rounded-2xl border border-black bg-white/5 px-4 py-3 text-sm leading-relaxed text-white shadow-lg">
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        className="h-2 w-2 rounded-full bg-white/70"
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
    </section>
  );
};

export default ChatDisplay;
