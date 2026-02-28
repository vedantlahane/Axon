import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200',
  error: 'border-rose-500/30 bg-rose-950/90 text-rose-200 dark:bg-rose-950/90 dark:text-rose-200',
  info: 'border-blue-500/30 bg-blue-950/90 text-blue-200 dark:bg-blue-950/90 dark:text-blue-200',
  warning: 'border-amber-500/30 bg-amber-950/90 text-amber-200 dark:bg-amber-950/90 dark:text-amber-200',
};

const typeIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${typeStyles[toast.type]}`}
    >
      <span className="flex-shrink-0">{typeIcons[toast.type]}</span>
      <span className="flex-1 min-w-0">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 rounded-md p-1 opacity-60 transition hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-2 max-w-sm" role="status" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

/** Creates a toast message object with a unique ID. */
export function createToast(type: ToastType, message: string): ToastMessage {
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    message,
  };
}

export default ToastContainer;
