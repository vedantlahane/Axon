// ─── Scroll To Bottom ────────────────────────────────────────────────────────
// Floating pill that appears when user scrolls up in the chat.

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ScrollToBottomProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  threshold?: number;
}

const ScrollToBottom: React.FC<ScrollToBottomProps> = ({
  scrollRef,
  threshold = 200,
}) => {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
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
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollDown}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium liquid-glass cursor-pointer"
          style={{
            color: 'var(--text-secondary)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.10)' }}
          aria-label="Scroll to bottom"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '16px' }}
          >
            keyboard_double_arrow_down
          </span>
          New messages
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToBottom;