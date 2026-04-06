// ─── Streaming Message ───────────────────────────────────────────────────────
// Character-by-character streaming display for in-progress AI responses.

import React, { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import MarkdownRenderer from './MarkdownRenderer';

interface StreamingMessageProps {
  content: string;
  isComplete?: boolean;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  isComplete = false,
}) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (!content) {
      setDisplayedContent('');
      return;
    }

    if (isComplete) {
      setDisplayedContent(content);
      return;
    }

    // Stream text character by character
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(content.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [content, isComplete]);

  return (
    <div className="flex flex-col items-start mb-8 fade-in-up">
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

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div
        className="w-full text-lg leading-relaxed"
        style={{ color: 'var(--on-surface-variant)' }}
      >
        <div className="prose-content">
          <MarkdownRenderer content={displayedContent} />
          {!isComplete && (
            <span
              className="inline-block w-0.5 h-5 ml-1 rounded-sm animate-pulse"
              style={{ background: 'var(--accent-violet-light, #a78bfa)' }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamingMessage;