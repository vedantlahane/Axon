// ─── User Message ────────────────────────────────────────────────────────────

import React from 'react';
import type { ChatMessage } from '../../types/chat';
import { formatDisplayTime, formatFileSize } from '../../utils/formatters';
import MarkdownRenderer from './MarkdownRenderer';

interface UserMessageProps {
  message: ChatMessage;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const hasAttachments = (message.attachments?.length ?? 0) > 0;

  return (
    <div className="flex flex-col items-end mb-12 fade-in-up">
      <div className="liquid-glass rounded-lg px-6 py-4 max-w-[85%] leading-relaxed" style={{ color: 'var(--on-surface)' }}>
        {message.content.includes('```') ? (
          <div className="prose-content"><MarkdownRenderer content={message.content} /></div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {hasAttachments && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.attachments!.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 transition-all"
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
      <span className="mt-3 label-sm" style={{ color: 'var(--text-subtle)', letterSpacing: '0.1em' }}>
        You · {formatDisplayTime(message.timestamp)}
      </span>
    </div>
  );
};

export default UserMessage;
