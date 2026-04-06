// ─── Chat Input ──────────────────────────────────────────────────────────────
// The "Monolith" input bar — fixed bottom, glass surface, light leak.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import { useAuth } from '../../stores/AuthProvider';
import { useDatabaseStore } from '../../stores/databaseStore';
import { uploadDocument, deleteDocument } from '../../services/documentService';
import { formatFileSize } from '../../utils/formatters';
import type { LLMModel } from '../../types/models';

interface ChatInputProps {
  availableModels?: LLMModel[];
  currentModel?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ availableModels = [], currentModel }) => {
  const inputValue = useChatStore((s) => s.inputValue);
  const setInputValue = useChatStore((s) => s.setInputValue);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isSending = useChatStore((s) => s.isSending);
  const files = useChatStore((s) => s.files);
  const addFile = useChatStore((s) => s.addFile);
  const updateFile = useChatStore((s) => s.updateFile);
  const removeFile = useChatStore((s) => s.removeFile);

  const { isAuthenticated, openAuthModal } = useAuth();
  const { isSideWindowOpen, toggleSideWindow, connection } = useDatabaseStore();

  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const previewsRef = useRef(new Map<string, string>());

  // Auto-resize textarea
  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [inputValue]);

  // Auto-focus after send
  useEffect(() => {
    if (!isSending && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isSending]);

  // Cleanup previews on unmount
  useEffect(() => {
    const previews = previewsRef.current;
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      previews.clear();
    };
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;
    if (files.some((t) => t.status === 'uploading')) return;
    if (!isAuthenticated) { openAuthModal('signin'); return; }

    setSendError(null);
    const docIds = files.filter((f) => f.status === 'uploaded' && f.documentId).map((f) => f.documentId!);

    try {
      await sendMessage(trimmed, docIds.length > 0 ? docIds : undefined);
      files.forEach((f) => {
        const url = previewsRef.current.get(f.id);
        if (url) { URL.revokeObjectURL(url); previewsRef.current.delete(f.id); }
      });
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send.');
      setTimeout(() => setSendError(null), 5000);
    }
  }, [inputValue, isSending, files, isAuthenticated, openAuthModal, sendMessage]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) { event.target.value = ''; return; }
    if (!isAuthenticated) { event.target.value = ''; openAuthModal('signup'); return; }
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
        .then((doc) => updateFile(id, { status: 'uploaded', documentId: doc.id }))
        .catch(() => updateFile(id, { status: 'error', error: 'Upload failed' }));
    });
    event.target.value = '';
  }, [isAuthenticated, openAuthModal, files.length, addFile, updateFile]);

  const handleRemoveFile = useCallback((id: string) => {
    const tile = files.find((f) => f.id === id);
    const url = previewsRef.current.get(id);
    if (url) { URL.revokeObjectURL(url); previewsRef.current.delete(id); }
    removeFile(id);
    if (tile?.documentId) void deleteDocument(tile.documentId);
  }, [files, removeFile]);

  const hasUploadingFiles = files.some((t) => t.status === 'uploading');
  const canSend = inputValue.trim().length > 0;
  const isSendDisabled = isSending || hasUploadingFiles || !canSend || !isAuthenticated;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSendDisabled) void handleSend();
    }
  };

  const currentModelName = availableModels.find((m) => m.id === currentModel)?.name?.split(' ')[0] || 'Gemini';
  const canUseDatabaseTools = !!connection;

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-40 px-4 flex flex-col items-center">
      {/* Error */}
      <AnimatePresence>
        {sendError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex w-full max-w-[780px] items-center gap-2 rounded-xl px-4 py-2 text-xs"
            style={{ background: 'rgba(255,180,171,0.1)', color: 'var(--error)', border: '1px solid rgba(255,180,171,0.15)' }}
          >
            <span className="material-symbols-outlined text-sm">error</span>
            <span className="flex-1">{sendError}</span>
            <button type="button" onClick={() => setSendError(null)} style={{ opacity: 0.6 }} aria-label="Dismiss error">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File tiles */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="mb-3 flex gap-2 overflow-x-auto w-full max-w-[780px]"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {files.map((tile) => (
              <div key={tile.id} className="liquid-glass rounded-xl p-3 min-w-[140px] max-w-[160px] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-medium text-white" title={tile.file.name}>{tile.file.name}</p>
                  <button type="button" className="text-slate-500 hover:text-white transition-colors" onClick={() => handleRemoveFile(tile.id)} aria-label={`Remove ${tile.file.name}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
                <span className="text-[10px]" style={{ color: tile.status === 'error' ? 'var(--error)' : tile.status === 'uploading' ? 'var(--warning)' : 'var(--success)' }}>
                  {tile.status === 'uploading' ? 'Uploading…' : tile.status === 'uploaded' ? `Ready · ${formatFileSize(tile.file.size)}` : tile.error ?? 'Failed'}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── The Monolith ─────────────────────────────────────────────── */}
      <div className="w-full max-w-[780px] mb-4 relative group light-leak-bottom">
        {/* Light Leak Top Edge */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] opacity-50 z-10" style={{ background: 'linear-gradient(90deg, transparent, var(--violet), transparent)' }} />

        <div className="liquid-glass rounded-2xl p-2 flex items-end gap-2" style={{ boxShadow: 'var(--shadow-glass)' }}>
          {/* Attach */}
          <button
            type="button"
            className="btn-icon p-3"
            onClick={() => { if (!isAuthenticated) { openAuthModal('signup'); return; } fileInputRef.current?.click(); }}
            disabled={isSending}
            aria-label="Attach file"
          >
            <span className="material-symbols-outlined">add</span>
          </button>

          <input ref={fileInputRef} type="file" multiple accept=".pdf,application/pdf" onChange={handleFileUpload} className="sr-only" />

          {/* Textarea */}
          <textarea
            ref={messageInputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isSending ? 'Thinking…' : hasUploadingFiles ? 'Uploading files…' : isAuthenticated ? 'Message axon ai...' : 'Sign in to start'}
            className="flex-grow resize-none py-3 px-1 text-lg focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: 'transparent', color: 'var(--on-surface)', border: 'none', caretColor: 'var(--violet-bright)' }}
            onKeyDown={handleKeyDown}
            disabled={!isAuthenticated}
            aria-label="Chat message input"
          />

          {/* Send */}
          <button
            type="button"
            className="p-3 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{
              background: isSendDisabled ? 'rgba(255,255,255,0.05)' : 'var(--violet)',
              color: isSendDisabled ? 'var(--text-ghost)' : 'white',
              boxShadow: isSendDisabled ? 'none' : 'var(--shadow-glow)',
              cursor: isSendDisabled ? 'not-allowed' : 'pointer',
              opacity: isSendDisabled ? 0.5 : 1,
            }}
            disabled={isSendDisabled}
            onClick={() => void handleSend()}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 600" }}>arrow_upward</span>
          </button>
        </div>
      </div>

      {/* ── Metadata Row ─────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-6 font-mono text-[11px] tracking-wider" style={{ opacity: 0.4, color: 'var(--text-secondary)' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px]" style={{ color: 'var(--violet-bright)' }}>●</span>
          <span>Model: {currentModelName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attach_file</span>
          <span>{files.length} document{files.length !== 1 ? 's' : ''}</span>
        </div>
        {canUseDatabaseTools && (
          <button type="button" className="flex items-center gap-1.5 transition-opacity hover:opacity-100" onClick={toggleSideWindow} aria-label="Toggle SQL panel">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>database</span>
            <span>{isSideWindowOpen ? 'Hide SQL' : 'SQL Panel'}</span>
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>⌘K</span>
          <span>for commands</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
