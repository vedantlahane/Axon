// ─── Message Actions ─────────────────────────────────────────────────────────
// Copy, like, dislike, report buttons. Shown on hover in AssistantMessage.

import React from 'react';
import type { FeedbackType } from '../../types/chat';

interface MessageActionsProps {
  isCopied: boolean;
  feedback: FeedbackType | null;
  onCopy: () => void;
  onFeedback: (type: FeedbackType) => void;
}

const actions: Array<{
  type: 'copy' | FeedbackType;
  icon: string;
  activeIcon?: string;
  title: string;
}> = [
  { type: 'copy', icon: 'content_copy', activeIcon: 'check', title: 'Copy' },
  { type: 'like', icon: 'thumb_up', title: 'Good response' },
  { type: 'dislike', icon: 'thumb_down', title: 'Bad response' },
];

const MessageActions: React.FC<MessageActionsProps> = ({
  isCopied,
  feedback,
  onCopy,
  onFeedback,
}) => (
  <div className="flex items-center gap-1">
    {actions.map(({ type, icon, activeIcon, title }) => {
      const isActive = type === 'copy' ? isCopied : feedback === type;
      const displayIcon =
        type === 'copy' && isCopied ? (activeIcon ?? icon) : icon;

      return (
        <button
          key={type}
          type="button"
          title={title}
          aria-label={title}
          className="btn-icon transition-all"
          style={{
            color: isActive
              ? 'var(--accent-violet-light, #a78bfa)'
              : 'var(--text-ghost)',
            background: isActive
              ? 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))'
              : 'transparent',
          }}
          onClick={() =>
            type === 'copy' ? onCopy() : onFeedback(type as FeedbackType)
          }
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '16px' }}
          >
            {displayIcon}
          </span>
        </button>
      );
    })}
  </div>
);

export default MessageActions;