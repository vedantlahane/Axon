// ─── Chat Input ──────────────────────────────────────────────────────────────
// Fixed-bottom glass input bar with light leak, file chips, and metadata.
// Matches FRONTEND_CONTEXT.md §5.1 "ChatInput (Bottom Input Bar)"

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import { useAuth } from '../../stores/AuthProvider';
import { useDatabaseStore } from '../../stores/databaseStore';
import { uploadDocument, deleteDocument } from '../../services/documentService';
import { formatFileSize } from '../../utils/formatters';
import InputMetadata from './InputMetadata';
import type { LLMModel } from '../../types/models';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ChatInputProps {
  availableModels?: LLMModel[];
  currentModel?: string;
}

/* ── Component ──────────────────────────────────────────────────────────── */

const ChatInput: React.FC<ChatInputProps> = ({
  availableModels = [],
  currentModel,
}) => {
  // ── Store ──────────────────────────────────────────────────────────────
  const inputValue = useChatStore((s) => s.inputValue);
  const setInputValue = useChatStore((s) => s.setInputValue);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isSending = useChatStore((s) => s.isSending);
  const files = useChatStore((s) => s.files);
  const addFile = useChatStore((s) => s.addFile);
  const updateFile = useChatStore((s) => s.updateFile);
  const removeFile = useChatStore((s) => s.removeFile);

  const { isAuthenticated, openAuthModal } = useAuth();
  const { connection } = useDatabaseStore();

  // ── Local State ────────────────────────────────────────────────────────
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const previewsRef = useRef(new Map<string, string>());

  // ── Auto-resize textarea ───────────────────────────────────────────────
  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [inputValue]);

  // ── Auto-focus after send ──────────────────────────────────────────────
  useEffect(() => {
    if (!isSending && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isSending]);

  // ── Cleanup blob URLs on unmount ───────────────────────────────────────
  useEffect(() => {
    const previews = previewsRef.current;
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      previews.clear();
    };
  }, []);

  // ── Send Handler ───────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;
    if (files.some((t) => t.status === 'uploading')) return;
    if (!isAuthenticated) {
      openAuthModal('signin');
      return;
    }

    setSendError(null);
    const docIds = files
      .filter((f) => f.status === 'uploaded' && f.documentId)
      .map((f) => f.documentId!);

    try {
      await sendMessage(trimmed, docIds.length > 0 ? docIds : undefined);
      // Revoke blob URLs for sent files
      files.forEach((f) => {
        const url = previewsRef.current.get(f.id);
        if (url) {
          URL.revokeObjectURL(url);
          previewsRef.current.delete(f.id);
        }
      });
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send.');
      setTimeout(() => setSendError(null), 5000);
    }
  }, [inputValue, isSending, files, isAuthenticated, openAuthModal, sendMessage]);

  // ── File Upload Handler ────────────────────────────────────────────────
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      if (!selectedFiles.length) {
        event.target.value = '';
        return;
      }
      if (!isAuthenticated) {
        event.target.value = '';
        openAuthModal('signup');
        return;
      }
      if (files.length + selectedFiles.length > 10) {
        setSendError('Max 10 files.');
        setTimeout(() => setSendError(null), 4000);
        event.target.value = '';
        return;
      }

      selectedFiles.forEach((file, index) => {
        const id = `${file.name}-${Date.now()}-${index}`;
        let preview: string | undefined;
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
          previewsRef.current.set(id, preview);
        }
        addFile({ id, file, preview, status: 'uploading' });

        uploadDocument(file)
          .then((doc) =>
            updateFile(id, { status: 'uploaded', documentId: doc.id })
          )
          .catch(() =>
            updateFile(id, { status: 'error', error: 'Upload failed' })
          );
      });
      event.target.value = '';
    },
    [isAuthenticated, openAuthModal, files.length, addFile, updateFile]
  );

  // ── File Remove Handler ────────────────────────────────────────────────
  const handleRemoveFile = useCallback(
    (id: string) => {
      const tile = files.find((f) => f.id === id);
      const url = previewsRef.current.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        previewsRef.current.delete(id);
      }
      removeFile(id);
      if (tile?.documentId) void deleteDocument(tile.documentId);
    },
    [files, removeFile]
  );

  // ── Derived State ──────────────────────────────────────────────────────
  const hasUploadingFiles = files.some((t) => t.status === 'uploading');
  const canSend = inputValue.trim().length > 0;
  const isDisabled =
    isSending || hasUploadingFiles || !canSend || !isAuthenticated;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled) void handleSend();
    }
  };

  const currentModelName =
    availableModels.find((m) => m.id === currentModel)?.name ?? 'Gemini 2.5 Pro';

  // ── Placeholder Text ───────────────────────────────────────────────────
  const getPlaceholder = () => {
    if (!isAuthenticated) return 'Sign in to start...';
    if (isSending) return 'Waiting for response...';
    if (hasUploadingFiles) return 'Uploading files...';
    return 'Message axon...';
  };

  // ── File Chip Icon ─────────────────────────────────────────────────────
  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return 'description';
    if (name.endsWith('.xlsx') || name.endsWith('.csv')) return 'table_chart';
    if (name.endsWith('.sql')) return 'database';
    return 'attachment';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-40 flex flex-col items-center">
      {/* ── Error Toast ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {sendError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 mx-4 flex w-full max-w-[780px] items-center gap-2 rounded-xl px-4 py-2 text-xs glass-error"
          >
            <span className="material-symbols-outlined text-sm text-rose-400">
              error
            </span>
            <span className="flex-1" style={{ color: 'var(--color-error)' }}>
              {sendError}
            </span>
            <button
              type="button"
              onClick={() => setSendError(null)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss error"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── The Monolith — Glass Input Card ───────────────────────────── */}
      <div
        className={[
          'w-full max-w-[780px] relative group',
          // Desktop: floating with margin. Mobile: docked to edges.
          'mx-4 mb-4 md:mx-auto',
          // Mobile: no bottom margin, flat bottom corners
          'max-md:mx-0 max-md:mb-0',
        ].join(' ')}
      >
        <div
          className={[
            'liquid-glass light-leak-top p-3 flex flex-col gap-2',
            // Desktop: full rounded. Mobile: only top corners.
            'rounded-2xl max-md:rounded-t-2xl max-md:rounded-b-none',
          ].join(' ')}
          style={{
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* ── File Chips — Inside the card, above input row ──────── */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                className="flex gap-2 overflow-x-auto px-1 pb-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {files.map((tile) => (
                  <div
                    key={tile.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs shrink-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-slate-500"
                      style={{ fontSize: '14px' }}
                    >
                      {getFileIcon(tile.file.name)}
                    </span>
                    <span
                      className="text-slate-300 max-w-[100px] truncate"
                      title={tile.file.name}
                    >
                      {tile.file.name}
                    </span>
                    <span className="text-slate-500">
                      {formatFileSize(tile.file.size)}
                    </span>
                    {/* Status indicator */}
                    {tile.status === 'uploading' && (
                      <span
                        className="w-1.5 h-1.5 rounded-full breathe"
                        style={{ background: 'var(--color-warning)' }}
                      />
                    )}
                    {tile.status === 'error' && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--color-error)' }}
                      />
                    )}
                    <button
                      type="button"
                      className="text-slate-500 hover:text-white transition-colors ml-1"
                      onClick={() => handleRemoveFile(tile.id)}
                      aria-label={`Remove ${tile.file.name}`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '12px' }}
                      >
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input Row ─────────────────────────────────────────────── */}
          <div className="flex items-end gap-2">
            {/* Attach button */}
            <button
              type="button"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all shrink-0"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('signup');
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={isSending}
              aria-label="Attach file"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '20px' }}
              >
                add
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.xlsx,.sql,.txt,.md"
              onChange={handleFileUpload}
              className="sr-only"
              tabIndex={-1}
            />

            {/* Textarea */}
            <textarea
              ref={messageInputRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={getPlaceholder()}
              className="flex-1 resize-none py-2.5 px-1 bg-transparent border-none text-base leading-relaxed focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                color: 'var(--text-primary)',
                caretColor: 'var(--accent-violet-light)',
              }}
              onKeyDown={handleKeyDown}
              disabled={!isAuthenticated}
              aria-label="Chat message input"
            />

            {/* Send button */}
            <button
              type="button"
              className="p-2 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
              style={{
                background: isDisabled
                  ? 'rgba(255, 255, 255, 0.10)'
                  : 'var(--primary)',
                color: isDisabled ? 'var(--text-muted)' : 'var(--on-primary)',
                boxShadow: isDisabled
                  ? 'none'
                  : '0 0 15px rgba(255, 255, 255, 0.15)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
              disabled={isDisabled}
              onClick={() => void handleSend()}
              aria-label="Send message"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '20px' }}
              >
                arrow_upward
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Metadata Row — Hidden on mobile ───────────────────────────── */}
      <div className="hidden md:block mb-6">
        <InputMetadata
          modelName={currentModelName}
          documentCount={files.length}
          hasDatabase={!!connection}
        />
      </div>
    </div>
  );
};

export default ChatInput;