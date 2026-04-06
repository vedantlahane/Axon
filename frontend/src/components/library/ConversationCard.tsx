import React from 'react';
import type { ConversationSummary } from '../../types/chat';
import { truncate } from '../../utils/formatters';

interface ConversationCardProps {
  conversation: ConversationSummary;
  timeLabel: string;
  onOpen: () => void;
  onDelete: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  timeLabel,
  onOpen,
  onDelete,
}) => (
  <div
    className="glass-card p-6 flex flex-col justify-between cursor-pointer group"
    style={{ minHeight: '140px' }}
    onClick={onOpen}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
    aria-label={`Open conversation: ${conversation.title}`}
  >
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 rounded-lg" style={{ background: 'var(--surface-container-high)' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--on-secondary-container)', fontSize: '20px' }}>chat_bubble</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="label-sm" style={{ color: 'var(--text-subtle)' }}>{timeLabel}</span>
        <button
          type="button"
          className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label={`Delete conversation: ${conversation.title}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
        </button>
      </div>
    </div>
    <div>
      <h3 className="title-md text-white mb-1">{conversation.title}</h3>
      <p className="body-sm" style={{ color: 'var(--text-secondary)' }}>
        {truncate(conversation.summary, 120)}
      </p>
    </div>
  </div>
);

export default ConversationCard;
