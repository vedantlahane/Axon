// ─── Danger Section ──────────────────────────────────────────────────────────
// Red-tinted glass card with destructive actions.
// Matches FRONTEND_CONTEXT.md §5.5 "Settings — Danger Zone"

import React, { useState } from 'react';

interface DangerSectionProps {
  onClearHistory?: () => void;
  onDeleteAccount?: () => void;
}

const DangerSection: React.FC<DangerSectionProps> = ({
  onClearHistory,
  onDeleteAccount,
}) => {
  const [confirmAction, setConfirmAction] = useState<'clear' | 'delete' | null>(null);

  const handleConfirm = () => {
    if (confirmAction === 'clear') onClearHistory?.();
    if (confirmAction === 'delete') onDeleteAccount?.();
    setConfirmAction(null);
  };

  return (
    <section className="glass-error rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <span
          className="material-symbols-outlined"
          style={{
            color: 'var(--color-error, #FB7185)',
            fontSize: '20px',
            fontVariationSettings: "'FILL' 1",
          }}
        >
          warning
        </span>
        <h2 className="text-lg font-semibold" style={{ color: '#FB7185' }}>
          Danger Zone
        </h2>
      </div>

      <div className="space-y-4">
        {confirmAction ? (
          /* ── Confirmation State ──────────────────────────────────────── */
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {confirmAction === 'clear'
                ? 'This will permanently delete all your conversations. This cannot be undone.'
                : 'This will permanently delete your account and all associated data. This cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-glass text-sm"
                style={{
                  color: 'var(--color-error)',
                  borderColor: 'rgba(251, 113, 133, 0.30)',
                }}
                onClick={handleConfirm}
              >
                {confirmAction === 'clear' ? 'Yes, Delete All' : 'Yes, Delete Account'}
              </button>
              <button
                type="button"
                className="btn-glass text-sm"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* ── Default State ───────────────────────────────────────────── */
          <>
            {/* Clear History */}
            <button
              type="button"
              className="w-full p-3 rounded-xl text-left text-sm font-medium transition-colors hover:bg-white/5 flex items-center gap-3"
              style={{ color: 'var(--color-error)' }}
              onClick={() => setConfirmAction('clear')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                delete_sweep
              </span>
              Clear All Conversations
            </button>

            {/* Gradient separator */}
            <div
              className="h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.15), transparent)',
              }}
            />

            {/* Delete Account */}
            <button
              type="button"
              className="w-full p-3 rounded-xl text-left text-sm font-medium transition-colors hover:bg-white/5 flex items-center gap-3"
              style={{ color: 'var(--color-error)' }}
              onClick={() => setConfirmAction('delete')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                person_remove
              </span>
              Delete Account
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default DangerSection;