import { useCallback } from 'react';
import { useDatabaseStore } from '../stores/databaseStore';

export const useDatabase = () => {
  const connection = useDatabaseStore((state) => state.connection);
  const schema = useDatabaseStore((state) => state.schema);
  const isConnectionLoading = useDatabaseStore((state) => state.isConnectionLoading);
  const isSchemaLoading = useDatabaseStore((state) => state.isSchemaLoading);
  const isExecuting = useDatabaseStore((state) => state.isExecuting);
  const queryText = useDatabaseStore((state) => state.queryText);
  const queryResult = useDatabaseStore((state) => state.queryResult);
  const queryError = useDatabaseStore((state) => state.queryError);

  const loadConnection = useCallback(async () => {
    return useDatabaseStore.getState().loadConnection();
  }, []);

  const refreshSchema = useCallback(async () => {
    return useDatabaseStore.getState().refreshSchema();
  }, []);

  const executeQuery = useCallback(async (query: string, limit?: number) => {
    return useDatabaseStore.getState().executeQuery(query, limit);
  }, []);

  const setQueryText = useCallback((text: string) => {
    useDatabaseStore.getState().setQueryText(text);
  }, []);

  const requestSuggestions = useCallback(
    async (query: string, opts?: { includeSchema?: boolean }) => {
      return useDatabaseStore.getState().requestSuggestions(query, opts);
    },
    []
  );

  return {
    connection,
    schema,
    isConnectionLoading,
    isSchemaLoading,
    isExecuting,
    queryText,
    queryResult,
    queryError,
    loadConnection,
    refreshSchema,
    executeQuery,
    setQueryText,
    requestSuggestions,
  };
};
