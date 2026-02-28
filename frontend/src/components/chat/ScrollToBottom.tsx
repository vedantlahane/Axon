import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ScrollToBottomProps {
  /** The scrollable container ref */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Threshold in pixels from the bottom before showing the button */
  threshold?: number;
}

/**
 * A floating "scroll to bottom" pill that appears when the user scrolls up
 * in the chat feed, providing a quick way to jump to the latest messages.
 */
const ScrollToBottom: React.FC<ScrollToBottomProps> = ({ scrollRef, threshold = 200 }) => {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setVisible(distanceFromBottom > threshold);
  }, [scrollRef, threshold]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(checkScroll);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [scrollRef, checkScroll]);

  const scrollDown = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollDown}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-panel)]/90 backdrop-blur px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-lg transition hover:bg-[var(--bg-soft)] hover:text-[var(--text-primary)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          aria-label="Scroll to bottom"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 13 12 18 17 13" />
            <polyline points="7 6 12 11 17 6" />
          </svg>
          New messages
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToBottom;
