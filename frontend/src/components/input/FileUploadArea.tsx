// ─── File Upload Area ────────────────────────────────────────────────────────
// Standalone file chips display. Used in UserMessage for sent files (static).
// For input-attached files, ChatInput renders its own chips internally.

import React from 'react';
import Icon from '../ui/Icon';
import { formatFileSize } from '../../utils/formatters';

interface FileItem {
  id: string;
  name: string;
  size: number;
}

interface FileUploadAreaProps {
  files: FileItem[];
  onRemove?: (fileId: string) => void;
  readonly?: boolean;
}

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf:  { icon: 'description',  color: 'text-rose-400' },
  xlsx: { icon: 'table_chart',  color: 'text-emerald-400' },
  csv:  { icon: 'table_chart',  color: 'text-emerald-400' },
  sql:  { icon: 'database',     color: 'text-blue-400' },
  default: { icon: 'attachment', color: 'text-violet-400' },
};

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return FILE_ICONS[ext] ?? FILE_ICONS.default;
};

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  files,
  onRemove,
  readonly = false,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file) => {
        const { icon, color } = getFileIcon(file.name);
        return (
          <div
            key={file.id}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Icon
              name={icon}
              className={`${color}`}
              style={{ fontSize: 14 }}
            />
            <span className="text-slate-300 max-w-[120px] truncate">
              {file.name}
            </span>
            <span className="text-slate-500">
              {formatFileSize(file.size)}
            </span>
            {!readonly && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(file.id)}
                className="ml-1 text-slate-500 hover:text-white transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileUploadArea;