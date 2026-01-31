import type { SqlQueryResult } from "../../services/chatApi";

export interface SqlQueryHistoryEntry {
  id: string;
  query: string;
  executedAt: string;
  type: "rows" | "ack";
  rowCount: number;
  result?: SqlQueryResult;
  source?: "ai" | "user";
}

export interface PendingQuery {
  id: string;
  query: string;
  source: "ai" | "user";
  timestamp: string;
}

import type { SqlSchemaPayload, SqlQuerySuggestion } from "../../services/chatApi";

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
  pendingQuery: PendingQuery | null;
  onApprovePendingQuery: () => void;
  onRejectPendingQuery: () => void;
  autoExecuteEnabled: boolean;
  onToggleAutoExecute: () => void;
  latestAutoResult: SqlQueryResult | null;
}

export type CanvasTab = "editor" | "results" | "schema";
export type EditorPanel = "suggestions" | "history" | "pending";

export const DEFAULT_QUERY_LIMIT = 200;
export const QUERY_LIMIT_MIN = 1;
export const QUERY_LIMIT_MAX = 10000;
export const CANVAS_TABS: CanvasTab[] = ["editor", "results", "schema"];

export const TAB_LABELS: Record<CanvasTab, string> = {
  editor: "Editor",
  results: "Results",
  schema: "Schema",
};

export const formatExecutionTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
