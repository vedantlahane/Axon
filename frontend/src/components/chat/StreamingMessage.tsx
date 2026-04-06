import React, { useEffect, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import Avatar from '../ui/Avatar';

interface StreamingMessageProps {
  content: string;
  isComplete?: boolean;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ content, isComplete = false }) => {
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
    }, 10); // 10ms per character for smooth streaming

    return () => clearInterval(timer);
  }, [content, isComplete]);

  return (
    <div className="flex gap-3 mb-4 animate-in fade-in-50 slide-in-from-bottom-2">
      {/* Avatar */}
      <Avatar fallback="AI" size="md" className="mt-1 flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="liquid-glass rounded-lg px-4 py-3">
          <div className="text-on-surface prose prose-invert max-w-none">
            <MarkdownRenderer content={displayedContent} />
            {!isComplete && (
              <span className="inline-block w-2 h-5 ml-1 bg-violet-400 rounded-sm animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingMessage;
