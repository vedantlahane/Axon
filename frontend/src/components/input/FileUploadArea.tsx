import React from 'react';

interface FileUploadAreaProps {
  files: Array<{ id: string; name: string; size: number }>;
  onRemove: (fileId: string) => void;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return { icon: 'description', color: 'text-red-400' };
    if (name.endsWith('.xlsx') || name.endsWith('.csv')) return { icon: 'table_chart', color: 'text-emerald-400' };
    if (name.endsWith('.sql')) return { icon: 'database', color: 'text-blue-400' };
    return { icon: 'attachment', color: 'text-violet-400' };
  };

  return (
    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-surface-container-lowest rounded-lg">
      {files.map((file) => {
        const { icon, color } = getFileIcon(file.name);
        return (
          <div
            key={file.id}
            className="liquid-glass rounded-lg px-3 py-2 flex items-center gap-2 text-sm"
          >
            <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
            <span className="text-on-surface max-w-[120px] truncate">{file.name}</span>
            <span className="text-xs text-on-surface-variant">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button
              onClick={() => onRemove(file.id)}
              className="ml-1 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FileUploadArea;
