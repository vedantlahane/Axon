import React from 'react';

interface InputMetadataProps {
  modelName: string;
  documentCount: number;
}

const InputMetadata: React.FC<InputMetadataProps> = ({ modelName, documentCount }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs text-on-surface-variant opacity-40 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base">smart_toy</span>
          <span>Model: {modelName}</span>
        </div>
        {documentCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">attachment</span>
            <span>{documentCount} docs</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-mono bg-surface-container px-1.5 py-0.5 rounded">⌘K</span>
      </div>
    </div>
  );
};

export default InputMetadata;
