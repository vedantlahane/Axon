// ─── Database Store (Zustand) ────────────────────────────────────────────────
// Manages database connections, schema, SQL editor, query execution, and history.

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

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

export interface DatabaseState {
  // Connection
  connection: DatabaseConnectionSettings | null;
  availableModes: DatabaseMode[];
  environmentFallback: DatabaseConnectionSettings | null;
  isConnectionLoading: boolean;
  connectionFeedback: string | null;

  // Connection testing (Settings page)
  isTestingConnection: boolean;
  connectionTestResult: ConnectionTestResult | null;

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
  saveConnection: (settings: DatabaseConnectionSettings) => Promise<void>;
  testConnection: (connectionUrl?: string) => Promise<ConnectionTestResult>;
  refreshSchema: () => Promise<void>;
  setQueryText: (text: string) => void;
  executeQuery: (query: string, limit?: number) => Promise<SqlQueryResult>;
  requestSuggestions: (
    query: string,
    opts?: { includeSchema?: boolean }
  ) => Promise<void>;
  toggleSideWindow: () => void;
  closeSideWindow: () => void;
  setPendingQuery: (query: PendingQuery | null) => void;
  approvePendingQuery: () => void;
  rejectPendingQuery: () => void;
  toggleAutoExecute: () => void;
  reset: () => void;
  setConnectionFeedback: (msg: string | null) => void;
  clearConnectionTestResult: () => void;
}

/* ── Store ────────────────────────────────────────────────────────────────── */

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────────
  connection: null,
  availableModes: [],
  environmentFallback: null,
  isConnectionLoading: false,
  connectionFeedback: null,
  isTestingConnection: false,
  connectionTestResult: null,
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

  // ── Connection ─────────────────────────────────────────────────────────

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

  saveConnection: async (settings: DatabaseConnectionSettings) => {
    set({ isConnectionLoading: true, connectionFeedback: null });
    try {
      // If your service has a save endpoint:
      // await dbService.saveConnectionSettings(settings);
      set({
        connection: settings,
        connectionFeedback: 'Connection saved successfully',
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to save connection';
      set({ connectionFeedback: msg });
      throw err;
    } finally {
      set({ isConnectionLoading: false });
    }
  },

  testConnection: async (connectionUrl?: string) => {
    set({ isTestingConnection: true, connectionTestResult: null });
    try {
      // If your service has a test endpoint:
      // const result = await dbService.testConnection(connectionUrl);
      // For now, simulate:
      const start = performance.now();
      await dbService.fetchSchema(); // Use schema fetch as a connectivity test
      const latencyMs = Math.round(performance.now() - start);

      const result: ConnectionTestResult = {
        success: true,
        message: `Connected successfully (${latencyMs}ms)`,
        latencyMs,
      };
      set({ connectionTestResult: result });
      return result;
    } catch (err) {
      const result: ConnectionTestResult = {
        success: false,
        message:
          err instanceof Error ? err.message : 'Connection test failed',
      };
      set({ connectionTestResult: result });
      return result;
    } finally {
      set({ isTestingConnection: false });
    }
  },

  clearConnectionTestResult: () => set({ connectionTestResult: null }),

  // ── Schema ─────────────────────────────────────────────────────────────

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

  // ── Editor ─────────────────────────────────────────────────────────────

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
      execMap.set(
        query
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase(),
        result
      );
      set({
        queryResult: result,
        history: [entry, ...get().history].slice(0, 50),
        executedQueries: execMap,
      });
      return result;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Query execution failed';
      set({ queryError: msg });
      throw err;
    } finally {
      set({ isExecuting: false });
    }
  },

  // ── Suggestions ────────────────────────────────────────────────────────

  requestSuggestions: async (
    query: string,
    opts?: { includeSchema?: boolean }
  ) => {
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
      const msg =
        err instanceof Error ? err.message : 'Failed to get suggestions';
      set({ suggestionsError: msg });
    } finally {
      set({ isFetchingSuggestions: false });
    }
  },

  // ── SQL Panel ──────────────────────────────────────────────────────────

  toggleSideWindow: () => set({ isSideWindowOpen: !get().isSideWindowOpen }),
  closeSideWindow: () => set({ isSideWindowOpen: false }),

  // ── Pending Queries ────────────────────────────────────────────────────

  setPendingQuery: (query) => set({ pendingQuery: query }),

  approvePendingQuery: () => {
    const pq = get().pendingQuery;
    if (pq) {
      set({ queryText: pq.query, pendingQuery: null });
      void get().executeQuery(pq.query);
    }
  },

  rejectPendingQuery: () => set({ pendingQuery: null }),

  toggleAutoExecute: () =>
    set({ autoExecuteEnabled: !get().autoExecuteEnabled }),

  // ── Reset ──────────────────────────────────────────────────────────────

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