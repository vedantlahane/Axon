// ─── Toast Provider (Context) ────────────────────────────────────────────────
// Manages toast notification stack. Max 5 visible at once.
// Toast components use glass-success, glass-error, glass-warning, glass-info.

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

/* ── Types ──────────────────────────────────────────────────────────────── */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

/* ── Constants ───────────────────────────────────────────────────────────── */

const MAX_TOASTS = 5;

/* ── Context ─────────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Provider ────────────────────────────────────────────────────────────── */

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastMessage = { id, type, message, duration };

      setToasts((prev) => {
        const next = [...prev, newToast];
        // Cap at MAX_TOASTS — remove oldest if exceeded
        if (next.length > MAX_TOASTS) {
          return next.slice(next.length - MAX_TOASTS);
        }
        return next;
      });

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, dismissToast, clearAllToasts }}
    >
      {children}
    </ToastContext.Provider>
  );
};

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}