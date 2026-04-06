import React from 'react';
import Button from '../../ui/Button';

interface DocumentPreviewProps {
  filename: string;
  summary: string[];
  fileSize?: number;
  onView?: () => void;
  onDownload?: () => void;
  onAsk?: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  filename,
  summary,
  fileSize,
  onView,
  onDownload,
  onAsk,
}) => {
  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return 'description';
    if (name.endsWith('.xlsx') || name.endsWith('.csv')) return 'table_chart';
    if (name.endsWith('.sql')) return 'database';
    return 'file_present';
  };

  return (
    <div className="liquid-glass rounded-lg p-4 mb-3 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <span className={`material-symbols-outlined text-xl ${filename.endsWith('.pdf') ? 'text-red-400' : filename.endsWith('.xlsx') ? 'text-emerald-400' : 'text-blue-400'}`}>
            {getFileIcon(filename)}
          </span>
          <div className="flex-1">
            <p className="font-semibold text-on-surface">{filename}</p>
            {fileSize && <p className="text-xs text-on-surface-variant">{(fileSize / 1024 / 1024).toFixed(2)} MB</p>}
          </div>
        </div>
      </div>

      {/* Summary bullets */}
      <ul className="space-y-1 mb-4">
        {summary.map((bullet, idx) => (
          <li key={idx} className="text-sm text-on-surface-variant flex gap-2">
            <span className="text-violet-400">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex gap-2">
        {onView && <Button variant="ghost" size="sm" onClick={onView}>View</Button>}
        {onDownload && <Button variant="ghost" size="sm" onClick={onDownload}>Download</Button>}
        {onAsk && <Button variant="glass" size="sm" onClick={onAsk}>Ask</Button>}
      </div>
    </div>
  );
};

export default DocumentPreview;
