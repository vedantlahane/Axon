// ─── Upload Dropzone ─────────────────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import Icon from '../ui/Icon';

interface UploadDropzoneProps {
  onUpload: (files: FileList) => void;
  isUploading?: boolean;
  accept?: string;
}

const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onUpload,
  isUploading = false,
  accept = '.pdf,.csv,.xlsx,.sql,.txt,.md',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`rounded-2xl p-8 text-center cursor-pointer transition-all ${
        isUploading ? 'opacity-50 pointer-events-none' : ''
      }`}
      style={{
        background: isDragging
          ? 'rgba(124, 58, 237, 0.06)'
          : 'transparent',
        border: `2px dashed ${
          isDragging
            ? 'var(--accent-violet-light)'
            : 'rgba(255, 255, 255, 0.08)'
        }`,
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) onUpload(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      aria-label="Drop files here or click to upload"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) onUpload(e.target.files);
          e.target.value = '';
        }}
      />
      <Icon
        name={isUploading ? 'progress_activity' : 'cloud_upload'}
        className="text-3xl mb-3"
        style={{
          color: isDragging
            ? 'var(--accent-violet-light)'
            : 'var(--text-ghost)',
        }}
      />
      <p className="text-sm font-medium text-white mb-1">
        {isUploading ? 'Uploading…' : 'Drop files here or click to upload'}
      </p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        or click to select files
      </p>
    </div>
  );
};

export default UploadDropzone;