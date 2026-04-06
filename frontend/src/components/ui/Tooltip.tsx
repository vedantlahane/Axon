// ─── Tooltip (continued) ─────────────────────────────────────────────────────
import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

const POSITIONS = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
};

const Tooltip: React.FC<TooltipProps> = ({ content, side = 'top', children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && (
        <div
          className={`absolute z-50 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap pointer-events-none glass-strong rounded-lg ${POSITIONS[side]}`}
          style={{ color: 'var(--text-primary)' }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;