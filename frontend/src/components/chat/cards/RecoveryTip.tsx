// ─── Recovery Tip ────────────────────────────────────────────────────────────

import React from 'react';
import Icon from '../../ui/Icon';

interface RecoveryTipProps {
  message: string;
}

const RecoveryTip: React.FC<RecoveryTipProps> = ({ message }) => (
  <div className="flex justify-center my-3">
    <div className="glass-info rounded-full px-4 py-2 flex items-center gap-2">
      <Icon
        name="lightbulb"
        style={{ fontSize: 14, color: 'var(--color-warning)' }}
      />
      <p className="text-xs text-slate-500 italic">{message}</p>
    </div>
  </div>
);

export default RecoveryTip;