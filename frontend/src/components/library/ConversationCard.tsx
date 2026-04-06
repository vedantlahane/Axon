// ─── Conversation Card ───────────────────────────────────────────────────────
// Library grid card. Shows title, preview, pin, timestamp, message count.
// Matches FRONTEND_CONTEXT.md §5.5 "Library — Each card"

import React from 'react';

interface ConversationCardProps {
  conversation: {
    id: string;
    title: string;
    summary: string;
    messageCount?: number;
  };
  timeLabel: string;
  isPinned?: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onTogglePin?: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  timeLabel,
  isPinned = false,
  onOpen,
  onDelete,
  onTogglePin,
}) => (
  <div
    className="glass-card p-5 flex flex-col justify-between cursor-pointer group"
    style={{ minHeight: '140px' }}
    onClick={onOpen}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen();
      }
    }}
    aria-label={`Open conversation: ${conversation.title}`}
  >
    {/* ── Top Row: Icon + Actions ──────────────────────────────────────── */}
    <div className="flex justify-between items-start mb-3">
      <div
        className="p-2 rounded-lg"
        style={{ background: 'var(--bg-surface-high, #222a3d)' }}
      >
        <span
          className="material-symbols-outlined"
          style={{ color: 'var(--text-secondary)', fontSize: '20px' }}
        >
          chat_bubble_outline
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Pin toggle */}
        {onTogglePin && (
          <button
            type="button"
            className={`btn-icon transition-opacity ${
              isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '16px',
                color: isPinned
                  ? 'var(--accent-violet-light, #a78bfa)'
                  : 'var(--text-ghost)',
                fontVariationSettings: isPinned ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              push_pin
            </span>
          </button>
        )}

        {/* Delete */}
        <button
          type="button"
          className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete conversation: ${conversation.title}`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '16px' }}
          >
            delete
          </span>
        </button>
      </div>
    </div>

    {/* ── Content ──────────────────────────────────────────────────────── */}
    <div>
      <h3 className="text-sm font-semibold text-white mb-1 truncate">
        {conversation.title}
      </h3>
      <p
        className="text-xs leading-relaxed truncate-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {conversation.summary}
      </p>
    </div>

    {/* ── Footer: Timestamp + Message Count ────────────────────────────── */}
    <div className="flex items-center gap-3 mt-3">
      <span
        className="text-[10px] uppercase tracking-widest"
        style={{ color: 'var(--text-faint, #475569)' }}
      >
        {timeLabel}
      </span>
      {conversation.messageCount != null && conversation.messageCount > 0 && (
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: 'var(--text-faint, #475569)' }}
        >
          · {conversation.messageCount} msg
        </span>
      )}
    </div>
  </div>
);

export default ConversationCard;