// ─── User Message ────────────────────────────────────────────────────────────
// Right-aligned glass card for user messages.
// Matches FRONTEND_CONTEXT.md §5.2 "UserMessage"

import React from 'react';
import Icon from '../ui/Icon';
import type { ChatMessage } from '../../types/chat';
import { formatDisplayTime, formatFileSize } from '../../utils/formatters';
import MarkdownRenderer from './MarkdownRenderer';

interface UserMessageProps {
  message: ChatMessage;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const hasAttachments = (message.attachments?.length ?? 0) > 0;
  const hasMarkdown = message.content.includes('```') || message.content.includes('**');

  return (
    <div className="flex flex-col items-end mb-8">
      {/* Glass card — desktop: liquid-glass, mobile: bg-primary/10 bubble */}
      <div
        className={[
          'px-6 py-4 max-w-[85%] leading-relaxed',
          // Desktop: standard glass
          'liquid-glass rounded-2xl',
          // Mobile: chat bubble style
          'max-md:max-w-[90%] max-md:bg-white/10 max-md:backdrop-blur-none max-md:rounded-xl max-md:rounded-tr-none',
        ].join(' ')}
        style={{ color: 'var(--on-surface)' }}
      >
        {/* File attachments — static chips at top (no remove button) */}
        {hasAttachments && (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
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
                  <span className="text-slate-500">
                    {formatFileSize(att.size)}
                  </span>
                </a>
              ))}
            </div>
            {/* Gradient separator */}
            <div className="gradient-separator mb-3" />
          </>
        )}

        {/* Message content */}
        {hasMarkdown ? (
          <div className="prose-content">
            <MarkdownRenderer content={message.content} />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>

      {/* Timestamp */}
      <span
        className="mt-2 pr-2 text-[10px] uppercase tracking-widest"
        style={{ color: 'rgba(100, 116, 139, 0.4)' }}
      >
        You · {formatDisplayTime(message.timestamp)}
      </span>
    </div>
  );
};

export default UserMessage;