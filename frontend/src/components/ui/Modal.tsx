import React, { useEffect } from 'react';
import { cn } from '../../utils/formatters';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn('relative z-10 w-full', maxWidth)}>
        <div className="liquid-glass rounded-xl border border-white/10 p-6 shadow-2xl">
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-on-surface">{title}</h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="text-on-surface">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
