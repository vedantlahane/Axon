// ─── Document Card ───────────────────────────────────────────────────────────

import React from 'react';
import { formatFileSize } from '../../utils/formatters';

interface DocumentCardProps {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadDate: Date;
  onDownload?: () => void;
  onDelete?: () => void;
}

const FILE_CONFIG: Record<string, { icon: string; color: string }> = {
  pdf: { icon: 'description', color: '#FB7185' },
  xlsx: { icon: 'table_chart', color: '#34D399' },
  csv: { icon: 'table_chart', color: '#34D399' },
  sql: { icon: 'database', color: '#60A5FA' },
  txt: { icon: 'article', color: '#94A3B8' },
  md: { icon: 'article', color: '#94A3B8' },
  default: { icon: 'attachment', color: '#a78bfa' },
};

const getConfig = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return FILE_CONFIG[ext] ?? FILE_CONFIG.default;
};

const DocumentCard: React.FC<DocumentCardProps> = ({
  filename,
  size,
  type,
  uploadDate,
  onDownload,
  onDelete,
}) => {
  const { icon, color } = getConfig(filename);

  return (
    <div
      className="glass-card p-5 flex flex-col gap-3 group"
    >
      {/* Icon + file info */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}15` }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', color }}
          >
            {icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{filename}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatFileSize(size)} · {uploadDate.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Type badge */}
      <div className="flex items-center justify-between">
        <span
          className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            background: `${color}15`,
            color,
            border: `1px solid ${color}30`,
          }}
        >
          {type.toUpperCase()}
        </span>

        {/* Actions — visible on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDownload && (
            <button
              type="button"
              className="btn-icon"
              onClick={onDownload}
              aria-label={`Download ${filename}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                download
              </span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="btn-icon"
              style={{ color: 'var(--color-error)' }}
              onClick={onDelete}
              aria-label={`Delete ${filename}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                delete
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;