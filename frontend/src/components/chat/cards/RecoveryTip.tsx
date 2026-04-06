// ─── Recovery Tip ────────────────────────────────────────────────────────────

import React from 'react';

interface RecoveryTipProps {
  message: string;
}

const RecoveryTip: React.FC<RecoveryTipProps> = ({ message }) => (
  <div className="flex justify-center my-3">
    <div className="glass-info rounded-full px-4 py-2 flex items-center gap-2">
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '14px', color: 'var(--color-warning)' }}
      >
        lightbulb
      </span>
      <p className="text-xs text-slate-500 italic">{message}</p>
    </div>
  </div>
);

export default RecoveryTip;