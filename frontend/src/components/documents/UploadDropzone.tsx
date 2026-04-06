import React, { useState, useRef } from 'react';

interface UploadDropzoneProps {
  onUpload: (files: FileList) => void;
  isUploading?: boolean;
  accept?: string;
}

const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onUpload,
  isUploading = false,
  accept = '.pdf,.xlsx,.csv,.sql',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDrag}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-violet-400 bg-violet-500/10'
          : 'border-surface-variant bg-surface-container-lowest hover:border-violet-400'
      } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={accept}
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />

      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-4xl text-violet-400">
          {isUploading ? 'sync' : 'cloud_upload'}
        </span>
        <div>
          <p className="font-semibold text-on-surface">
            {isUploading ? 'Uploading...' : 'Drag and drop files here'}
          </p>
          <p className="text-sm text-on-surface-variant">or click to select</p>
        </div>
      </div>
    </div>
  );
};

export default UploadDropzone;
