import React from 'react';
import Badge from '../ui/Badge';

interface DocumentCardProps {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadDate: Date;
  onDownload?: () => void;
  onDelete?: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  filename,
  size,
  type,
  uploadDate,
  onDownload,
  onDelete,
}) => {
  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return { icon: 'description', color: 'text-red-400' };
    if (name.endsWith('.xlsx') || name.endsWith('.csv')) return { icon: 'table_chart', color: 'text-emerald-400' };
    if (name.endsWith('.sql')) return { icon: 'database', color: 'text-blue-400' };
    return { icon: 'attachment', color: 'text-violet-400' };
  };

  const { icon, color } = getFileIcon(filename);
  const formattedDate = uploadDate.toLocaleDateString();

  return (
    <div className="liquid-glass rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <span className={`material-symbols-outlined text-2xl ${color} flex-shrink-0`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-on-surface truncate">{filename}</p>
          <p className="text-xs text-on-surface-variant">{(size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3">
        <span>{formattedDate}</span>
        <Badge variant="info" size="sm">{type.toUpperCase()}</Badge>
      </div>
      <div className="flex gap-2">
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex-1 px-3 py-1 rounded-lg text-xs font-medium text-violet-400 hover:bg-white/5 transition-colors"
          >
            Download
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 px-3 py-1 rounded-lg text-xs font-medium text-error/70 hover:bg-error/10 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
