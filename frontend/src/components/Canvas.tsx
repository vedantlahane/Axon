import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SchemaDiagram from "./SchemaDiagram";
import type {
  SqlQueryResult,
  SqlQuerySuggestion,
  SqlSchemaPayload,
} from "../services/chatApi";
import { exportSqlResultsXlsx } from "../services/chatApi";

export interface SqlQueryHistoryEntry {
  id: string;
  query: string;
  executedAt: string;
  type: SqlQueryResult["type"];
  rowCount: number;
  result?: SqlQueryResult; // Store full result for viewing later
  source?: 'ai' | 'user'; // Track if AI generated
}

export interface PendingQuery {
  id: string;
  query: string;
  source: 'ai' | 'user';
  timestamp: string;
}

export interface SqlSideWindowProps {
  isOpen: boolean;
  onCollapse: () => void;
  connectionSummary: string;
  schema: SqlSchemaPayload | null;
  isSchemaLoading: boolean;
  onRefreshSchema: () => Promise<void> | void;
  onExecuteQuery: (query: string, limit?: number) => Promise<SqlQueryResult>;
  isExecuting: boolean;
  history: SqlQueryHistoryEntry[];
  errorMessage: string | null;
  onRequestSuggestions: (
    query: string,
    options?: { includeSchema?: boolean; maxSuggestions?: number }
  ) => Promise<void>;
  isSuggesting: boolean;
  suggestions: SqlQuerySuggestion[];
  suggestionsError: string | null;
  suggestionAnalysis: string | null;
  queryText: string;
  onChangeQuery: (value: string) => void;
  // New props for human-in-the-loop
  pendingQuery: PendingQuery | null;
  onApprovePendingQuery: () => void;
  onRejectPendingQuery: () => void;
  autoExecuteEnabled: boolean;
  onToggleAutoExecute: () => void;
  // Latest auto-executed result
  latestAutoResult: SqlQueryResult | null;
}

interface CanvasProps {
  children: React.ReactNode;
  sideWindow: SqlSideWindowProps;
}

type CanvasTab = "editor" | "results" | "schema";
type EditorPanel = "suggestions" | "history" | "pending";

const DEFAULT_QUERY_LIMIT = 200;
const QUERY_LIMIT_MIN = 1;
const QUERY_LIMIT_MAX = 10000;
const CANVAS_TABS: CanvasTab[] = ["editor", "results", "schema"];

const TAB_LABELS: Record<CanvasTab, string> = {
  editor: "Editor",
  results: "Results",
  schema: "Schema",
};

const DATE_UNITS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

const formatExecutionTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString(undefined, DATE_UNITS);
};

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
  const [isExportingResults, setIsExportingResults] = useState(false);

  // Export SQL results to XLSX
  const handleExportResults = async () => {
    if (!result || result.type !== "rows" || isExportingResults) return;
    setIsExportingResults(true);
    try {
      const rows = result.rows.map((row) => {
        const obj: Record<string, unknown> = {};
        result.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
      await exportSqlResultsXlsx(queryText, result.columns, rows);
    } catch (err) {
      console.error("Failed to export results:", err);
    } finally {
      setIsExportingResults(false);
    }
  };

  // Switch to pending panel when there's a pending query
  useEffect(() => {
    if (pendingQuery && !autoExecuteEnabled) {
      setEditorPanel("pending");
      setActiveTab("editor");
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

  const renderResultContent = () => {
    if (!result) {
      return (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Run a query to view results.
        </div>
      );
    }

    if (result.type === "rows") {
      return (
        <div className="flex flex-col gap-3 min-w-0 w-full">
          {/* Results summary header */}
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2">
            <span className="text-sm text-white/70">
              <strong className="text-white">{result.rowCount}</strong> row{result.rowCount === 1 ? "" : "s"} • {result.columns.length} column{result.columns.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/50">{result.executionTimeMs}ms</span>
              <button
                type="button"
                disabled={isExportingResults}
                onClick={handleExportResults}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/30 disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExportingResults ? "Exporting..." : "Export XLSX"}
              </button>
            </div>
          </div>
          
          {/* Scrollable table container - constrained width */}
          <div className="max-h-[400px] w-full overflow-auto rounded-xl border border-white/10 bg-[#0b1220]/70">
            <table className="w-max min-w-full border-separate border-spacing-0 text-left text-sm text-white/80 table-fixed">
              <thead className="sticky top-0 z-10 bg-[#151d2e]">
                <tr>
                  <th className="w-12 border-b border-white/10 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white/50">#</th>
                  {result.columns.map((column) => (
                    <th 
                      key={column} 
                      className="min-w-[80px] max-w-[200px] border-b border-white/10 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white/50"
                    >
                      <div className="truncate" title={column}>{column}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-white/40"
                      colSpan={(result.columns.length || 1) + 1}
                    >
                      No rows returned.
                    </td>
                  </tr>
                ) : (
                  result.rows.map((row, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="w-12 px-3 py-2 text-xs text-white/30 font-mono">{index + 1}</td>
                      {row.map((value, cellIndex) => (
                        <td
                          key={`${index}-${cellIndex}`}
                          className="min-w-[80px] max-w-[200px] px-3 py-2 align-top text-xs text-white/70"
                        >
                          <div className="truncate" title={String(value ?? 'NULL')}>
                            {value === null ? (
                              <span className="italic text-white/30">NULL</span>
                            ) : typeof value === 'object' ? (
                              <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px] text-amber-300 truncate block">
                                {JSON.stringify(value).slice(0, 50)}
                              </code>
                            ) : String(value).length > 50 ? (
                              <span className="cursor-help">
                                {String(value).slice(0, 50)}…
                              </span>
                            ) : (
                              String(value)
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination hint for large results */}
          {result.rowCount > 100 && (
            <p className="text-center text-xs text-white/40">
              Showing {Math.min(result.rows.length, result.rowCount)} of {result.rowCount} rows.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        <p className="font-medium">Statement acknowledged</p>
        <p className="text-xs text-emerald-100/70">{result.message}</p>
        <p className="mt-2 text-xs text-emerald-100/50">
          {result.rowCount} row{result.rowCount === 1 ? "" : "s"} affected •{" "}
          {result.executionTimeMs}ms
        </p>
      </div>
    );
  };

  const renderEditorSupportingPanel = () => {
    // Pending query panel - Human in the loop
    if (editorPanel === "pending") {
      return (
        <section className="flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-amber-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="uppercase tracking-[0.2em]">Query Pending Approval</span>
            </span>
          </header>
          {pendingQuery ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-amber-200/70">
                <span>Source: {pendingQuery.source === 'ai' ? 'AI Generated' : 'User Input'}</span>
                <span>{new Date(pendingQuery.timestamp).toLocaleTimeString()}</span>
              </div>
              <pre className="mb-4 overflow-x-auto rounded-lg border border-white/10 bg-[#060a18] p-3 font-mono text-sm text-white/80">
                {pendingQuery.query}
              </pre>
              <p className="mb-4 text-xs text-amber-200/60">
                Review the SQL query above before it runs on your database. You can edit the query in the editor if needed.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onChangeQuery(pendingQuery.query);
                    onApprovePendingQuery();
                  }}
                  disabled={isExecuting}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Approve & Run
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeQuery(pendingQuery.query);
                    setEditorPanel("suggestions");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit First
                </button>
                <button
                  type="button"
                  onClick={onRejectPendingQuery}
                  className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/50">
              No queries pending approval.
            </p>
          )}
        </section>
      );
    }

    if (editorPanel === "history") {
      return (
        <section className="flex flex-col gap-3">
          <header className="flex items-center justify-between">
            <span className="text-xs text-white/40">
              {history.length} saved
            </span>
          </header>
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/50">
              Run queries to build your history.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[11px] text-white/60 flex-1">
                      {entry.query.slice(0, 120)}
                      {entry.query.length > 120 && '...'}
                    </span>
                    {entry.source === 'ai' && (
                      <span className="shrink-0 rounded bg-[#2563eb]/20 px-1.5 py-0.5 text-[9px] font-medium text-[#60a5fa]">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/40">
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-white/10 px-1.5 py-0.5">{entry.type.toUpperCase()}</span>
                      <span>{entry.rowCount} rows</span>
                    </span>
                    <span>{formatExecutionTimestamp(entry.executedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleHistorySelect(entry)}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Load Query
                    </button>
                    {entry.result && (
                      <button
                        type="button"
                        onClick={() => handleViewHistoryResult(entry)}
                        className="flex items-center gap-1 rounded-md border border-[#2563eb]/30 bg-[#2563eb]/10 px-2 py-1 text-[10px] text-[#60a5fa] transition hover:bg-[#2563eb]/20"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    return (
      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          
          {suggestionAnalysis && (
            <span className="text-[10px] text-white/40">Updated just now</span>
          )}
        </header>
        {suggestionAnalysis && (
          <p className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3 text-xs text-blue-200">
            {suggestionAnalysis}
          </p>
        )}
        {suggestionsError && (
          <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-200">
            {suggestionsError}
          </div>
        )}
        {suggestions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/50">
            Request suggestions to see AI-assisted improvements.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70 shadow-inner"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                    {suggestion.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/70 transition hover:border-[#2563eb]/40 hover:bg-[#1d4ed8]/10 hover:text-white"
                  >
                    Load query
                  </button>
                </div>
                <p className="text-xs text-white/60">{suggestion.summary}</p>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-[#060a18] p-3 font-mono text-[11px] text-white/70">
                  {suggestion.query}
                </pre>
                {suggestion.rationale && (
                  <p className="mt-2 text-[11px] text-blue-200/80">
                    {suggestion.rationale}
                  </p>
                )}
                {suggestion.warnings?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] text-amber-200/80">
                    {suggestion.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
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
            renderResultContent()
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
            className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1a] shadow-2xl"
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
