// ─── Toast Container ─────────────────────────────────────────────────────────
// Renders toast stack using semantic glass surfaces.
// Matches FRONTEND_CONTEXT.md glass-success/error/warning/info.

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast, type ToastType } from '../../stores/ToastProvider';

const ICON_MAP: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const GLASS_MAP: Record<ToastType, string> = {
  success: 'glass-success',
  error: 'glass-error',
  info: 'glass-info',
  warning: 'glass-warning',
};

const COLOR_MAP: Record<ToastType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
};

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="fixed bottom-24 right-6 z-[300] flex flex-col gap-2 max-w-sm"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`${GLASS_MAP[toast.type]} rounded-xl px-4 py-3 flex items-center gap-3`}
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{
                color: COLOR_MAP[toast.type],
                fontSize: '20px',
                fontVariationSettings: "'FILL' 1",
              }}
            >
              {ICON_MAP[toast.type]}
            </span>
            <span
              className="flex-1 text-sm min-w-0"
              style={{ color: 'var(--text-primary)' }}
            >
              {toast.message}
            </span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="btn-icon shrink-0"
              aria-label="Dismiss notification"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '16px' }}
              >
                close
              </span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;