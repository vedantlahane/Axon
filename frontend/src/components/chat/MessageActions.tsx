import React from 'react';
import type { FeedbackType } from '../../types/chat';

interface MessageActionsProps {
  isCopied: boolean;
  feedback: FeedbackType | null;
  onCopy: () => void;
  onFeedback: (type: FeedbackType) => void;
}

const actions: { type: 'copy' | FeedbackType; icon: string; activeIcon?: string; title: string }[] = [
  { type: 'copy', icon: 'content_copy', activeIcon: 'check', title: 'Copy' },
  { type: 'like', icon: 'thumb_up', title: 'Good' },
  { type: 'dislike', icon: 'thumb_down', title: 'Bad' },
  { type: 'report', icon: 'flag', title: 'Report' },
];

const MessageActions: React.FC<MessageActionsProps> = ({ isCopied, feedback, onCopy, onFeedback }) => (
  <div className="flex items-center gap-1">
    {actions.map(({ type, icon, activeIcon, title }) => {
      const isActive = type === 'copy' ? isCopied : feedback === type;
      const displayIcon = type === 'copy' && isCopied ? (activeIcon ?? icon) : icon;

      return (
        <button
          key={type}
          type="button"
          title={title}
          aria-label={title}
          className="btn-icon"
          style={{
            color: isActive ? 'var(--violet-bright)' : 'var(--text-ghost)',
            background: isActive ? 'var(--violet-soft)' : 'transparent',
          }}
          onClick={() => (type === 'copy' ? onCopy() : onFeedback(type))}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{displayIcon}</span>
        </button>
      );
    })}
  </div>
);

export default MessageActions;
