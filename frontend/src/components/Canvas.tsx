import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SchemaDiagram from "./SchemaDiagram";
import type { SqlQueryResult, SqlQuerySuggestion } from "../services/chatApi";
import type {
  SqlSideWindowProps,
  SqlQueryHistoryEntry,
  CanvasTab,
  EditorPanel,
} from "./Canvas/types";
import {
  DEFAULT_QUERY_LIMIT,
  QUERY_LIMIT_MIN,
  QUERY_LIMIT_MAX,
  CANVAS_TABS,
  TAB_LABELS,
} from "./Canvas/types";
import { SqlResultsView } from "./Canvas/SqlResultsView";
import { SqlHistoryPanel } from "./Canvas/SqlHistoryPanel";
import { SqlSuggestionsPanel } from "./Canvas/SqlSuggestionsPanel";
import { SqlPendingApprovalPanel } from "./Canvas/SqlPendingApprovalPanel";

// Re-export types for backward compatibility
export type { SqlQueryHistoryEntry, PendingQuery, SqlSideWindowProps } from "./Canvas";

interface CanvasProps {
  children: React.ReactNode;
  sideWindow: SqlSideWindowProps;
}

const Canvas: React.FC<CanvasProps> = ({ children, sideWindow }) => {
  const {
    isOpen,
    onCollapse,
    connectionSummary,
    schema,
    isSchemaLoading,
    onRefreshSchema,
    onExecuteQuery,
    isExecuting,
    history,
    errorMessage,
    onRequestSuggestions,
    isSuggesting,
    suggestions,
    suggestionsError,
    suggestionAnalysis,
    queryText,
    onChangeQuery,
    pendingQuery,
    onApprovePendingQuery,
    onRejectPendingQuery,
    autoExecuteEnabled,
    onToggleAutoExecute,
    latestAutoResult,
  } = sideWindow;

  const [queryLimit, setQueryLimit] = useState<number>(DEFAULT_QUERY_LIMIT);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CanvasTab>("editor");
  const [editorPanel, setEditorPanel] = useState<EditorPanel>("suggestions");
  const [isSchemaFullscreen, setIsSchemaFullscreen] = useState(false);
  const [hideEditor, setHideEditor] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<SqlQueryHistoryEntry | null>(null);

  // Switch to pending panel when there's a pending query
  useEffect(() => {
    if (pendingQuery && !autoExecuteEnabled) {
      setEditorPanel("pending");
      setActiveTab("editor");
      setHideEditor(false); // Ensure editor is visible so user can see the query
    }
  }, [pendingQuery, autoExecuteEnabled]);

  // Display auto-executed results
  useEffect(() => {
    if (latestAutoResult) {
      setResult(latestAutoResult);
      setActiveTab("results");
    }
  }, [latestAutoResult]);

  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setLocalError(null);
      setActiveTab("editor");
      setEditorPanel("suggestions");
      setQueryLimit(DEFAULT_QUERY_LIMIT);
      setIsSchemaFullscreen(false);
      setHideEditor(false);
      setSelectedHistoryEntry(null);
      return;
    }
  }, [isOpen]);

  const handleRunQuery = useCallback(async () => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setLocalError("Provide a SQL query to run.");
      setResult(null);
      return;
    }

    setLocalError(null);

    try {
      const executionResult = await onExecuteQuery(trimmed, queryLimit);
      setResult(executionResult);
      setActiveTab("results");
    } catch (error) {
      setResult(null);
      if (error instanceof Error && error.message) {
        setLocalError(error.message);
      } else {
        setLocalError("Unable to execute SQL query.");
      }
    }
  }, [onExecuteQuery, queryLimit, queryText]);

  const handleSuggestionRequest = useCallback(async () => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setLocalError("Provide a SQL query before requesting suggestions.");
      return;
    }

    setLocalError(null);
    setEditorPanel("suggestions");
    try {
      await onRequestSuggestions(trimmed, { includeSchema: true });
    } catch (error) {
      if (error instanceof Error && error.message) {
        setLocalError(error.message);
      } else {
        setLocalError("Unable to generate SQL suggestions.");
      }
    }
  }, [onRequestSuggestions, queryText]);

  const handleHistorySelect = useCallback(
    (entry: SqlQueryHistoryEntry) => {
      onChangeQuery(entry.query);
      setSelectedHistoryEntry(entry);
      if (entry.result) {
        setResult(entry.result);
        setActiveTab("results");
      } else {
        setEditorPanel("history");
        setActiveTab("editor");
      }
    },
    [onChangeQuery]
  );

  const handleViewHistoryResult = useCallback(
    (entry: SqlQueryHistoryEntry) => {
      if (entry.result) {
        setSelectedHistoryEntry(entry);
        setResult(entry.result);
        setActiveTab("results");
      }
    },
    []
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: SqlQuerySuggestion) => {
      onChangeQuery(suggestion.query);
      setEditorPanel("suggestions");
      setActiveTab("editor");
    },
    [onChangeQuery]
  );

  const combinedQueryError = useMemo(
    () => localError ?? errorMessage ?? null,
    [errorMessage, localError]
  );

  const resultSummary = useMemo(() => {
    if (!result) {
      return "Run a SQL query to see results.";
    }

    const base =
      result.type === "rows"
        ? `${result.rowCount} row${result.rowCount === 1 ? "" : "s"}`
        : result.message;
    return `${base} • ${result.executionTimeMs}ms`;
  }, [result]);

  const renderEditorSupportingPanel = () => {
    if (editorPanel === "pending") {
      return (
        <SqlPendingApprovalPanel
          pendingQuery={pendingQuery}
          isExecuting={isExecuting}
          onApprove={() => {
            if (pendingQuery) {
              onChangeQuery(pendingQuery.query);
              onApprovePendingQuery();
            }
          }}
          onEdit={(query) => {
            onChangeQuery(query);
            setEditorPanel("suggestions");
          }}
          onReject={onRejectPendingQuery}
        />
      );
    }

    if (editorPanel === "history") {
      return (
        <SqlHistoryPanel
          history={history}
          onSelectHistory={handleHistorySelect}
          onViewResult={handleViewHistoryResult}
        />
      );
    }

    return (
      <SqlSuggestionsPanel
        suggestions={suggestions}
        suggestionAnalysis={suggestionAnalysis}
        suggestionsError={suggestionsError}
        onSelectSuggestion={handleSuggestionSelect}
      />
    );
  };

  const renderActiveTab = () => {
    if (activeTab === "schema") {
      return (
        <section className="flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">
              Schema
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">
                {schema
                  ? schema.connection.label
                  : isSchemaLoading
                  ? "Loading…"
                  : "Unavailable"}
              </span>
              {schema && (
                <button
                  type="button"
                  onClick={() => setIsSchemaFullscreen(true)}
                  className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                  aria-label="View schema fullscreen"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              )}
            </div>
          </header>
          {isSchemaLoading ? (
            <div className="grid h-32 place-items-center rounded-xl border border-white/10 bg-white/5 text-sm text-white/60">
              Loading schema…
            </div>
          ) : (
            <SchemaDiagram schema={schema} />
          )}
        </section>
      );
    }

    if (activeTab === "results") {
      return (
        <section className="flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                Results
              </span>
              {selectedHistoryEntry && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                  Historical
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">{resultSummary}</span>
              {selectedHistoryEntry && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHistoryEntry(null);
                    setResult(null);
                  }}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </header>
          {selectedHistoryEntry && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-xs text-amber-200/80">
              <span className="font-medium">Query: </span>
              <span className="font-mono text-[11px]">{selectedHistoryEntry.query.slice(0, 80)}{selectedHistoryEntry.query.length > 80 && '...'}</span>
              <span className="ml-2 text-[10px] text-amber-200/60">
                ({formatExecutionTimestamp(selectedHistoryEntry.executedAt)})
              </span>
            </div>
          )}
          {isExecuting ? (
            <div className="grid h-32 place-items-center rounded-xl border border-white/10 bg-white/5 text-sm text-white/60">
              Running query…
            </div>
          ) : (
            <SqlResultsView result={result} />
          )}
        </section>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {/* Editor Header with controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">SQL Editor</h3>
            <div className="h-4 w-px bg-white/10" />
            <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer group">
              <div 
                className={`relative w-8 h-4 rounded-full transition-all ${
                  autoExecuteEnabled ? 'bg-blue-500' : 'bg-white/15'
                }`}
                onClick={onToggleAutoExecute}
              >
                <div 
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                    autoExecuteEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="group-hover:text-white/70 transition">Auto-run</span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => setHideEditor(!hideEditor)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-white/40 hover:text-white/70 rounded-md hover:bg-white/5 transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {hideEditor ? (
                <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
              ) : (
                <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
              )}
            </svg>
            {hideEditor ? 'Show' : 'Hide'}
          </button>
        </div>

        {/* Editor section - conditionally hidden */}
        <AnimatePresence mode="wait">
        {!hideEditor && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {/* SQL Textarea with line numbers feel */}
            <div className="relative rounded-xl border border-white/10 bg-[#060a14] overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-white/[0.02] border-r border-white/5 flex flex-col items-center pt-3 text-[10px] text-white/20 font-mono select-none">
                {Array.from({ length: Math.max(5, queryText.split('\n').length) }, (_, i) => (
                  <span key={i} className="leading-5">{i + 1}</span>
                ))}
              </div>
              <textarea
                id="sql-editor"
                value={queryText}
                onChange={(event) => onChangeQuery(event.target.value)}
                spellCheck={false}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.shiftKey) {
                    event.preventDefault();
                    void handleRunQuery();
                  }
                }}
                className="w-full min-h-[140px] pl-12 pr-4 py-3 bg-transparent font-mono text-sm text-white/85 leading-5 resize-none focus:outline-none placeholder:text-white/25"
                placeholder="SELECT * FROM users LIMIT 10;"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRunQuery()}
                  disabled={isExecuting}
                  className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3b82f6] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {isExecuting ? "Running…" : "Run"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSuggestionRequest()}
                  disabled={isSuggesting}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                  {isSuggesting ? "..." : "AI"}
                </button>
                <button
                  type="button"
                  onClick={() => void onRefreshSchema()}
                  disabled={isSchemaLoading}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                  title="Refresh schema"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-3 text-[11px] text-white/40">
                <label htmlFor="sql-limit" className="flex items-center gap-1.5">
                  <span>Limit</span>
                  <input
                    id="sql-limit"
                    type="number"
                    min={QUERY_LIMIT_MIN}
                    max={QUERY_LIMIT_MAX}
                    value={queryLimit}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10);
                      if (Number.isNaN(parsed)) {
                        setQueryLimit(DEFAULT_QUERY_LIMIT);
                        return;
                      }
                      const bounded = Math.min(QUERY_LIMIT_MAX, Math.max(QUERY_LIMIT_MIN, parsed));
                      setQueryLimit(bounded);
                    }}
                    className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-right text-[11px] text-white/70 focus:border-blue-500/50 focus:outline-none"
                  />
                </label>
                <span className="hidden md:flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">⇧</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">↵</kbd>
                </span>
              </div>
            </div>

            {/* Error display */}
            {combinedQueryError && (
              <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {combinedQueryError}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>

        {/* Tabs for supporting panels */}
        <div className="flex items-center gap-2 border-t border-white/5 pt-4">
          <div className="flex gap-1 rounded-lg bg-white/[0.03] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setEditorPanel("suggestions")}
              className={`rounded-md px-3 py-1.5 transition ${
                editorPanel === "suggestions"
                  ? "bg-blue-500/20 text-blue-300 font-medium"
                  : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              Suggestions
            </button>
            <button
              type="button"
              onClick={() => setEditorPanel("history")}
              className={`rounded-md px-3 py-1.5 transition ${
                editorPanel === "history"
                  ? "bg-blue-500/20 text-blue-300 font-medium"
                  : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              History
            </button>
            {pendingQuery && (
              <button
                type="button"
                onClick={() => setEditorPanel("pending")}
                className={`rounded-md px-3 py-1.5 transition flex items-center gap-1.5 ${
                  editorPanel === "pending"
                    ? "bg-amber-500/15 text-amber-300 font-medium"
                    : "text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Pending
              </button>
            )}
          </div>
        </div>

        {/* Supporting panel content */}
        {renderEditorSupportingPanel()}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row py-5 overflow-hidden">
      <div
        className={`flex min-w-0 flex-1 overflow-hidden transition-[flex-basis] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "lg:basis-1/2 lg:max-w-[50%]" : "lg:basis-full lg:max-w-full "
        }`}
      >
        {children}
      </div>
      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            key="canvas-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-w-0 w-full flex-col overflow-hidden rounded-[28px] border-dashed border border-white/10 px-4 text-white shadow-[0_30px_80px_-35px_rgba(37,99,235,0.75)] backdrop-blur-lg lg:basis-1/2 lg:max-w-[50%] lg:w-1/2"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col gap-1">
                <nav className="mt-4 flex gap-2 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
                {(hideEditor ? CANVAS_TABS.filter(t => t !== 'editor') : CANVAS_TABS).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 rounded-lg px-3 py-2 transition ${
                          isActive
                            ? "bg-[#2563eb] text-white shadow-[0_12px_24px_-16px_rgba(37,99,235,0.9)]"
                            : "hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {TAB_LABELS[tab]}
                      </button>
                    );
                  })}
                  {/* Toggle editor visibility */}
                  <button
                    type="button"
                    onClick={() => {
                      setHideEditor(!hideEditor);
                      if (!hideEditor && activeTab === 'editor') {
                        setActiveTab('results');
                      }
                    }}
                    className="rounded-lg px-2 py-2 text-white/40 hover:bg-white/10 hover:text-white transition"
                    title={hideEditor ? "Show Editor" : "Hide Editor"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {hideEditor ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      )}
                    </svg>
                  </button>
                </nav>
                <p className="text-[11px] text-white/40">{connectionSummary}</p>
              </div>
                <button
                  type="button"
                  onClick={onCollapse}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close SQL canvas"
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
              </div>

            

            <div className="flex-1 min-w-0 w-full space-y-5 overflow-y-auto overflow-x-hidden pb-6">
              {renderActiveTab()}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* Fullscreen Schema Modal */}
      <AnimatePresence>
        {isSchemaFullscreen && schema && (
          <motion.div
            key="schema-fullscreen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsSchemaFullscreen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSchemaFullscreen && schema && (
          <motion.div
            key="schema-fullscreen-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white text-slate-900 dark:bg-[#0a0f1a] dark:text-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Database Schema</h2>
                <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/60">
                  {schema.connection.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onRefreshSchema()}
                  disabled={isSchemaLoading}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <polyline points="23 20 23 14 17 14" />
                    <path d="M20.49 9A9 9 0 0 0 4.51 15M3.51 9A9 9 0 0 1 19.49 15" />
                  </svg>
                  {isSchemaLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSchemaFullscreen(false)}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close fullscreen"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-auto p-6">
              <SchemaDiagram schema={schema} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Canvas;
