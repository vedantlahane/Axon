// ─── Toast Container ─────────────────────────────────────────────────────────

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast, type ToastType } from '../../stores/ToastProvider';

const iconMap: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const colorMap: Record<ToastType, string> = {
  success: 'var(--success)',
  error: 'var(--error)',
  info: 'var(--info)',
  warning: 'var(--warning)',
};

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed bottom-24 right-6 z-[300] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ boxShadow: 'var(--shadow-glass)' }}
            role="alert"
          >
            <span className="material-symbols-outlined" style={{ color: colorMap[toast.type], fontSize: '20px' }}>{iconMap[toast.type]}</span>
            <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{toast.message}</span>
            <button type="button" onClick={() => dismissToast(toast.id)} className="btn-icon" aria-label="Dismiss notification">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
