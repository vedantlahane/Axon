// ─── useDatabase Hook ────────────────────────────────────────────────────────
// Thin convenience wrapper around databaseStore Zustand selectors.

import { useCallback } from 'react';
import { useDatabaseStore } from '../stores/databaseStore';

type DatabaseStoreState = ReturnType<typeof useDatabaseStore.getState>;
type SaveConnectionInput = Parameters<DatabaseStoreState['saveConnection']>[0];

export const useDatabase = () => {
  const connection = useDatabaseStore((s) => s.connection);
  const schema = useDatabaseStore((s) => s.schema);
  const isConnectionLoading = useDatabaseStore((s) => s.isConnectionLoading);
  const isSchemaLoading = useDatabaseStore((s) => s.isSchemaLoading);
  const isExecuting = useDatabaseStore((s) => s.isExecuting);
  const queryText = useDatabaseStore((s) => s.queryText);
  const queryResult = useDatabaseStore((s) => s.queryResult);
  const queryError = useDatabaseStore((s) => s.queryError);
  const isSideWindowOpen = useDatabaseStore((s) => s.isSideWindowOpen);

  const loadConnection = useCallback(() => {
    return useDatabaseStore.getState().loadConnection();
  }, []);

  const saveConnection = useCallback(
    (settings: SaveConnectionInput) => {
      return useDatabaseStore.getState().saveConnection(settings);
    },
    []
  );

  const testConnection = useCallback((url?: string) => {
    return useDatabaseStore.getState().testConnection(url);
  }, []);

  const refreshSchema = useCallback(() => {
    return useDatabaseStore.getState().refreshSchema();
  }, []);

  const executeQuery = useCallback((query: string, limit?: number) => {
    return useDatabaseStore.getState().executeQuery(query, limit);
  }, []);

  const setQueryText = useCallback((text: string) => {
    useDatabaseStore.getState().setQueryText(text);
  }, []);

  const requestSuggestions = useCallback(
    (query: string, opts?: { includeSchema?: boolean }) => {
      return useDatabaseStore.getState().requestSuggestions(query, opts);
    },
    []
  );

  const toggleSideWindow = useCallback(() => {
    useDatabaseStore.getState().toggleSideWindow();
  }, []);

  return {
    connection,
    schema,
    isConnectionLoading,
    isSchemaLoading,
    isExecuting,
    queryText,
    queryResult,
    queryError,
    isSideWindowOpen,
    loadConnection,
    saveConnection,
    testConnection,
    refreshSchema,
    executeQuery,
    setQueryText,
    requestSuggestions,
    toggleSideWindow,
  };
};