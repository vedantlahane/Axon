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
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1829] to-[#0b1220] text-white shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]/20 text-[#2563eb]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold">Database Connection</h2>
                  <p className="text-xs text-white/50">Configure your SQL database</p>
                </div>
              </div>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
                onClick={onClose}
                disabled={isBusy}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Connection Status */}
            {hasCustomConfig && (
              <div className="flex items-center gap-2 border-b border-white/10 bg-emerald-500/5 px-6 py-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300/80">
                  Connected{config?.label ? ` — ${config.label}` : config?.displayName ? ` — ${config.displayName}` : ''}
                </span>
              </div>
            )}

            {guidanceMessage && (
              <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-xs leading-relaxed text-amber-200/80">{guidanceMessage}</p>
              </div>
            )}

            <form className="p-6 space-y-5" onSubmit={handleSave}>
              {/* Mode Selection - Tab Style */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-white/50">Connection Type</span>
                <div className="flex gap-1 rounded-xl bg-white/5 p-1">
                  {modes.map((option) => {
                    const active = mode === option;
                    const icons: Record<DatabaseMode, React.ReactNode> = {
                      sqlite: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      ),
                      url: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                      ),
                    };
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                          active
                            ? 'bg-[#2563eb] text-white shadow-md'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => {
                          if (!disableInteractions) {
                            setMode(option);
                          }
                        }}
                        disabled={disableInteractions}
                      >
                        {icons[option]}
                        <span>{option === 'sqlite' ? 'SQLite File' : 'Remote URL'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50" htmlFor="db-display-name">
                  Display Name <span className="text-white/30">(optional)</span>
                </label>
                <input
                  id="db-display-name"
                  type="text"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30 disabled:opacity-60"
                  placeholder="e.g. Production Database"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  disabled={disableInteractions}
                />
              </div>

              {!isRemote && (
                <div className="space-y-3">
                  <span className="text-xs font-medium text-white/50">SQLite Database</span>
                  
                  {/* File Upload Card */}
                  <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 transition hover:border-white/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="cursor-pointer">
                          <p className="text-sm font-medium text-white/80 truncate">
                            {uploadedFile ? uploadedFile.name : 'Upload database file'}
                          </p>
                          <p className="text-xs text-white/40">
                            {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : '.db, .sqlite, or .sqlite3'}
                          </p>
                          <input
                            type="file"
                            accept=".db,.sqlite,.sqlite3"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={disableInteractions}
                          />
                        </label>
                      </div>
                      {uploadedFile && (
                        <button
                          type="button"
                          className="flex-shrink-0 rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
                          onClick={handleFileUpload}
                          disabled={disableInteractions}
                        >
                          Upload
                        </button>
                      )}
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <div 
                          className="h-full bg-[#2563eb] transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs text-white/30">or</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* Manual Path */}
                  <div className="space-y-2">
                    <label className="text-xs text-white/50" htmlFor="db-sqlite-path">
                      Server file path
                    </label>
                    <input
                      id="db-sqlite-path"
                      type="text"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30 disabled:opacity-60 font-mono"
                      placeholder="backend/db.sqlite3"
                      value={sqlitePath}
                      onChange={(event) => setSqlitePath(event.target.value)}
                      disabled={disableInteractions}
                      autoComplete="off"
                    />
                    {config?.resolvedSqlitePath && (
                      <p className="flex items-center gap-1.5 text-xs text-white/40">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                        Resolved: <span className="font-mono">{config.resolvedSqlitePath}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isRemote && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/50" htmlFor="db-connection-string">
                    Connection String
                  </label>
                  <textarea
                    id="db-connection-string"
                    className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/30 disabled:opacity-60 font-mono"
                    placeholder="postgresql+psycopg2://user:password@host:5432/database"
                    value={connectionString}
                    onChange={(event) => setConnectionString(event.target.value)}
                    disabled={disableInteractions}
                  />
                  <p className="text-xs text-white/40">
                    SQLAlchemy-compatible connection string for PostgreSQL, MySQL, or other databases.
                  </p>
                </div>
              )}

              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                    feedback.status === 'success'
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {feedback.status === 'success' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  )}
                  {feedback.message}
                </motion.div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                {hasCustomConfig ? (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40"
                    onClick={handleDisconnect}
                    disabled={disableInteractions}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                      <line x1="12" y1="2" x2="12" y2="12"/>
                    </svg>
                    Disconnect
                  </button>
                ) : (
                  <div />
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    onClick={handleTest}
                    disabled={!canSubmit || disableInteractions}
                  >
                    Test
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#2563eb]/25 transition hover:bg-[#1d4ed8] disabled:opacity-50 disabled:shadow-none"
                    disabled={!canSubmit || disableInteractions}
                  >
                    Save Connection
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-white/40">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Loading configuration…
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DatabaseConnectionModal;
