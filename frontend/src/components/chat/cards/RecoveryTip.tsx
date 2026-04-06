import React from 'react';

interface RecoveryTipProps {
  message: string;
}

const RecoveryTip: React.FC<RecoveryTipProps> = ({ message }) => {
  return (
    <div className="flex justify-center my-3">
      <div className="liquid-glass rounded-full px-4 py-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-400 text-base">lightbulb</span>
        <p className="text-sm text-on-surface-variant">{message}</p>
      </div>
    </div>
  );
};

export default RecoveryTip;
