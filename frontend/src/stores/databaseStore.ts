// ─── Database Store (Zustand) ────────────────────────────────────────────────

import { create } from 'zustand';
import type {
  DatabaseConnectionSettings,
  DatabaseMode,
  SqlSchemaPayload,
  SqlQueryResult,
  SqlQuerySuggestion,
  SqlQueryHistoryEntry,
  PendingQuery,
} from '../types/database';
import * as dbService from '../services/databaseService';

interface DatabaseState {
  // Connection
  connection: DatabaseConnectionSettings | null;
  availableModes: DatabaseMode[];
  environmentFallback: DatabaseConnectionSettings | null;
  isConnectionLoading: boolean;
  connectionFeedback: string | null;

  // Schema
  schema: SqlSchemaPayload | null;
  isSchemaLoading: boolean;

  // Editor
  queryText: string;
  isExecuting: boolean;
  queryResult: SqlQueryResult | null;
  queryError: string | null;

  // SQL panel
  isSideWindowOpen: boolean;

  // History
  history: SqlQueryHistoryEntry[];
  executedQueries: Map<string, SqlQueryResult>;

  // Suggestions
  suggestions: SqlQuerySuggestion[];
  suggestionAnalysis: string | null;
  isFetchingSuggestions: boolean;
  suggestionsError: string | null;

  // Pending
  pendingQuery: PendingQuery | null;
  autoExecuteEnabled: boolean;
  latestAutoResult: SqlQueryResult | null;

  // Actions
  loadConnection: () => Promise<void>;
  refreshSchema: () => Promise<void>;
  setQueryText: (text: string) => void;
  executeQuery: (query: string, limit?: number) => Promise<SqlQueryResult>;
  requestSuggestions: (query: string, opts?: { includeSchema?: boolean }) => Promise<void>;
  toggleSideWindow: () => void;
  closeSideWindow: () => void;
  setPendingQuery: (query: PendingQuery | null) => void;
  approvePendingQuery: () => void;
  rejectPendingQuery: () => void;
  toggleAutoExecute: () => void;
  reset: () => void;
  setConnectionFeedback: (msg: string | null) => void;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  connection: null,
  availableModes: [],
  environmentFallback: null,
  isConnectionLoading: false,
  connectionFeedback: null,
  schema: null,
  isSchemaLoading: false,
  queryText: '',
  isExecuting: false,
  queryResult: null,
  queryError: null,
  isSideWindowOpen: false,
  history: [],
  executedQueries: new Map(),
  suggestions: [],
  suggestionAnalysis: null,
  isFetchingSuggestions: false,
  suggestionsError: null,
  pendingQuery: null,
  autoExecuteEnabled: false,
  latestAutoResult: null,

  loadConnection: async () => {
    set({ isConnectionLoading: true });
    try {
      const env = await dbService.fetchConnectionSettings();
      set({
        connection: env.connection,
        availableModes: env.availableModes,
        environmentFallback: env.environmentFallback ?? null,
      });
    } catch (err) {
      console.error('Failed to load DB connection:', err);
    } finally {
      set({ isConnectionLoading: false });
    }
  },

  refreshSchema: async () => {
    set({ isSchemaLoading: true });
    try {
      const schema = await dbService.fetchSchema();
      set({ schema });
    } catch (err) {
      console.error('Failed to load schema:', err);
    } finally {
      set({ isSchemaLoading: false });
    }
  },

  setQueryText: (text: string) => set({ queryText: text }),

  executeQuery: async (query: string, limit?: number) => {
    set({ isExecuting: true, queryError: null });
    try {
      const result = await dbService.runSqlQuery({ query, limit });
      const entry: SqlQueryHistoryEntry = {
        id: `hist-${Date.now()}`,
        query,
        executedAt: new Date().toISOString(),
        result,
        executionTimeMs: result.executionTimeMs,
      };
      const execMap = new Map(get().executedQueries);
      execMap.set(query.trim().replace(/\s+/g, ' ').toLowerCase(), result);
      set({
        queryResult: result,
        history: [entry, ...get().history].slice(0, 50),
        executedQueries: execMap,
      });
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Query execution failed';
      set({ queryError: msg });
      throw err;
    } finally {
      set({ isExecuting: false });
    }
  },

  requestSuggestions: async (query: string, opts?: { includeSchema?: boolean }) => {
    set({ isFetchingSuggestions: true, suggestionsError: null });
    try {
      const env = await dbService.requestSuggestions({
        query,
        includeSchema: opts?.includeSchema ?? true,
      });
      set({
        suggestions: env.suggestions,
        suggestionAnalysis: env.analysis ?? null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get suggestions';
      set({ suggestionsError: msg });
    } finally {
      set({ isFetchingSuggestions: false });
    }
  },

  toggleSideWindow: () => set({ isSideWindowOpen: !get().isSideWindowOpen }),
  closeSideWindow: () => set({ isSideWindowOpen: false }),

  setPendingQuery: (query) => set({ pendingQuery: query }),
  approvePendingQuery: () => {
    const pq = get().pendingQuery;
    if (pq) {
      set({ queryText: pq.query, pendingQuery: null });
      void get().executeQuery(pq.query);
    }
  },
  rejectPendingQuery: () => set({ pendingQuery: null }),
  toggleAutoExecute: () => set({ autoExecuteEnabled: !get().autoExecuteEnabled }),

  reset: () =>
    set({
      queryText: '',
      queryResult: null,
      queryError: null,
      suggestions: [],
      suggestionAnalysis: null,
      suggestionsError: null,
      pendingQuery: null,
      latestAutoResult: null,
      isSideWindowOpen: false,
    }),

  setConnectionFeedback: (msg) => set({ connectionFeedback: msg }),
}));
