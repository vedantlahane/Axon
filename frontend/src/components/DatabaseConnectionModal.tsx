import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  DatabaseConnectionSettings,
  DatabaseMode,
  UpdateDatabaseConnectionPayload,
} from '../services/chatApi';

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConnectionSettings | null;
  availableModes: DatabaseMode[];
  environmentFallback: DatabaseConnectionSettings | null;
  onSave: (payload: UpdateDatabaseConnectionPayload) => Promise<void> | void;
  onTest: (payload: UpdateDatabaseConnectionPayload) => Promise<void> | void;
  onDisconnect: () => Promise<void> | void;
  isBusy: boolean;
  isLoading: boolean;
  feedback: { status: 'success' | 'error'; message: string } | null;
}

const DEFAULT_MODES: DatabaseMode[] = ['sqlite', 'url'];
const MODE_LABELS: Record<DatabaseMode, string> = {
  sqlite: 'Local SQLite file',
  url: 'Remote connection string',
};

const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  config,
  availableModes,
  environmentFallback,
  onSave,
  onTest,
  onDisconnect,
  isBusy,
  isLoading,
  feedback,
}) => {
  const [mode, setMode] = useState<DatabaseMode>('sqlite');
  const [displayName, setDisplayName] = useState('');
  const [sqlitePath, setSqlitePath] = useState('');
  const [connectionString, setConnectionString] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setMode(config?.mode ?? 'sqlite');
    setDisplayName(config?.displayName ?? '');
    setSqlitePath(config?.sqlitePath ?? config?.resolvedSqlitePath ?? '');
    setConnectionString(config?.connectionString ?? '');
  }, [isOpen, config]);

  const modes = useMemo<DatabaseMode[]>(
    () => (availableModes.length > 0 ? availableModes : DEFAULT_MODES),
    [availableModes],
  );

  const trimmedDisplayName = displayName.trim();
  const trimmedSqlitePath = sqlitePath.trim();
  const trimmedConnectionString = connectionString.trim();
  const isRemote = mode === 'url';
  const canSubmit = isRemote ? trimmedConnectionString.length > 0 : trimmedSqlitePath.length > 0;
  const disableInteractions = isBusy || isLoading;
  const environmentManaged = config?.source === 'environment';
  const hasCustomConfig = Boolean(config);

  const guidanceMessage = (() => {
    if (environmentManaged && config?.isDefault) {
      return "The application is currently using the server's environment configuration. You can override it here for your account.";
    }
    if (!hasCustomConfig && environmentFallback) {
      return `Environment default available: ${environmentFallback.label}. Save here to override for your account.`;
    }
    if (!hasCustomConfig) {
      return 'No database connected. Provide connection details below to enable SQL queries.';
    }
    return null;
  })();

  const buildPayload = (extra?: Partial<UpdateDatabaseConnectionPayload>): UpdateDatabaseConnectionPayload => ({
    mode,
    displayName: trimmedDisplayName || undefined,
    sqlitePath: !isRemote ? trimmedSqlitePath || undefined : undefined,
    connectionString: isRemote ? trimmedConnectionString || undefined : undefined,
    ...extra,
  });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || disableInteractions) {
      return;
    }
    await Promise.resolve(onSave(buildPayload()));
  };

  const handleTest = async () => {
    if (!canSubmit || disableInteractions) {
      return;
    }
    await Promise.resolve(onTest(buildPayload()));
  };

  const handleDisconnect = async () => {
    await Promise.resolve(onDisconnect());
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate it's a SQLite file
      if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
        alert('Please select a valid SQLite database file (.db, .sqlite, or .sqlite3)');
        return;
      }
      setUploadedFile(file);
      // Auto-fill the path with the uploaded filename
      setSqlitePath(`uploaded_databases/${file.name}`);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) return;

    const formData = new FormData();
    formData.append('database', uploadedFile);

    try {
      setUploadProgress(0);
      const response = await fetch('/api/database/upload/', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadProgress(100);
      setSqlitePath(data.path);
      
      // Show success feedback
      alert('Database uploaded successfully! Click "Save connection" to use it.');
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="database-modal"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1220]/95 p-6 text-white shadow-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:text-white"
              onClick={onClose}
              disabled={isBusy}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-lg font-semibold">Database connection</h2>
            <p className="mt-1 text-sm text-white/60">
              Choose how Axon connects to your SQL database. Use a local SQLite file or a hosted connection string.
            </p>

            {guidanceMessage && (
              <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">
                {guidanceMessage}
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSave}>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.25em] text-white/40">Mode</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {modes.map((option) => {
                    const active = mode === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          active
                            ? 'border-[#2563eb] bg-[#2563eb]/20 text-white'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                        onClick={() => {
                          if (!disableInteractions) {
                            setMode(option);
                          }
                        }}
                        disabled={disableInteractions}
                      >
                        <span className="block font-medium">{MODE_LABELS[option]}</span>
                        <span className="mt-1 block text-xs text-white/40">
                          {option === 'sqlite'
                            ? 'Provide a path to a SQLite database file.'
                            : 'Paste a full SQLAlchemy-compatible connection string.'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-[0.25em] text-white/40" htmlFor="db-display-name">
                  Display name (optional)
                </label>
                <input
                  id="db-display-name"
                  type="text"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/40 disabled:opacity-60"
                  placeholder="e.g. Production Postgres"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  disabled={disableInteractions}
                />
              </div>

              {!isRemote && (
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.25em] text-white/40">
                    SQLite Database
                  </label>
                  
                  {/* File Upload Option */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/60 mb-3">Upload from your computer:</p>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:bg-white/10">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span>{uploadedFile ? uploadedFile.name : 'Choose file...'}</span>
                        </div>
                        <input
                          type="file"
                          accept=".db,.sqlite,.sqlite3"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={disableInteractions}
                        />
                      </label>
                      {uploadedFile && (
                        <button
                          type="button"
                          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:opacity-50"
                          onClick={handleFileUpload}
                          disabled={disableInteractions}
                        >
                          Upload
                        </button>
                      )}
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <div 
                            className="h-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Path Option */}
                  <div>
                    <label className="block text-xs text-white/60 mb-2" htmlFor="db-sqlite-path">
                      Or enter server path manually:
                    </label>
                    <input
                      id="db-sqlite-path"
                      type="text"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/40 disabled:opacity-60"
                      placeholder="backend/db.sqlite3"
                      value={sqlitePath}
                      onChange={(event) => setSqlitePath(event.target.value)}
                      disabled={disableInteractions}
                      autoComplete="off"
                    />
                    {config?.resolvedSqlitePath && (
                      <p className="text-xs text-white/40 mt-2">Resolved path: {config.resolvedSqlitePath}</p>
                    )}
                  </div>
                </div>
              )}

              {isRemote && (
                <div className="space-y-3">
                  <label className="block text-xs uppercase tracking-[0.25em] text-white/40" htmlFor="db-connection-string">
                    Connection string
                  </label>
                  <textarea
                    id="db-connection-string"
                    className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/40 disabled:opacity-60"
                    placeholder="postgresql+psycopg2://user:password@host:5432/database"
                    value={connectionString}
                    onChange={(event) => setConnectionString(event.target.value)}
                    disabled={disableInteractions}
                  />
                </div>
              )}

              {feedback && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    feedback.status === 'success'
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
                      : 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-50"
                    onClick={handleTest}
                    disabled={!canSubmit || disableInteractions}
                  >
                    Test connection
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1d4ed8] disabled:opacity-50"
                    disabled={!canSubmit || disableInteractions}
                  >
                    Save connection
                  </button>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-rose-300 transition hover:border-rose-400/60 hover:text-rose-200 disabled:opacity-40"
                  onClick={handleDisconnect}
                  disabled={disableInteractions || !hasCustomConfig}
                >
                  Disconnect
                </button>
              </div>

              {isLoading && (
                <p className="text-xs text-white/40">Loading current configuration…</p>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DatabaseConnectionModal;
