// ─── Documents View ──────────────────────────────────────────────────────────
// File management page with upload dropzone and document grid.
// Matches FRONTEND_CONTEXT.md §5.5 "Documents (/documents)"

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../../lib/animations';
import PageContainer from '../layout/PageContainer';
import DocumentCard from './DocumentCard';
import StorageBar from './StorageBar';
import { fetchDocuments, uploadDocument, deleteDocument } from '../../services/documentService';
import type { UploadedDocument } from '../../types/documents';
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

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      if (!isAuthenticated) {
        openAuthModal('signin');
        return;
      }
      setIsUploading(true);
      try {
        const results = await Promise.all(
          Array.from(files).map((f) => uploadDocument(f))
        );
        setDocuments((prev) => [...results, ...prev]);
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [isAuthenticated, openAuthModal]
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) void handleUpload(e.dataTransfer.files);
  };

  // Storage calculation (simple)
  const totalStorageMB = 100;
  const usedStorageMB = documents.reduce((acc, d) => acc + (d.size || 0), 0) / (1024 * 1024);

  return (
    <PageContainer maxWidth="960px">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* ── Title ────────────────────────────────────────────────────── */}
        <motion.div className="flex items-center justify-between mb-10" variants={fadeUp}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
              Documents
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload and manage your files for AI analysis.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('signin');
                return;
              }
              fileInputRef.current?.click();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              upload
            </span>
            Upload
          </button>
        </motion.div>

        {/* ── Dropzone ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <div
            className={`rounded-2xl p-8 mb-8 text-center cursor-pointer transition-all ${
              isDragging ? 'ring-2 ring-violet-500/30' : ''
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
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Drop files here or click to upload"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.xlsx,.sql,.txt,.md"
              onChange={(e) => {
                if (e.target.files) void handleUpload(e.target.files);
                e.target.value = '';
              }}
              className="sr-only"
            />
            <span
              className="material-symbols-outlined text-3xl mb-3"
              style={{
                color: isDragging
                  ? 'var(--accent-violet-light)'
                  : 'var(--text-ghost)',
              }}
            >
              {isUploading ? 'progress_activity' : 'cloud_upload'}
            </span>
            <p className="text-sm font-medium text-white mb-1">
              {isUploading
                ? 'Uploading…'
                : 'Drop files here or click to upload'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              PDF, CSV, XLSX, SQL, TXT, MD — up to 10MB each
            </p>
          </div>
        </motion.div>

        {/* ── Document Grid ────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-pulse h-32 rounded-xl" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="liquid-glass rounded-xl p-12 text-center"
          >
            <span
              className="material-symbols-outlined text-4xl mb-4 block"
              style={{ color: 'var(--text-ghost)' }}
            >
              folder_open
            </span>
            <p style={{ color: 'var(--text-secondary)' }}>
              No documents uploaded yet.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer}
          >
            {documents.map((doc) => (
              <motion.div key={doc.id} variants={fadeUp}>
                <DocumentCard
                  id={doc.id}
                  filename={doc.name}
                  size={doc.size}
                  type={doc.name.split('.').pop() ?? 'file'}
                  uploadDate={new Date(doc.uploadedAt)}
                  onDelete={() => void handleDelete(doc.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Storage Bar ──────────────────────────────────────────────── */}
        {documents.length > 0 && (
          <motion.div className="mt-8" variants={fadeUp}>
            <StorageBar used={usedStorageMB} total={totalStorageMB} />
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
};

export default DocumentsView;