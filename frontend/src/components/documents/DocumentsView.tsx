// ─── Documents View ──────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { fetchDocuments, uploadDocument, deleteDocument } from '../../services/documentService';
import type { UploadedDocument } from '../../types/documents';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { useAuth } from '../../stores/AuthProvider';

const DocumentsView: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments()
        .then(setDocuments)
        .catch(() => setDocuments([]))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    if (!isAuthenticated) { openAuthModal('signin'); return; }
    setIsUploading(true);
    const fileArray = Array.from(files);
    try {
      const results = await Promise.all(fileArray.map((f) => uploadDocument(f)));
      setDocuments((prev) => [...results, ...prev]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  }, [isAuthenticated, openAuthModal]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) void handleUpload(e.dataTransfer.files);
  };

  return (
    <PageContainer maxWidth="960px">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-10">
          <h1 className="display-sm text-white mb-2">Documents</h1>
          <p className="body-md" style={{ color: 'var(--text-secondary)' }}>Upload and manage your files for AI analysis.</p>
        </div>

        {/* Upload Dropzone */}
        <div
          className={`rounded-2xl p-8 mb-8 text-center cursor-pointer transition-all ${isDragging ? 'ring-2 ring-violet-500/40' : ''}`}
          style={{
            background: isDragging ? 'rgba(124,58,237,0.08)' : 'var(--glass-bg)',
            border: `2px dashed ${isDragging ? 'var(--violet-bright)' : 'rgba(255,255,255,0.08)'}`,
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Drop files here or click to upload"
        >
          <input ref={fileInputRef} type="file" multiple accept=".pdf,application/pdf" onChange={(e) => { if (e.target.files) void handleUpload(e.target.files); e.target.value = ''; }} className="sr-only" />
          <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: isDragging ? 'var(--violet-bright)' : 'var(--text-ghost)' }}>
            {isUploading ? 'progress_activity' : 'cloud_upload'}
          </span>
          <p className="body-md text-white mb-1">{isUploading ? 'Uploading…' : 'Drop files here or click to upload'}</p>
          <p className="body-sm" style={{ color: 'var(--text-muted)' }}>PDF files up to 10MB</p>
        </div>

        {/* Document list */}
        <div className="flex items-center gap-3 mb-6">
          <span className="label-md" style={{ color: 'var(--text-secondary)' }}>Your Documents ({documents.length})</span>
          <div className="h-px flex-grow" style={{ background: 'rgba(68,71,73,0.15)' }} />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton-pulse h-16 rounded-xl" />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="liquid-glass rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl mb-4 block" style={{ color: 'var(--text-ghost)' }}>folder_open</span>
            <p style={{ color: 'var(--text-secondary)' }}>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-4 flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-container-high)' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--violet-bright)', fontSize: '20px' }}>description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatFileSize(doc.size)} · {formatRelativeTime(doc.uploadedAt)}</p>
                </div>
                <button
                  type="button"
                  className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => void handleDelete(doc.id)}
                  aria-label={`Delete ${doc.name}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </PageContainer>
  );
};

export default DocumentsView;
