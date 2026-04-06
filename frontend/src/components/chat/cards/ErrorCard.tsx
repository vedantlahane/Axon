import React from 'react';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

interface ErrorCardProps {
  title: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ title, message, errorCode, onRetry, onDismiss }) => {
  return (
    <div className="mb-3 rounded-lg border border-error/30 bg-error/5 p-4 backdrop-blur-sm">
      <div className="flex gap-3">
        <span className="material-symbols-outlined text-error text-2xl flex-shrink-0">error</span>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-error">{title}</h3>
            {errorCode && <Badge variant="error" size="sm">{errorCode}</Badge>}
          </div>
          <p className="text-on-surface-variant text-sm mb-3">{message}</p>
          <div className="flex gap-2">
            {onRetry && <Button variant="danger" size="sm" onClick={onRetry}>Retry</Button>}
            {onDismiss && <Button variant="ghost" size="sm" onClick={onDismiss}>Dismiss</Button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorCard;
