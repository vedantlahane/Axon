// ─── Assistant Message ───────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import type { ChatMessage, FeedbackType } from '../../types/chat';
import type { SqlQueryResult } from '../../types/database';
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

  const handleCopy = useCallback(async (text: string) => {
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
  }, [message.id]);

  const handleFeedback = useCallback(async (type: FeedbackType) => {
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
  }, [isAuthenticated, feedback, message.id]);

  // Render content with SQL blocks extracted
  const renderContent = () => {
    if (sqlMatches.length > 0 && onViewSqlInCanvas) {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      sqlMatches.forEach((match, mi) => {
        const sql = match[1].trim();
        const normalizedSql = normalizeSql(sql);
        const queryResult = normalizedSql && executedQueries ? executedQueries.get(normalizedSql) : null;
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
          parts.push(<SqlResultsInline key={`r-${mi}`} result={queryResult} />);
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
    <div className="flex flex-col items-start mb-12 fade-in-up">
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center">
          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--violet-bright)' }}>psychology</span>
        </div>
        <span className="label-md" style={{ color: '#e2e8f0', letterSpacing: '0.1em' }}>Axon</span>
      </div>

      {/* Content */}
      <div className="space-y-8 text-lg leading-[1.6]" style={{ color: 'var(--on-surface)' }}>
        {renderContent()}

        {hasAttachments && (
          <div className="flex flex-wrap gap-2">
            {message.attachments!.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-2"
                style={{ color: '#cbd5e1' }}
              >
                <span className="material-symbols-outlined text-sm">attach_file</span>
                <span className="truncate max-w-[100px]">{att.name}</span>
                <span style={{ color: 'var(--text-ghost)' }}>{formatFileSize(att.size)}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Sources + Actions */}
      <div className="flex items-center gap-4 mt-6 w-full">
        <SourceBadges sources={sources} />
        <div className="ml-auto">
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
