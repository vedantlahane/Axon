import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { deleteDocument, uploadDocument, type UploadedDocument, type LLMModel } from '../../services/chatApi';

interface FileTile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'uploaded' | 'error';
  document?: UploadedDocument;
  error?: string;
}

interface InputSectionProps {
  onSend: (message: string, options?: { documentIds?: string[] }) => Promise<void> | void;
  isHistoryActive: boolean;
  isSending?: boolean;
  isAuthenticated: boolean;
  onRequireAuth: (mode: 'signin' | 'signup') => void;
  onOpenDatabaseSettings: () => void;
  databaseSummary: string;
  onToggleSideWindow: () => void;
  isSideWindowOpen: boolean;
  canUseDatabaseTools: boolean;
  availableModels?: LLMModel[];
  currentModel?: string;
  onModelChange?: (modelId: string) => void;
  isModelSwitching?: boolean;
}

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const InputSection: React.FC<InputSectionProps> = ({
  onSend,
  isHistoryActive,
  isSending = false,
  isAuthenticated,
  onRequireAuth,
  onOpenDatabaseSettings: _onOpenDatabaseSettings,
  databaseSummary: _databaseSummary,
  onToggleSideWindow,
  isSideWindowOpen,
  canUseDatabaseTools,
  availableModels = [],
  currentModel,
  onModelChange: _onModelChange,
  isModelSwitching: _isModelSwitching = false,
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<FileTile[]>([]);
  // Voice capture disabled in refactored architecture
  // const [isRecording, setIsRecording] = useState(false);
  // const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const previewsRef = useRef(new Map<string, string>());
  // const recognitionRef = useRef<SpeechRecognition | null>(null);

  const revokePreview = useCallback((id: string) => {
    const url = previewsRef.current.get(id);
    if (url) { URL.revokeObjectURL(url); previewsRef.current.delete(id); }
  }, []);

  useEffect(() => {
    const previews = previewsRef.current;
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      previews.clear();
    };
  }, []);

  useEffect(() => { const el = messageInputRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 200)}px`; }, [message]);

  useEffect(() => {
    if (!isHistoryActive || files.length === 0) return;
    files.forEach((tile) => { revokePreview(tile.id); if (tile.document) void deleteDocument(tile.document.id); });
    setFiles([]);
  }, [files, isHistoryActive, revokePreview]);

  /* Speech recognition disabled in refactored architecture
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const speechWindow = window as unknown as SpeechRecognitionWindow;
    const Ctor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = true; recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
  }, []);
  */

  const uploadedFileIds = useMemo(() => files.filter((t) => t.status === 'uploaded' && t.document).map((t) => t.document!.id), [files]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    if (files.some((t) => t.status === 'uploading')) return;
    if (!isAuthenticated) { onRequireAuth('signin'); return; }
    const currentFiles = [...files];
    setMessage(''); setSendError(null);
    try {
      const result = onSend(trimmed, { documentIds: uploadedFileIds });
      if (result instanceof Promise) await result;
    } catch (error) {
      setMessage(trimmed);
      setSendError(error instanceof Error ? error.message : 'Failed to send.');
      setTimeout(() => setSendError(null), 5000);
      return;
    } finally { currentFiles.forEach((t) => revokePreview(t.id)); setFiles([]); }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) { event.target.value = ''; return; }
    if (!isAuthenticated) { event.target.value = ''; onRequireAuth('signup'); return; }
    if (files.length + selectedFiles.length > 10) { setSendError('Max 10 files.'); setTimeout(() => setSendError(null), 4000); event.target.value = ''; return; }
    selectedFiles.forEach((file, index) => {
      const id = `${file.name}-${Date.now()}-${index}`;
      let preview: string | undefined;
      if (file.type.startsWith('image/')) { preview = URL.createObjectURL(file); previewsRef.current.set(id, preview); }
      setFiles((prev) => [...prev, { id, file, preview, status: 'uploading' }]);
      uploadDocument(file)
        .then((document) => setFiles((prev) => prev.map((t) => t.id === id ? { ...t, status: 'uploaded', document } : t)))
        .catch(() => setFiles((prev) => prev.map((t) => t.id === id ? { ...t, status: 'error', error: 'Upload failed' } : t)));
    });
    event.target.value = '';
  };

  const removeFile = (id: string) => { const tile = files.find((e) => e.id === id); revokePreview(id); setFiles((prev) => prev.filter((e) => e.id !== id)); if (tile?.document) void deleteDocument(tile.document.id); };

  // Voice capture disabled in refactored architecture
  // const handleVoiceCapture = () => { ... };

  const hasUploadingFiles = files.some((t) => t.status === 'uploading');
  const canSend = message.trim().length > 0;
  const isSendDisabled = isHistoryActive || isSending || hasUploadingFiles || !canSend || !isAuthenticated;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isSendDisabled) void handleSend(); }
  };

  const currentModelName = availableModels.find((m) => m.id === currentModel)?.name?.split(' ')[0] || 'Gemini';

  return (
    <>
      {/* ── Fixed Bottom Shell — Stitch Monolith Input ─────────────── */}
      <div className="fixed bottom-0 left-0 right-0 w-full z-50 px-4 flex flex-col items-center">
        {/* Error */}
        <AnimatePresence>
          {sendError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-3 flex w-full max-w-[780px] items-center gap-2 rounded-xl px-4 py-2 text-xs" style={{ background: 'rgba(255,180,171,0.1)', color: 'var(--error)', border: '1px solid rgba(255,180,171,0.15)' }}>
              <span className="material-symbols-outlined text-sm">error</span>
              <span className="flex-1">{sendError}</span>
              <button type="button" onClick={() => setSendError(null)} style={{ opacity: 0.6 }}><span className="material-symbols-outlined text-sm">close</span></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File tiles */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div className="mb-3 flex gap-2 overflow-x-auto w-full max-w-[780px]" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {files.map((tile) => (
                <div key={tile.id} className="liquid-glass rounded-xl p-3 min-w-[140px] max-w-[160px] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-medium text-white" title={tile.file.name}>{tile.file.name}</p>
                    <button type="button" className="text-slate-500 hover:text-white transition-colors" onClick={() => removeFile(tile.id)}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span></button>
                  </div>
                  <span className="text-[10px]" style={{ color: tile.status === 'error' ? 'var(--error)' : tile.status === 'uploading' ? '#fbbf24' : '#4ade80' }}>
                    {tile.status === 'uploading' ? 'Uploading…' : tile.status === 'uploaded' ? `Ready · ${formatFileSize(tile.file.size)}` : tile.error ?? 'Failed'}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── The Monolith — light-leak + liquid-glass input ─────── */}
        <div className="w-full max-w-[780px] mb-4 relative group">
          {/* Light Leak Top Edge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] opacity-50 z-10" style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }} />

          <div className="liquid-glass rounded-2xl p-2 flex items-end gap-2 shadow-2xl">
            {/* Add / Attach */}
            <button
              type="button"
              className="p-3 transition-colors flex items-center justify-center"
              style={{ color: 'rgb(100,116,139)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgb(100,116,139)')}
              onClick={() => { if (!isAuthenticated) { onRequireAuth('signup'); return; } fileInputRef.current?.click(); }}
              disabled={isHistoryActive || isSending}
            >
              <span className="material-symbols-outlined">add</span>
            </button>

            <input ref={fileInputRef} type="file" multiple accept=".pdf,application/pdf" onChange={handleFileUpload} className="sr-only" />

            {/* Textarea */}
            <textarea
              ref={messageInputRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isHistoryActive ? 'Library view is read-only.' : isSending ? 'Thinking…' : hasUploadingFiles ? 'Uploading files…' : isAuthenticated ? 'Message axon ai...' : 'Sign in to start'}
              className="flex-grow resize-none py-3 px-1 text-lg focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'transparent', color: 'var(--on-surface)', border: 'none', caretColor: '#a78bfa' }}
              onKeyDown={handleKeyDown}
              disabled={isHistoryActive || !isAuthenticated}
              aria-label="Chat message"
            />

            {/* Send */}
            <button
              type="button"
              className="p-3 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{
                background: isSendDisabled ? 'rgba(255,255,255,0.05)' : 'var(--primary-container)',
                color: isSendDisabled ? 'rgb(100,116,139)' : 'white',
                boxShadow: isSendDisabled ? 'none' : '0 0 15px var(--violet-glow)',
                cursor: isSendDisabled ? 'not-allowed' : 'pointer',
                opacity: isSendDisabled ? 0.5 : 1,
              }}
              disabled={isSendDisabled}
              onClick={() => void handleSend()}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 600" }}>arrow_upward</span>
            </button>
          </div>
        </div>

        {/* ── Metadata Row — Stitch pattern ─────────────────────── */}
        <div className="mb-8 flex items-center gap-6 font-mono text-[11px] tracking-wider" style={{ opacity: 0.4, color: 'rgb(148,163,184)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px]" style={{ color: 'var(--primary-container)' }}>●</span>
            <span>Model: {currentModelName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>attach_file</span>
            <span>{files.length} document{files.length !== 1 ? 's' : ''}</span>
          </div>
          {canUseDatabaseTools && (
            <button type="button" className="flex items-center gap-1.5 transition-opacity hover:opacity-100" onClick={onToggleSideWindow}>
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
    </>
  );
};

export default InputSection;
