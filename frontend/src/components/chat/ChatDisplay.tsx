import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  executedQueries?: Map<string, SqlQueryResult>;
  onSuggestionClick?: (text: string) => void;
}

const detectSources = (content: string): string[] => {
  const sources: string[] = [];
  if (content.includes('tavily_search') || content.includes('searched the web') || content.includes('search results') || content.includes('According to')) sources.push('Web Search');
  if (content.includes('Document excerpts') || content.includes('search_pdf') || content.includes('uploaded document') || content.includes('PDF')) sources.push('Uploaded Documents');
  if (content.includes('database schema') || content.includes('```sql') || content.includes('get_database_schema')) sources.push('Database');
  return sources;
};

const suggestions = [
  { icon: 'terminal', text: 'Optimize a SQL query' },
  { icon: 'description', text: 'Analyze a document' },
  { icon: 'database', text: 'Explore database schema' },
  { icon: 'code', text: 'Write a Python function' },
];

const formatDisplayTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
};

const formatHistoryTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
  const showConversationLoading = view === 'chat' && isChatLoading && messages.length === 0;
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Map<string, FeedbackType>>(new Map());
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);

  const handleCopy = async (messageId: string, content: string) => {
    try { await navigator.clipboard.writeText(content); setCopiedMessageId(messageId); setTimeout(() => setCopiedMessageId(null), 2000); }
    catch { const ta = document.createElement('textarea'); ta.value = content; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); setCopiedMessageId(messageId); setTimeout(() => setCopiedMessageId(null), 2000); } catch { /* noop */ } document.body.removeChild(ta); }
  };

  const handleFeedback = useCallback(async (messageId: string, type: FeedbackType) => {
    if (!isAuthenticated) return;
    const current = messageFeedback.get(messageId);
    setFeedbackLoading(messageId);
    try {
      if (current === type) { await deleteMessageFeedback(messageId); setMessageFeedback((prev) => { const next = new Map(prev); next.delete(messageId); return next; }); }
      else { await submitMessageFeedback(messageId, type); setMessageFeedback((prev) => new Map(prev).set(messageId, type)); }
    } catch (e) { console.error('Feedback error:', e); } finally { setFeedbackLoading(null); }
  }, [isAuthenticated, messageFeedback]);

  const renderSqlResults = (result: SqlQueryResult) => {
    if (result.type === 'rows' && result.columns && result.rows) {
      const displayRows = result.rows.slice(0, 10);
      const hasMore = result.rows.length > 10;
      return (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'var(--surface-container-lowest)' }}>
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)' }}>
              {result.columns.map((col, i) => <th key={i} className="px-3 py-2 text-left font-mono font-medium" style={{ color: 'rgb(148,163,184)' }}>{col}</th>)}
            </tr></thead>
            <tbody>{displayRows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                {result.columns.map((_, ci) => <td key={`${idx}-${ci}`} className="px-3 py-2 font-mono truncate max-w-[200px]" style={{ color: '#cbd5e1' }}>{String(row[ci] ?? 'NULL')}</td>)}
              </tr>
            ))}</tbody>
          </table>
          {hasMore && <div className="px-3 py-2 text-xs" style={{ color: 'rgb(148,163,184)', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.05)' }}>Showing {displayRows.length} of {result.rows.length} rows</div>}
        </div>
      );
    }
    if (result.type === 'ack') return <div className="rounded-lg p-3" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.15)' }}><p className="text-xs" style={{ color: '#4ade80' }}>✓ {result.message} ({result.rowCount} row{result.rowCount === 1 ? '' : 's'})</p></div>;
    if (result.type === 'error') return <div className="rounded-lg p-3" style={{ background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.15)' }}><p className="text-xs" style={{ color: 'var(--error)' }}>SQL error: {result.message}</p></div>;
    return null;
  };

  const renderMessageContent = (message: ChatMessage) => {
    const sqlBlockRegex = /```sql\s*([\s\S]*?)```/gi;
    const sqlMatches = [...message.content.matchAll(sqlBlockRegex)];
    if (sqlMatches.length > 0 && onViewSqlInCanvas) {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      sqlMatches.forEach((match, mi) => {
        const sql = match[1].trim();
        const normalizedSql = normalizeSql(sql);
        const queryResult = normalizedSql && executedQueries ? executedQueries.get(normalizedSql) : null;
        const ms = match.index ?? 0, me = ms + match[0].length;
        const before = message.content.slice(lastIndex, ms).trim();
        if (before) parts.push(<div key={`t-${mi}`} className="prose-content"><MarkdownRenderer content={before} /></div>);
        parts.push(
          <div key={`sql-${mi}`} className="liquid-glass rounded-lg overflow-hidden shadow-2xl w-full" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Editor header — Stitch pattern */}
            <div className="flex justify-between items-center px-6 py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ color: 'rgb(100,116,139)' }}>description</span>
                <span className="label-meta" style={{ color: 'rgb(148,163,184)', letterSpacing: '0.05em' }}>optimized_query.sql</span>
              </div>
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
            </div>
            {/* Code */}
            <pre className="p-6 font-mono text-sm leading-relaxed overflow-x-auto" style={{ background: 'var(--surface-container-lowest)', color: '#cbd5e1' }}><code>{sql}</code></pre>
            {/* Footer */}
            <div className="px-6 py-4 flex justify-end gap-4" style={{ background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button type="button" className="label-meta flex items-center gap-2 transition-colors hover:text-white" style={{ color: 'rgb(148,163,184)', letterSpacing: '0.1em' }} onClick={() => void handleCopy(message.id, sql)}>
                <span className="material-symbols-outlined text-sm">content_copy</span>Copy
              </button>
              <button type="button" className="label-meta flex items-center gap-2 transition-colors" style={{ color: '#a78bfa', letterSpacing: '0.1em' }} onClick={() => onViewSqlInCanvas(sql)}>
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>Run Query
              </button>
            </div>
          </div>
        );
        if (queryResult) parts.push(<div key={`r-${mi}`} className="flex flex-col gap-2"><div className="text-xs px-1" style={{ color: 'rgb(148,163,184)' }}>Query Results:</div>{renderSqlResults(queryResult)}</div>);
        lastIndex = me;
      });
      const after = message.content.slice(lastIndex).trim();
      if (after) parts.push(<div key="t-after" className="prose-content"><MarkdownRenderer content={after} /></div>);
      return <div className="flex flex-col gap-4">{parts}</div>;
    }
    if (message.sender === 'assistant') return <div className="prose-content"><MarkdownRenderer content={message.content} /></div>;
    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'auto' }); }, [view]);

  const historyEmpty = useMemo(() => historyConversations.length === 0, [historyConversations]);

  return (
    <section className="relative flex h-full flex-col items-center">
      <div ref={scrollRef} className="flex h-full w-full flex-col items-center overflow-y-auto">
        <div className="flex w-full max-w-[720px] flex-1 flex-col mx-auto px-4">
          <AnimatePresence initial={false}>
            {/* ── Empty State — Stitch design ─────────────────────── */}
            {view === 'chat' && showLanding && (
              <motion.main
                key="landing"
                className="min-h-screen flex flex-col items-center justify-center px-6 pb-48"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex flex-col items-center max-w-2xl w-full text-center" style={{ gap: '2rem' }}>
                  {/* Logo with glow */}
                  <div className="relative">
                    <div className="absolute inset-0 blur-3xl rounded-full" style={{ background: 'rgba(224,227,229,0.2)' }} />
                    <div className="relative liquid-glass w-20 h-20 rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--primary-container)', fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-3">
                    <h2 className="label-meta" style={{ color: 'var(--on-surface-variant)', letterSpacing: '0.2em', opacity: 0.8, fontSize: '0.6875rem' }}>
                      Ask anything. Upload anything.
                    </h2>
                    <div className="h-px w-12 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(224,227,229,0.4), transparent)' }} />
                  </div>

                  {/* Suggestion chips — 2x2 grid with Material icons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl pt-4">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="liquid-glass px-5 py-3 rounded-xl flex items-center gap-3 text-left transition-all active:scale-[0.98] group"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onClick={() => onSuggestionClick?.(s.text)}
                      >
                        <span className="material-symbols-outlined text-xl transition-colors group-hover:text-[var(--primary-container)]" style={{ color: 'rgb(100,116,139)' }}>{s.icon}</span>
                        <span className="text-sm font-medium" style={{ color: '#cbd5e1' }}>{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.main>
            )}

            {/* ── Loading ─────────────────────────────────────────── */}
            {showConversationLoading && (
              <motion.div key="loading" className="flex flex-1 items-center justify-center pt-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="liquid-glass flex items-center gap-3 px-5 py-3 rounded-full" style={{ color: 'rgb(148,163,184)' }}>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Loading conversation…
                </div>
              </motion.div>
            )}

            {/* ── Messages — Stitch layout ─────────────────────────── */}
            {view === 'chat' && !showLanding && !showConversationLoading && (
              <motion.div key="messages" className="pt-32 pb-48 flex flex-1 flex-col" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35 }}>
                {messages.map((message) => {
                  const isUser = message.sender === 'user';
                  const hasAttachments = (message.attachments?.length ?? 0) > 0;
                  const sources = !isUser ? detectSources(message.content) : [];

                  if (isUser) {
                    /* ── User message — right-aligned glass bubble ──── */
                    return (
                      <div key={message.id} className="flex flex-col items-end mb-12">
                        <div className="liquid-glass rounded-lg px-6 py-4 max-w-[85%] leading-relaxed" style={{ color: 'var(--on-surface)' }}>
                          {renderMessageContent(message)}
                          {hasAttachments && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.attachments!.map((att) => (
                                <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="liquid-glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                                  <span className="material-symbols-outlined text-sm">attach_file</span>
                                  <span className="truncate max-w-[100px]">{att.name}</span>
                                  <span style={{ color: 'rgb(100,116,139)' }}>{formatAttachmentSize(att.size)}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="mt-3 label-meta" style={{ color: 'rgba(100,116,139,0.4)', letterSpacing: '0.1em', fontSize: '0.6875rem' }}>
                          You · {formatDisplayTime(message.timestamp)}
                        </span>
                      </div>
                    );
                  }

                  /* ── AI response — full width with icon header ──── */
                  return (
                    <div key={message.id} className="flex flex-col items-start mb-12">
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm" style={{ color: '#a78bfa' }}>psychology</span>
                        </div>
                        <span className="label-meta" style={{ color: '#e2e8f0', letterSpacing: '0.1em' }}>Axon</span>
                      </div>

                      {/* Content — large text Stitch style */}
                      <div className="space-y-8 text-lg leading-[1.6]" style={{ color: 'var(--on-surface)' }}>
                        {renderMessageContent(message)}

                        {hasAttachments && (
                          <div className="flex flex-wrap gap-2">
                            {message.attachments!.map((att) => (
                              <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="liquid-glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                                <span className="material-symbols-outlined text-sm">attach_file</span>
                                <span className="truncate max-w-[100px]">{att.name}</span>
                                <span style={{ color: 'rgb(100,116,139)' }}>{formatAttachmentSize(att.size)}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sources & Actions */}
                      <div className="flex items-center gap-4 mt-6">
                        {sources.length > 0 && (
                          <div className="flex items-center gap-2">
                            {sources.map((s) => <span key={s} className="label-meta px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgb(148,163,184)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.5625rem' }}>{s}</span>)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          {[
                            { type: 'copy' as const, icon: copiedMessageId === message.id ? 'check' : 'content_copy', action: () => handleCopy(message.id, message.content), title: copiedMessageId === message.id ? 'Copied!' : 'Copy' },
                            { type: 'like' as const, icon: 'thumb_up', action: () => handleFeedback(message.id, 'like'), title: 'Good' },
                            { type: 'dislike' as const, icon: 'thumb_down', action: () => handleFeedback(message.id, 'dislike'), title: 'Bad' },
                            { type: 'report' as const, icon: 'flag', action: () => handleFeedback(message.id, 'report'), title: 'Report' },
                          ].map(({ type, icon, action, title }) => {
                            const fbType = type === 'copy' ? null : type;
                            const isActive = fbType ? messageFeedback.get(message.id) === fbType : copiedMessageId === message.id;
                            return (
                              <button key={type} type="button" title={title} disabled={feedbackLoading === message.id}
                                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                                style={{ color: isActive ? '#a78bfa' : 'rgb(100,116,139)', background: isActive ? 'var(--violet-soft)' : 'transparent' }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#e2e8f0'; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgb(100,116,139)'; }}
                                onClick={action}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Library / History — Stitch Library layout ─────────── */}
            {view === 'history' && (
              <motion.div key="history" className="pt-32 pb-48 flex flex-1 flex-col" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35 }}>
                {/* Library header */}
                <div className="mb-16">
                  <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-2">Library</h1>
                  <p className="font-medium tracking-tight" style={{ color: 'var(--on-surface-variant)' }}>Your conversation history and saved artifacts.</p>
                </div>

                {/* Section label */}
                <div className="flex items-center gap-3 mb-8">
                  <span className="label-meta text-xs font-bold" style={{ color: 'var(--secondary)', letterSpacing: '0.05em' }}>Recent Conversations</span>
                  <div className="h-px flex-grow" style={{ background: 'rgba(68,71,73,0.15)' }} />
                </div>

                {historyEmpty ? (
                  <div className="liquid-glass rounded-xl p-12 text-center" style={{ color: 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined text-4xl mb-4 block" style={{ color: 'rgb(100,116,139)' }}>inbox</span>
                    <p>No conversations yet. Your chats will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historyConversations.map((conversation) => {
                      const isSelected = conversation.id === selectedHistoryId;
                      return (
                        <div
                          key={conversation.id}
                          className="liquid-glass rounded-xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:scale-[1.01]"
                          style={{
                            background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                            border: isSelected ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                            minHeight: '140px',
                          }}
                          onClick={() => onSelectHistory(conversation.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectHistory(conversation.id); } }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="p-2 rounded-lg" style={{ background: 'var(--surface-container-high)' }}>
                              <span className="material-symbols-outlined" style={{ color: 'var(--on-secondary-container)' }}>chat_bubble</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="label-meta text-[10px]" style={{ color: 'var(--on-surface-variant)', letterSpacing: '0.1em' }}>{formatHistoryTimestamp(conversation.updatedAt)}</span>
                              <button type="button" className="p-1 rounded-md transition-colors hover:bg-white/10" style={{ color: 'rgb(100,116,139)' }} onClick={(e) => { e.stopPropagation(); void onDeleteConversation(conversation.id); }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                              </button>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white tracking-tight mb-1">{conversation.title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{conversation.summary}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Typing Indicator ───────────────────────────────────── */}
          {view === 'chat' && !showLanding && isChatLoading && messages.length > 0 && messages[messages.length - 1]?.sender === 'user' && (
            <motion.div key="typing" className="flex flex-col items-start mb-12" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm" style={{ color: '#a78bfa' }}>psychology</span>
                </div>
                <span className="label-meta" style={{ color: '#e2e8f0', letterSpacing: '0.1em' }}>Axon</span>
              </div>
              <div className="flex items-center gap-2 text-lg" style={{ color: 'rgb(148,163,184)' }}>
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="inline-block w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {view === 'chat' && !showLanding && <ScrollToBottom scrollRef={scrollRef} />}
    </section>
  );
};

export default ChatDisplay;
