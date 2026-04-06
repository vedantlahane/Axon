// ─── Assistant Message ───────────────────────────────────────────────────────
// Full-width AI response with avatar, content, and hover actions.
// Matches FRONTEND_CONTEXT.md §5.2 "AssistantMessage"

import React, { useState, useCallback } from 'react';
import type { ChatMessage, FeedbackType } from '../../types/chat';
import type { SqlQueryResult } from '../../types/database';
import Icon from '../ui/Icon';
import { formatFileSize } from '../../utils/formatters';
import { detectSources, detectSqlBlocks, normalizeSql } from '../../utils/sql';
import { submitFeedback, deleteFeedback } from '../../services/feedbackService';
import MarkdownRenderer from './MarkdownRenderer';
import SourceBadges from './SourceBadges';
import MessageActions from './MessageActions';
import SqlBlock from './SqlBlock';
import SqlResultsInline from './SqlResultsInline';

interface AssistantMessageProps {
  message: ChatMessage;
  isAuthenticated?: boolean;
  executedQueries?: Map<string, SqlQueryResult>;
  onViewSqlInCanvas?: (sql: string) => void;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  isAuthenticated = false,
  executedQueries,
  onViewSqlInCanvas,
}) => {
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasAttachments = (message.attachments?.length ?? 0) > 0;
  const sources = detectSources(message.content);
  const sqlMatches = detectSqlBlocks(message.content);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [message.id]
  );

  const handleFeedback = useCallback(
    async (type: FeedbackType) => {
      if (!isAuthenticated) return;
      try {
        if (feedback === type) {
          await deleteFeedback(message.id);
          setFeedback(null);
        } else {
          await submitFeedback(message.id, type);
          setFeedback(type);
        }
      } catch (e) {
        console.error('Feedback error:', e);
      }
    },
    [isAuthenticated, feedback, message.id]
  );

  // ── Content Renderer ───────────────────────────────────────────────────
  const renderContent = () => {
    if (sqlMatches.length > 0 && onViewSqlInCanvas) {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      sqlMatches.forEach((match, mi) => {
        const sql = match[1].trim();
        const normalizedSql = normalizeSql(sql);
        const queryResult =
          normalizedSql && executedQueries
            ? executedQueries.get(normalizedSql)
            : null;
        const ms = match.index ?? 0;
        const me = ms + match[0].length;
        const before = message.content.slice(lastIndex, ms).trim();

        if (before) {
          parts.push(
            <div key={`t-${mi}`} className="prose-content">
              <MarkdownRenderer content={before} />
            </div>
          );
        }

        parts.push(
          <SqlBlock
            key={`sql-${mi}`}
            sql={sql}
            onCopy={() => void handleCopy(sql)}
            onRun={() => onViewSqlInCanvas(sql)}
            isCopied={copiedId === message.id}
          />
        );

        if (queryResult) {
          parts.push(
            <SqlResultsInline key={`r-${mi}`} result={queryResult} />
          );
        }

        lastIndex = me;
      });

      const after = message.content.slice(lastIndex).trim();
      if (after) {
        parts.push(
          <div key="t-after" className="prose-content">
            <MarkdownRenderer content={after} />
          </div>
        );
      }

      return <div className="flex flex-col gap-4">{parts}</div>;
    }

    return (
      <div className="prose-content">
        <MarkdownRenderer content={message.content} />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-start mb-8 group/msg relative">
      {/* ── Avatar Row ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center border border-white/10">
          <Icon
            name="psychology"
            className="text-sm"
            style={{ color: 'var(--accent-violet-light, #a78bfa)' }}
          />
        </div>
        <span
          className="text-[11px] uppercase font-medium text-slate-300"
          style={{ letterSpacing: '0.15em' }}
        >
          Axon
        </span>
      </div>

      {/* ── AI Pulse Background ───────────────────────────────────────── */}
      <div
        className="absolute -inset-x-8 top-12 bottom-0 -z-10 pointer-events-none ai-pulse-bg rounded-3xl"
        aria-hidden="true"
      />

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div
        className="w-full text-lg leading-relaxed space-y-4"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        {renderContent()}

        {/* Attachments */}
        {hasAttachments && (
          <div className="flex flex-wrap gap-2">
            {message.attachments!.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#CBD5E1',
                }}
              >
                <Icon name="attach_file" size={14} />
                <span className="truncate max-w-[100px]">{att.name}</span>
                <span className="text-slate-500">{formatFileSize(att.size)}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Sources + Actions (hover-only) ────────────────────────────── */}
      <div className="flex items-center gap-4 mt-4 w-full">
        <SourceBadges sources={sources} />
        <div className="ml-auto opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
          <MessageActions
            isCopied={copiedId === message.id}
            feedback={feedback}
            onCopy={() => void handleCopy(message.content)}
            onFeedback={handleFeedback}
          />
        </div>
      </div>
    </div>
  );
};

export default AssistantMessage;