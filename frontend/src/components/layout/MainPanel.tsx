import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatDisplay from "../chat/ChatDisplay";
import InputSection from "../chat/InputSection";
import Canvas, { type SqlSideWindowProps } from "../Canvas";
import type { ChatMessage, ConversationSummary } from "../../types/chat";
import type { UserProfile, SqlQueryResult, LLMModel } from "../../services/chatApi";
import { fetchAvailableModels, setCurrentModel, exportConversationZip } from "../../services/chatApi";

interface MainPanelProps {
  currentView: "chat" | "history";
  onViewChange: (view: "chat" | "history") => void;
  messages: ChatMessage[];
  historyConversations: ConversationSummary[];
  selectedHistoryId: string | null;
  onSelectHistory: (conversationId: string) => void;
  onSendMessage: (content: string, options?: { documentIds?: string[] }) => Promise<void> | void;
  onStartNewChat: () => void;
  isChatLoading: boolean;
  onDeleteConversation: (conversationId: string) => Promise<void> | void;
  inputSessionKey: string;
  isAuthenticated: boolean;
  currentUser: UserProfile | null;
  onOpenAuthModal: (mode: "signin" | "signup") => void;
  onSignOut: () => Promise<void> | void;
  onOpenDatabaseSettings: () => void;
  databaseSummary: string;
  onToggleSideWindow: () => void;
  isSideWindowOpen: boolean;
  canUseDatabaseTools: boolean;
  sideWindow: SqlSideWindowProps;
  onViewSqlInCanvas?: (sql: string) => void;
  executedQueries?: Map<string, SqlQueryResult>;
  showToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

const MainPanel: React.FC<MainPanelProps> = ({
  currentView,
  onViewChange,
  messages,
  historyConversations,
  selectedHistoryId,
  onSelectHistory,
  onSendMessage,
  onStartNewChat,
  isChatLoading,
  onDeleteConversation,
  inputSessionKey,
  isAuthenticated,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onOpenDatabaseSettings,
  databaseSummary,
  onToggleSideWindow,
  isSideWindowOpen,
  canUseDatabaseTools,
  sideWindow,
  onViewSqlInCanvas,
  executedQueries,
  showToast,
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);
  const [currentModel, setCurrentModelState] = useState<string>("gemini");
  const [isModelSwitching, setIsModelSwitching] = useState(false);
  const [isModelsLoading, setIsModelsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setAvailableModels([]); setCurrentModelState('gemini'); setIsModelsLoading(false); return; }
    setIsModelsLoading(true);
    fetchAvailableModels()
      .then((data) => { setAvailableModels(data.models); setCurrentModelState(data.current); })
      .catch((err) => { console.error("Failed to fetch models:", err); showToast?.('error', 'Failed to load models'); })
      .finally(() => setIsModelsLoading(false));
  }, [isAuthenticated, showToast]);

  const handleModelChange = async (modelId: string) => {
    if (modelId === currentModel || isModelSwitching) return;
    setIsModelSwitching(true);
    try {
      const result = await setCurrentModel(modelId);
      if (result.success) setCurrentModelState(result.current);
    } catch (err) { console.error("Failed to switch model:", err); showToast?.('error', 'Failed to switch model'); }
    finally { setIsModelSwitching(false); }
  };

  const handleExportConversation = async () => {
    if (!selectedHistoryId || isExporting) return;
    setIsExporting(true);
    try {
      const sqlResults: { query: string; columns: string[]; rows: Record<string, unknown>[] }[] = [];
      if (executedQueries) {
        executedQueries.forEach((result, query) => {
          if (result.type === 'rows' && result.columns && result.rows) {
            const rowObjects = result.rows.map((row) => {
              const obj: Record<string, unknown> = {};
              result.columns.forEach((col, idx) => { obj[col] = row[idx]; });
              return obj;
            });
            sqlResults.push({ query, columns: result.columns, rows: rowObjects });
          }
        });
      }
      await exportConversationZip(selectedHistoryId, sqlResults);
    } catch (err) { console.error("Export failed:", err); showToast?.('error', 'Failed to export'); }
    finally { setIsExporting(false); setShowSettingsMenu(false); }
  };

  useEffect(() => {
    if (!showSettingsMenu) return;
    const handleClick = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setShowSettingsMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettingsMenu]);

  // selectedHistory disabled — replaced by Zustand store in new architecture
  // const selectedHistory = useMemo(...)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* ── TopAppBar — Stitch fixed header ──────────────────────── */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-5" style={{ background: 'transparent' }}>
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onStartNewChat}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'var(--primary-container)',
              boxShadow: '0 0 15px var(--violet-glow)',
            }}
          >
            <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              dataset
            </span>
          </div>
          <h1 className="text-xl font-medium tracking-tighter" style={{ color: '#e2e8f0' }}>
            axon ai
          </h1>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-6">
          {/* Search */}
          <button
            className="transition-colors"
            style={{ color: 'rgb(100,116,139)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgb(100,116,139)')}
            onClick={() => onViewChange(currentView === 'history' ? 'chat' : 'history')}
            title={currentView === 'history' ? 'Back to Chat' : 'Library'}
          >
            <span className="material-symbols-outlined">
              {currentView === 'history' ? 'chat_bubble' : 'search'}
            </span>
          </button>

          {/* User Avatar / Settings */}
          <div className="relative" ref={settingsRef}>
            {isAuthenticated ? (
              <button
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'var(--surface-container-high)',
                  color: 'var(--on-secondary-container)',
                }}
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              >
                {(currentUser?.name?.charAt(0) ?? currentUser?.email?.charAt(0) ?? 'A').toUpperCase()}
              </button>
            ) : (
              <button
                className="transition-opacity hover:opacity-80"
                style={{ color: 'rgb(100,116,139)' }}
                onClick={() => onOpenAuthModal('signin')}
              >
                <span className="material-symbols-outlined">account_circle</span>
              </button>
            )}

            {/* Settings dropdown */}
            <AnimatePresence>
              {showSettingsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="liquid-glass absolute right-0 z-50 mt-3 w-60 p-4 text-sm"
                  style={{ borderRadius: 'var(--radius-xl)', color: 'var(--on-surface)', boxShadow: 'var(--shadow-ambient)' }}
                >
                  {/* Account */}
                  <p className="label-meta mb-2" style={{ color: 'rgb(100,116,139)' }}>Account</p>
                  {isAuthenticated ? (
                    <>
                      <div className="rounded-xl p-3 mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="block text-sm font-medium text-white">{currentUser?.name ?? currentUser?.email}</span>
                        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{currentUser?.email}</span>
                      </div>
                      <button type="button" className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--error)' }} onClick={() => { setShowSettingsMenu(false); void onSignOut(); }}>Sign out</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--on-surface-variant)' }} onClick={() => { setShowSettingsMenu(false); onOpenAuthModal("signin"); }}>Sign in</button>
                      <button type="button" className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--on-surface-variant)' }} onClick={() => { setShowSettingsMenu(false); onOpenAuthModal("signup"); }}>Create account</button>
                    </>
                  )}

                  {/* AI Model */}
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="label-meta mb-2" style={{ color: 'rgb(100,116,139)' }}>AI Model</p>
                    {!isAuthenticated ? (
                      <div className="py-2 text-xs" style={{ color: 'var(--on-surface-variant)' }}>Sign in to manage models</div>
                    ) : isModelsLoading ? (
                      <div className="py-3 text-xs text-center" style={{ color: 'var(--on-surface-variant)' }}>Loading…</div>
                    ) : availableModels.map((model) => (
                      <button key={model.id} type="button" disabled={!model.available || isModelSwitching}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: currentModel === model.id ? 'var(--violet, #a78bfa)' : model.available ? 'var(--on-surface-variant)' : 'rgb(100,116,139)', opacity: model.available ? 1 : 0.4, cursor: model.available ? 'pointer' : 'not-allowed', background: currentModel === model.id ? 'var(--violet-soft)' : 'transparent' }}
                        onClick={() => handleModelChange(model.id)}
                      >
                        <span>{model.name}{model.isDefault && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] uppercase" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgb(100,116,139)' }}>Default</span>}</span>
                        {currentModel === model.id && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    ))}
                  </div>

                  {/* Data */}
                  {isAuthenticated && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="label-meta mb-2" style={{ color: 'rgb(100,116,139)' }}>Data</p>
                      <button type="button" className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5" style={{ color: 'var(--on-surface-variant)' }} onClick={() => { setShowSettingsMenu(false); onOpenDatabaseSettings(); }}>
                        Database <span className="label-meta" style={{ color: 'rgb(100,116,139)' }}>{databaseSummary}</span>
                      </button>
                      <button type="button" className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5" style={{ color: 'var(--on-surface-variant)' }} onClick={() => { if (window.confirm('Clear all messages?')) { setShowSettingsMenu(false); onStartNewChat(); } }}>
                        Reset <span className="label-meta" style={{ color: 'rgb(100,116,139)' }}>Clear</span>
                      </button>
                      {selectedHistoryId && messages.length > 0 && (
                        <button type="button" disabled={isExporting} className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5 disabled:opacity-50" style={{ color: 'var(--on-surface-variant)' }} onClick={handleExportConversation}>
                          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">download</span>Export</span>
                          <span className="label-meta" style={{ color: 'rgb(100,116,139)' }}>{isExporting ? '…' : 'ZIP'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Canvas sideWindow={sideWindow}>
          <div className="flex min-h-0 flex-1 min-w-0 overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-hidden">
                <ChatDisplay
                  view={currentView}
                  messages={messages}
                  historyConversations={historyConversations}
                  selectedHistoryId={selectedHistoryId}
                  onSelectHistory={onSelectHistory}
                  onViewChange={onViewChange}
                  onDeleteConversation={onDeleteConversation}
                  isChatLoading={isChatLoading}
                  onViewSqlInCanvas={onViewSqlInCanvas}
                  executedQueries={executedQueries}
                  isAuthenticated={isAuthenticated}
                  onSuggestionClick={(text: string) => void onSendMessage(text)}
                />
              </div>
              <InputSection
                key={inputSessionKey}
                onSend={onSendMessage}
                isHistoryActive={currentView === "history"}
                isSending={isChatLoading}
                isAuthenticated={isAuthenticated}
                onRequireAuth={onOpenAuthModal}
                onOpenDatabaseSettings={onOpenDatabaseSettings}
                databaseSummary={databaseSummary}
                onToggleSideWindow={onToggleSideWindow}
                isSideWindowOpen={isSideWindowOpen}
                canUseDatabaseTools={canUseDatabaseTools}
                availableModels={availableModels}
                currentModel={currentModel}
                onModelChange={handleModelChange}
                isModelSwitching={isModelSwitching}
              />
            </div>
          </div>
        </Canvas>
      </div>
    </div>
  );
};

export default MainPanel;
