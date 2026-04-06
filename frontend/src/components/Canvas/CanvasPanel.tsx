// ─── Canvas Panel ────────────────────────────────────────────────────────────
// SQL IDE slide-out panel: editor, results, schema.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import { AnimatePresence, motion } from 'framer-motion';
import { useDatabaseStore } from '../../stores/databaseStore';
import type { SqlQuerySuggestion, SqlQueryHistoryEntry } from '../../types/database';
import SchemaViewer from './SchemaViewer';
import { SqlResultsView } from './SqlResults';
import { SqlHistoryPanel } from './SqlHistory';
import { SqlSuggestionsPanel } from './SqlSuggestions';
import { SqlPendingApprovalPanel } from './SqlPending';

type CanvasTab = 'editor' | 'results' | 'schema';
type EditorPanel = 'suggestions' | 'history' | 'pending';

const DEFAULT_LIMIT = 100;
const LIMIT_MIN = 1;
const LIMIT_MAX = 10000;

const CanvasPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isSideWindowOpen: isOpen,
    closeSideWindow: onCollapse,
    connection,
    schema,
    isSchemaLoading,
    refreshSchema,
    queryText,
    setQueryText: onChangeQuery,
    executeQuery,
    isExecuting,
    history,
    queryError,
    suggestions,
    suggestionAnalysis,
    isFetchingSuggestions,
    suggestionsError,
    requestSuggestions,
    pendingQuery,
    approvePendingQuery,
    rejectPendingQuery,
    autoExecuteEnabled,
    toggleAutoExecute,
    latestAutoResult,
  } = useDatabaseStore();

  const [queryLimit, setQueryLimit] = useState(DEFAULT_LIMIT);
  const [result, setResult] = useState<ReturnType<typeof useDatabaseStore.getState>['queryResult']>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CanvasTab>('editor');
  const [editorPanel, setEditorPanel] = useState<EditorPanel>('suggestions');
  const [isSchemaFullscreen, setIsSchemaFullscreen] = useState(false);
  const [hideEditor, setHideEditor] = useState(false);

  useEffect(() => {
    if (pendingQuery && !autoExecuteEnabled) {
      setEditorPanel('pending');
      setActiveTab('editor');
      setHideEditor(false);
    }
  }, [pendingQuery, autoExecuteEnabled]);

  useEffect(() => {
    if (latestAutoResult) {
      setResult(latestAutoResult);
      setActiveTab('results');
    }
  }, [latestAutoResult]);

  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setLocalError(null);
      setActiveTab('editor');
      setEditorPanel('suggestions');
      setQueryLimit(DEFAULT_LIMIT);
      setIsSchemaFullscreen(false);
      setHideEditor(false);
    }
  }, [isOpen]);

  const handleRunQuery = useCallback(async () => {
    const trimmed = queryText.trim();
    if (!trimmed) { setLocalError('Provide a SQL query to run.'); setResult(null); return; }
    setLocalError(null);
    try {
      const executionResult = await executeQuery(trimmed, queryLimit);
      setResult(executionResult);
      setActiveTab('results');
    } catch (error) {
      setResult(null);
      setLocalError(error instanceof Error ? error.message : 'Unable to execute SQL query.');
    }
  }, [executeQuery, queryLimit, queryText]);

  const handleSuggestionRequest = useCallback(async () => {
    const trimmed = queryText.trim();
    if (!trimmed) { setLocalError('Provide a SQL query before requesting suggestions.'); return; }
    setLocalError(null);
    setEditorPanel('suggestions');
    try {
      await requestSuggestions(trimmed, { includeSchema: true });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unable to generate suggestions.');
    }
  }, [requestSuggestions, queryText]);

  const handleHistorySelect = useCallback((entry: SqlQueryHistoryEntry) => {
    onChangeQuery(entry.query);
    if (entry.result) { setResult(entry.result); setActiveTab('results'); }
    else { setEditorPanel('history'); setActiveTab('editor'); }
  }, [onChangeQuery]);

  const canvasHistory = useMemo(() => history.map((h) => ({
    ...h,
    displaySource: 'user' as const,
  })), [history]);

  const handleSuggestionSelect = useCallback((suggestion: SqlQuerySuggestion) => {
    onChangeQuery(suggestion.query);
    setEditorPanel('suggestions');
    setActiveTab('editor');
  }, [onChangeQuery]);

  const combinedError = useMemo(() => localError ?? queryError ?? null, [localError, queryError]);
  const connectionSummary = connection
    ? `${connection.displayName || connection.label} · ${connection.mode}`
    : 'Not connected';

  const tabList: { key: CanvasTab; label: string; icon: string }[] = [
    ...(hideEditor ? [] : [{ key: 'editor' as CanvasTab, label: 'Editor', icon: 'code' }]),
    { key: 'results', label: 'Results', icon: 'table_chart' },
    { key: 'schema', label: 'Schema', icon: 'account_tree' },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row py-5 overflow-hidden">
      {/* Main content */}
      <div
        className={`flex min-w-0 flex-1 overflow-hidden transition-[flex-basis] duration-300 ${
          isOpen ? 'lg:basis-1/2 lg:max-w-[50%]' : 'lg:basis-full lg:max-w-full'
        }`}
        style={{ transitionTimingFunction: 'var(--ease-liquid)' }}
      >
        {children}
      </div>

      {/* SQL Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="canvas-panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-w-0 w-full flex-col overflow-hidden rounded-2xl px-4 text-white lg:basis-1/2 lg:max-w-[50%] lg:w-1/2 glass-strong"
            style={{
              boxShadow: '0 30px 80px -35px rgba(124, 58, 237, 0.25)',
            }}
          >
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col gap-1">
                <nav
                  className="mt-4 flex gap-2 py-1 text-xs font-semibold uppercase tracking-[0.15em]"
                  style={{ color: 'var(--text-ghost)' }}
                >
                  {tabList.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-all"
                      style={
                        activeTab === tab.key
                          ? {
                              background: 'var(--accent-violet)',
                              color: '#ffffff',
                              boxShadow: '0 12px 24px -16px rgba(124, 58, 237, 0.9)',
                            }
                          : { color: 'var(--text-ghost)' }
                      }
                    >
                      <Icon name={tab.icon} size={14} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
                <p className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                  {connectionSummary}
                </p>
              </div>
              <button
                type="button"
                onClick={onCollapse}
                className="btn-icon"
                aria-label="Close SQL canvas"
              >
                <Icon name="close" style={{ fontSize: 18 }} />
              </button>
            </div>

            {/* ── Body ────────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 w-full space-y-5 overflow-y-auto overflow-x-hidden pb-6">
              {/* Schema tab */}
              {activeTab === 'schema' && (
                <section className="flex flex-col gap-3">
                  <header className="flex items-center justify-between">
                    <span
                      className="text-[10px] uppercase tracking-[0.15em] font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Schema
                    </span>
                    {schema && (
                      <button
                        type="button"
                        onClick={() => setIsSchemaFullscreen(true)}
                        className="btn-icon"
                        aria-label="Fullscreen schema"
                      >
                        <Icon name="fullscreen" size={16} />
                      </button>
                    )}
                  </header>
                  {isSchemaLoading ? (
                    <div className="skeleton-pulse h-32 rounded-xl" />
                  ) : (
                    <SchemaViewer schema={schema} />
                  )}
                </section>
              )}

              {/* Results tab */}
              {activeTab === 'results' && (
                <section className="flex flex-col gap-3">
                  <header className="flex items-center justify-between">
                    <span
                      className="text-[10px] uppercase tracking-[0.15em] font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Results
                    </span>
                    {result && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {result.type === 'rows' ? `${result.rowCount} rows` : result.message} ·{' '}
                        {result.executionTimeMs}ms
                      </span>
                    )}
                  </header>
                  {isExecuting ? (
                    <div className="skeleton-pulse h-32 rounded-xl" />
                  ) : (
                    <SqlResultsView result={result} />
                  )}
                </section>
              )}

              {/* Editor tab */}
              {activeTab === 'editor' && (
                <div className="flex flex-col gap-4">
                  {/* Auto-run toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3
                        className="text-[10px] uppercase tracking-[0.15em] font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        SQL Editor
                      </h3>
                      <div
                        className="h-4 w-px"
                        style={{ background: 'var(--glass-border)' }}
                      />
                      <label
                        className="flex items-center gap-2 text-xs cursor-pointer"
                        style={{ color: 'var(--text-ghost)' }}
                      >
                        <div
                          className="relative w-8 h-4 rounded-full transition-all cursor-pointer"
                          style={{
                            background: autoExecuteEnabled
                              ? 'var(--accent-violet)'
                              : 'rgba(255, 255, 255, 0.15)',
                          }}
                          onClick={toggleAutoExecute}
                        >
                          <div
                            className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform"
                            style={{
                              transform: autoExecuteEnabled
                                ? 'translateX(16px)'
                                : 'translateX(2px)',
                            }}
                          />
                        </div>
                        <span>Auto-run</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHideEditor(!hideEditor)}
                      className="btn-icon"
                      aria-label={hideEditor ? 'Show editor' : 'Hide editor'}
                    >
                      <Icon
                        name={hideEditor ? 'visibility' : 'visibility_off'}
                        style={{ fontSize: 16 }}
                      />
                    </button>
                  </div>

                  {/* Editor textarea */}
                  <AnimatePresence mode="wait">
                    {!hideEditor && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-3"
                      >
                        <div
                          className="relative rounded-xl overflow-hidden"
                          style={{
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-surface-lowest, #060e20)',
                          }}
                        >
                          {/* Line numbers */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-10 flex flex-col items-center pt-3 text-[10px] font-mono select-none"
                            style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                              color: 'rgba(255, 255, 255, 0.15)',
                            }}
                          >
                            {Array.from(
                              { length: Math.max(5, queryText.split('\n').length) },
                              (_, i) => (
                                <span key={i} className="leading-5">
                                  {i + 1}
                                </span>
                              )
                            )}
                          </div>
                          <textarea
                            value={queryText}
                            onChange={(e) => onChangeQuery(e.target.value)}
                            spellCheck={false}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.shiftKey) {
                                e.preventDefault();
                                void handleRunQuery();
                              }
                            }}
                            className="w-full min-h-[140px] pl-12 pr-4 py-3 bg-transparent font-mono text-sm leading-5 resize-none focus:outline-none"
                            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                            placeholder="SELECT * FROM users LIMIT 10;"
                            aria-label="SQL query editor"
                          />
                        </div>

                        {/* Toolbar */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleRunQuery()}
                              disabled={isExecuting}
                              className="btn-primary text-sm py-2 px-4"
                              aria-label="Run query"
                            >
                              <Icon
                                name="play_arrow"
                                style={{
                                  fontSize: 16,
                                  fontVariationSettings: "'FILL' 1",
                                }}
                              />
                              {isExecuting ? 'Running…' : 'Run'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSuggestionRequest()}
                              disabled={isFetchingSuggestions}
                              className="btn-glass text-sm"
                              aria-label="Get AI suggestions"
                            >
                              <Icon
                                name="auto_awesome"
                                style={{ fontSize: 16 }}
                              />
                              {isFetchingSuggestions ? '…' : 'AI'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void refreshSchema()}
                              disabled={isSchemaLoading}
                              className="btn-icon"
                              title="Refresh schema"
                              aria-label="Refresh schema"
                            >
                              <Icon name="refresh" size={16} />
                            </button>
                          </div>
                          <div
                            className="flex items-center gap-2 text-[11px]"
                            style={{ color: 'var(--text-subtle)' }}
                          >
                            <label
                              htmlFor="sql-limit"
                              className="flex items-center gap-1.5"
                            >
                              Limit
                              <input
                                id="sql-limit"
                                type="number"
                                min={LIMIT_MIN}
                                max={LIMIT_MAX}
                                value={queryLimit}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  setQueryLimit(
                                    isNaN(v)
                                      ? DEFAULT_LIMIT
                                      : Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, v))
                                  );
                                }}
                                className="w-16 rounded px-2 py-1 text-right text-[11px] focus:outline-none"
                                style={{
                                  background: 'var(--glass-bg)',
                                  border: '1px solid var(--glass-border)',
                                  color: 'var(--text-secondary)',
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Error */}
                        {combinedError && (
                          <div className="glass-error rounded-lg px-3 py-2 text-xs">
                            <span style={{ color: 'var(--color-error)' }}>
                              {combinedError}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Sub-panel tabs */}
                  <div
                    className="flex items-center gap-2 pt-4"
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      className="flex gap-1 rounded-lg p-0.5 text-[11px]"
                      style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      {(['suggestions', 'history'] as EditorPanel[]).map((panel) => (
                        <button
                          key={panel}
                          type="button"
                          onClick={() => setEditorPanel(panel)}
                          className="rounded-md px-3 py-1.5 transition capitalize"
                          style={{
                            color:
                              editorPanel === panel
                                ? 'var(--accent-violet-light, #a78bfa)'
                                : 'var(--text-ghost)',
                            background:
                              editorPanel === panel
                                ? 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))'
                                : undefined,
                            fontWeight: editorPanel === panel ? 500 : 400,
                          }}
                        >
                          {panel}
                        </button>
                      ))}
                      {pendingQuery && (
                        <button
                          type="button"
                          onClick={() => setEditorPanel('pending')}
                          className="rounded-md px-3 py-1.5 transition flex items-center gap-1.5"
                          style={{
                            color:
                              editorPanel === 'pending'
                                ? 'var(--color-warning)'
                                : 'rgba(251, 191, 36, 0.7)',
                            background:
                              editorPanel === 'pending'
                                ? 'rgba(251, 191, 36, 0.10)'
                                : undefined,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: 'var(--color-warning)' }}
                          />
                          Pending
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-panel content */}
                  {editorPanel === 'pending' && pendingQuery ? (
                    <SqlPendingApprovalPanel
                      pendingQuery={pendingQuery}
                      isExecuting={isExecuting}
                      onApprove={() => {
                        if (pendingQuery) {
                          onChangeQuery(pendingQuery.query);
                          approvePendingQuery();
                        }
                      }}
                      onEdit={(q) => {
                        onChangeQuery(q);
                        setEditorPanel('suggestions');
                      }}
                      onReject={rejectPendingQuery}
                    />
                  ) : editorPanel === 'history' ? (
                    <SqlHistoryPanel
                      history={canvasHistory}
                      onSelectHistory={handleHistorySelect}
                      onViewResult={(entry) => {
                        if (entry.result) {
                          setResult(entry.result);
                          setActiveTab('results');
                        }
                      }}
                    />
                  ) : (
                    <SqlSuggestionsPanel
                      suggestions={suggestions}
                      suggestionAnalysis={suggestionAnalysis}
                      suggestionsError={suggestionsError}
                      onSelectSuggestion={handleSuggestionSelect}
                    />
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Fullscreen Schema Modal */}
      <AnimatePresence>
        {isSchemaFullscreen && schema && (
          <>
            <motion.div
              key="schema-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{
                background: 'rgba(0, 0, 0, 0.80)',
                backdropFilter: 'blur(8px)',
              }}
              onClick={() => setIsSchemaFullscreen(false)}
            />
            <motion.div
              key="schema-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl glass-strong"
            >
              <header
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid var(--glass-border)' }}
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">Database Schema</h2>
                  <span
                    className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {schema.connection.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSchemaFullscreen(false)}
                  className="btn-icon"
                  aria-label="Close fullscreen"
                >
                  <Icon name="close" style={{ fontSize: 18 }} />
                </button>
              </header>
              <div className="flex-1 overflow-auto p-6">
                <SchemaViewer schema={schema} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CanvasPanel;