import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatDisplay from "./ChatDisplay";
import InputSection from "./InputSection";
import Canvas, { type SqlSideWindowProps } from "./Canvas";
import type { ChatMessage, ConversationSummary } from "../types/chat";
import type { UserProfile, SqlQueryResult, LLMModel } from "../services/chatApi";
import { fetchAvailableModels, setCurrentModel, exportConversationZip } from "../services/chatApi";

/**
 * Layout contract for the main chat surface. Each prop maps to a control in the surrounding shell
 * (sidebar, chat area, SQL side drawer) so that higher-level containers can orchestrate state.
 */
interface MainPanelProps {
  currentView: "chat" | "history";
  onViewChange: (view: "chat" | "history") => void;
  messages: ChatMessage[];
  historyConversations: ConversationSummary[];
  selectedHistoryId: string | null;
  onSelectHistory: (conversationId: string) => void;
  onSendMessage: (
    content: string,
    options?: { documentIds?: string[] }
  ) => Promise<void> | void;
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
}

/**
 * Renders the primary application workspace, wiring together chat history, the live conversation,
 * settings overlay, and optional SQL side tooling. It focuses on presentation while delegating all
 * business logic to callbacks provided via {@link MainPanelProps}.
 */
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
}) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  
  // Model selection state
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);
  const [currentModel, setCurrentModelState] = useState<string>("gemini");
  const [isModelSwitching, setIsModelSwitching] = useState(false);

  // Fetch available models on mount
  useEffect(() => {
    fetchAvailableModels()
      .then((data) => {
        setAvailableModels(data.models);
        setCurrentModelState(data.current);
      })
      .catch((err) => console.error("Failed to fetch models:", err));
  }, []);

  const handleModelChange = async (modelId: string) => {
    if (modelId === currentModel || isModelSwitching) return;
    setIsModelSwitching(true);
    try {
      const result = await setCurrentModel(modelId);
      if (result.success) {
        setCurrentModelState(result.current);
      }
    } catch (err) {
      console.error("Failed to switch model:", err);
    } finally {
      setIsModelSwitching(false);
    }
  };

  // Export conversation as ZIP with all SQL results
  const [isExporting, setIsExporting] = useState(false);
  const handleExportConversation = async () => {
    if (!selectedHistoryId || isExporting) return;
    setIsExporting(true);
    try {
      // Gather SQL results from executed queries
      const sqlResults: { query: string; columns: string[]; rows: Record<string, unknown>[] }[] = [];
      
      if (executedQueries) {
        executedQueries.forEach((result, query) => {
          if (result.type === 'rows' && result.columns && result.rows) {
            // Convert rows array to array of objects
            const rowObjects = result.rows.map((row) => {
              const obj: Record<string, unknown> = {};
              result.columns.forEach((col, idx) => {
                obj[col] = row[idx];
              });
              return obj;
            });
            sqlResults.push({
              query,
              columns: result.columns,
              rows: rowObjects,
            });
          }
        });
      }
      
      await exportConversationZip(Number(selectedHistoryId), sqlResults);
    } catch (err) {
      console.error("Failed to export conversation:", err);
    } finally {
      setIsExporting(false);
      setShowSettingsMenu(false);
    }
  };

  useEffect(() => {
    if (!showSettingsMenu) return;
    // Close the floating settings card when a click lands outside the menu bounds.
    const handleClick = (event: MouseEvent) => {
      if (!settingsRef.current) return;
      if (settingsRef.current.contains(event.target as Node)) return;
      setShowSettingsMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSettingsMenu]);

  const selectedHistory = useMemo(
    () =>
      historyConversations.find(
        (conversation) => conversation.id === selectedHistoryId
      ) ?? null,
    [historyConversations, selectedHistoryId]
  );

  const subtitle = useMemo(() => {
    // Keep the header status text in sync with loading state and the active conversation context.
    if (isChatLoading) {
      return "   •   Axon is thinking…";
    }
    if (selectedHistory) {
      return `   •   Resuming "${selectedHistory.title}"`;
    }
    if (messages.length > 0) {
      return "   •   Continuing your current conversation";
    }
    return "   •   Start a new conversation or revisit one from history";
  }, [isChatLoading, messages.length, selectedHistory]);

  const showLanding = currentView === "chat" && messages.length === 0;

  const handleBack = () => {
    onStartNewChat();
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(30,45,85,0.25),_transparent_65%)] px-6 pb-6 pt-4 dark:bg-[radial-gradient(ellipse_at_top,_rgba(0,100,100,0.25),_transparent_65%)] lg:px-5">
      <header className="relative z-20 backdrop-blur-xl">
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4">
          <motion.button
            type="button"
            onClick={handleBack}
            className={`group/back flex items-center gap-2 rounded-full text-sm font-medium text-white/70 transition ${
              showLanding
                ? "opacity-60 hover:opacity-100"
                : "hover:bg-white/10 hover:text-white"
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
              aria-hidden
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </span>
            <span className="max-w-0 overflow-hidden text-xs uppercase tracking-[0.25em] text-white/60 opacity-0 transition-all duration-300 group-hover/back:max-w-[80px] group-hover/back:opacity-100">
              Back
            </span>
          </motion.button>

          <div className="flex flex-col items-center justify-center text-center text-white">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Axon Copilot
            </span>
            <span className="text-sm text-white/60">{subtitle}</span>
          </div>

          <div className="relative" ref={settingsRef}>
            <motion.button
              type="button"
              className="group/settings flex items-center gap-2 rounded-full text-sm font-medium text-white/70 transition hover:text-white"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowSettingsMenu((prev) => !prev)}
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
                aria-hidden
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </span>
              <span className="max-w-0 overflow-hidden text-xs uppercase tracking-[0.25em] text-white/60 opacity-0 transition-all duration-300 group-hover/settings:max-w-[100px] group-hover/settings:opacity-100">
                Settings
              </span>
            </motion.button>

            <AnimatePresence>
              {showSettingsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-white/10 bg-[#0b1220]/95 p-3 text-sm text-white/80 shadow-lg backdrop-blur"
                >
                  <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/40">
                    Account
                  </p>
                  {isAuthenticated ? (
                    <>
                      <div className="flex w-full flex-col gap-1 rounded-xl bg-white/5 px-3 py-2 text-left text-xs text-white/70">
                        <span className="text-[10px] uppercase text-white/40">
                          Signed in as
                        </span>
                        <span className="text-sm font-medium text-white">
                          {currentUser?.name ?? currentUser?.email}
                        </span>
                        <span className="text-xs text-white/50">
                          {currentUser?.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          void onSignOut();
                        }}
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onOpenAuthModal("signin");
                        }}
                      >
                        Sign in
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onOpenAuthModal("signup");
                        }}
                      >
                        Create account
                      </button>
                    </>
                  )}
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/40">
                      AI Model
                    </p>
                    <div className="flex flex-col gap-1">
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          disabled={!model.available || isModelSwitching}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                            currentModel === model.id
                              ? "bg-blue-500/20 text-blue-300"
                              : model.available
                              ? "hover:bg-white/10 hover:text-white"
                              : "cursor-not-allowed opacity-40"
                          }`}
                          onClick={() => handleModelChange(model.id)}
                        >
                          <span className="flex items-center gap-2">
                            {model.name}
                            {model.isDefault && (
                              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase text-white/50">
                                Default
                              </span>
                            )}
                          </span>
                          {currentModel === model.id && (
                            <svg
                              className="h-4 w-4 text-blue-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          {!model.available && (
                            <span className="text-[10px] uppercase text-white/40">
                              No API Key
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/40">
                      Appearance
                    </p>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white"
                      onClick={() => {
                        setShowSettingsMenu(false);
                        onStartNewChat();
                      }}
                    >
                      Reset workspace
                      <span className="text-[10px] uppercase text-white/40">
                        Clear
                      </span>
                    </button>
                    {isAuthenticated ? null : (
                      <button
                        type="button"
                        className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onOpenAuthModal("signin");
                        }}
                      >
                        Unlock more
                        <span className="text-[10px] uppercase text-white/40">
                          Sign in
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white"
                      onClick={() => setShowSettingsMenu(false)}
                    >
                      Theme
                      <span className="text-[10px] uppercase text-white/40">
                        Auto
                      </span>
                    </button>
                  </div>
                  {isAuthenticated && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/40">
                        Data
                      </p>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setShowSettingsMenu(false);
                          onOpenDatabaseSettings();
                        }}
                      >
                        Database
                        <span className="text-[10px] uppercase text-white/40">
                          {databaseSummary}
                        </span>
                      </button>
                      {selectedHistoryId && messages.length > 0 && (
                        <button
                          type="button"
                          disabled={isExporting}
                          className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                          onClick={handleExportConversation}
                        >
                          <span className="flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export All
                          </span>
                          <span className="text-[10px] uppercase text-white/40">
                            {isExporting ? "..." : "ZIP"}
                          </span>
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

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Canvas sideWindow={sideWindow}>
          <div className="flex min-h-0 flex-1 min-w-0 overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
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
