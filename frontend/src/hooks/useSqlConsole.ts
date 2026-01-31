import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchDatabaseSchema, requestSqlSuggestions as requestSqlSuggestionsApi, runSqlQuery, type SqlQueryResult, type SqlQuerySuggestion, type SqlSchemaPayload } from "../services/chatApi";
import { normalizeSql } from "../utils/sqlUtils";
import type { SqlQueryHistoryEntry, PendingQuery } from "../components/Canvas";
import type { ChatMessage } from "../App";

interface UseSqlConsoleOptions {
	canUseDatabaseTools: boolean;
	onRevealMessage?: (message: ChatMessage) => void;
}

const extractSqlFromMessage = (content: string): string | null => {
	const sqlBlockMatch = content.match(/```sql\s*([\s\S]*?)```/i);
	if (sqlBlockMatch && sqlBlockMatch[1]) {
		return sqlBlockMatch[1].trim();
	}
	return null;
};

const deriveErrorMessage = (error: unknown, fallback: string): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return fallback;
};

const useSqlConsole = ({ canUseDatabaseTools, onRevealMessage }: UseSqlConsoleOptions) => {
	const [isSideWindowOpen, setIsSideWindowOpen] = useState(false);
	const [sqlEditorValue, setSqlEditorValue] = useState<string>("");
	const [sqlSchema, setSqlSchema] = useState<SqlSchemaPayload | null>(null);
	const [isSchemaLoading, setIsSchemaLoading] = useState(false);
	const [isExecutingSql, setIsExecutingSql] = useState(false);
	const [sqlConsoleError, setSqlConsoleError] = useState<string | null>(null);
	const [sqlHistory, setSqlHistory] = useState<SqlQueryHistoryEntry[]>([]);
	const [sqlSuggestions, setSqlSuggestions] = useState<SqlQuerySuggestion[]>([]);
	const [sqlSuggestionAnalysis, setSqlSuggestionAnalysis] = useState<string | null>(null);
	const [isFetchingSqlSuggestions, setIsFetchingSqlSuggestions] = useState(false);
	const [sqlSuggestionsError, setSqlSuggestionsError] = useState<string | null>(null);
	const [pendingSqlQuery, setPendingSqlQuery] = useState<PendingQuery | null>(null);
	const [hiddenAssistantMessage, setHiddenAssistantMessage] = useState<ChatMessage | null>(null);
	const [latestAutoResult, setLatestAutoResult] = useState<SqlQueryResult | null>(null);
	const [autoExecuteEnabled, setAutoExecuteEnabled] = useState<boolean>(() => {
		const stored = localStorage.getItem("axon-auto-execute");
		return stored === "true";
	});
	const [executedQueries, setExecutedQueries] = useState<Map<string, SqlQueryResult>>(new Map());

	const lastAssistantMessageIdRef = useRef<string | null>(null);

	const clearSqlErrors = useCallback(() => {
		setSqlConsoleError(null);
		setSqlSuggestionsError(null);
	}, []);

	const resetSqlSuggestions = useCallback(() => {
		setSqlSuggestions([]);
		setSqlSuggestionAnalysis(null);
	}, []);

	const resetSqlConsoleState = useCallback((options?: { close?: boolean }) => {
		setSqlEditorValue("");
		setSqlSchema(null);
		setSqlConsoleError(null);
		setSqlHistory([]);
		setIsSchemaLoading(false);
		setIsExecutingSql(false);
		setSqlSuggestions([]);
		setSqlSuggestionAnalysis(null);
		setSqlSuggestionsError(null);
		setIsFetchingSqlSuggestions(false);
		setPendingSqlQuery(null);
		setHiddenAssistantMessage(null);
		setLatestAutoResult(null);
		if (options?.close) {
			setIsSideWindowOpen(false);
		}
	}, []);

	const refreshDatabaseSchema = useCallback(async () => {
		if (!canUseDatabaseTools) {
			setSqlSchema(null);
			setSqlConsoleError("Configure a database connection to inspect the schema.");
			return;
		}

		setIsSchemaLoading(true);
		setSqlConsoleError(null);

		try {
			const schemaPayload = await fetchDatabaseSchema();
			setSqlSchema(schemaPayload);
		} catch (error) {
			setSqlConsoleError(deriveErrorMessage(error, "Unable to load database schema."));
		} finally {
			setIsSchemaLoading(false);
		}
	}, [canUseDatabaseTools]);

	const executeSqlQuery = useCallback(
		async (query: string, limit = 200, source: "ai" | "user" = "user"): Promise<SqlQueryResult> => {
			if (!canUseDatabaseTools) {
				const error = new Error("Configure a database connection before running SQL queries.");
				setSqlConsoleError(error.message);
				throw error;
			}

			setIsSideWindowOpen(true);
			setSqlEditorValue(query);
			setIsExecutingSql(true);
			setSqlConsoleError(null);
			setLatestAutoResult(null);

			try {
				const result = await runSqlQuery({ query, limit });

				const historyEntry: SqlQueryHistoryEntry = {
					id: `sql-${Date.now()}`,
					query,
					executedAt: new Date().toISOString(),
					type: result.type,
					rowCount: result.rowCount,
					result,
					source,
				};

				setSqlHistory((prev) => [historyEntry, ...prev].slice(0, 25));

				if (source === "ai") {
					setLatestAutoResult(result);
				}

				setExecutedQueries((prev) => {
					const newMap = new Map(prev);
					newMap.set(normalizeSql(query), result);
					return newMap;
				});

				return result;
			} catch (error) {
				const message = deriveErrorMessage(error, "Unable to execute SQL query.");
				setSqlConsoleError(message);
				throw new Error(message);
			} finally {
				setIsExecutingSql(false);
			}
		},
		[canUseDatabaseTools]
	);

	const requestSqlSuggestions = useCallback(
		async (
			query: string,
			options?: { includeSchema?: boolean; maxSuggestions?: number },
		): Promise<void> => {
			if (!canUseDatabaseTools) {
				const error = new Error("Configure a database connection before requesting suggestions.");
				setSqlSuggestionsError(error.message);
				throw error;
			}

			const trimmed = query.trim();
			if (!trimmed) {
				const error = new Error("Provide a SQL query to analyse.");
				setSqlSuggestionsError(error.message);
				throw error;
			}

			setIsSideWindowOpen(true);
			setSqlEditorValue(trimmed);
			setIsFetchingSqlSuggestions(true);
			setSqlSuggestionsError(null);

			try {
				const response = await requestSqlSuggestionsApi({
					query: trimmed,
					includeSchema: options?.includeSchema ?? true,
					maxSuggestions: options?.maxSuggestions,
				});
				setSqlSuggestions(response.suggestions ?? []);
				setSqlSuggestionAnalysis(response.analysis ?? null);
			} catch (error) {
				const message = deriveErrorMessage(error, "Unable to generate SQL suggestions.");
				setSqlSuggestionsError(message);
				throw new Error(message);
			} finally {
				setIsFetchingSqlSuggestions(false);
			}
		},
		[canUseDatabaseTools]
	);

	const approvePendingQuery = useCallback(async () => {
		if (!pendingSqlQuery) return;
		const query = pendingSqlQuery.query;
		const source = pendingSqlQuery.source;
		setPendingSqlQuery(null);
		try {
			await executeSqlQuery(query, 200, source);
			if (hiddenAssistantMessage && onRevealMessage) {
				onRevealMessage(hiddenAssistantMessage);
				setHiddenAssistantMessage(null);
			}
		} catch {
			// Error already handled in executeSqlQuery
		}
	}, [pendingSqlQuery, executeSqlQuery, hiddenAssistantMessage, onRevealMessage]);

	const rejectPendingQuery = useCallback(() => {
		setPendingSqlQuery(null);
		setHiddenAssistantMessage(null);
	}, []);

	const toggleAutoExecute = useCallback(() => {
		setAutoExecuteEnabled((prev) => {
			const next = !prev;
			localStorage.setItem("axon-auto-execute", String(next));

			if (next && pendingSqlQuery) {
				void executeSqlQuery(pendingSqlQuery.query, 200, pendingSqlQuery.source);
				setHiddenAssistantMessage(null);
				setPendingSqlQuery(null);
			}

			return next;
		});
	}, [pendingSqlQuery, executeSqlQuery]);

	const viewSqlInCanvas = useCallback(
		(sql: string) => {
			const normalizedSql = normalizeSql(sql);
			const result = executedQueries.get(normalizedSql);

			setIsSideWindowOpen(true);
			setSqlEditorValue(sql.trim());

			if (result) {
				setLatestAutoResult(result);
			} else {
				setLatestAutoResult(null);
			}
		},
		[executedQueries]
	);

	const handleAssistantMessageForSql = useCallback(
		(message: ChatMessage) => {
			if (!message || message.sender !== "assistant") {
				return;
			}
			if (message.id === lastAssistantMessageIdRef.current) {
				return;
			}
			if (!canUseDatabaseTools) {
				return;
			}
			const sqlQuery = extractSqlFromMessage(message.content);
			if (!sqlQuery) {
				return;
			}
			lastAssistantMessageIdRef.current = message.id;

			if (autoExecuteEnabled) {
				void executeSqlQuery(sqlQuery, 200, "ai");
			} else {
				setSqlEditorValue(sqlQuery);
				setPendingSqlQuery({
					id: `pending-${Date.now()}`,
					query: sqlQuery,
					source: "ai",
					timestamp: new Date().toISOString(),
				});
				setIsSideWindowOpen(true);
			}
		},
		[autoExecuteEnabled, canUseDatabaseTools, executeSqlQuery]
	);

	const filterConversationMessages = useCallback(
		(messages: ChatMessage[]): ChatMessage[] => {
			if (messages.length === 0) {
				lastAssistantMessageIdRef.current = null;
				return messages;
			}

			const latestMessage = messages[messages.length - 1];
			if (!latestMessage || latestMessage.sender !== "assistant" || !canUseDatabaseTools) {
				return messages;
			}

			const sqlQuery = extractSqlFromMessage(latestMessage.content);
			if (!sqlQuery || latestMessage.id === lastAssistantMessageIdRef.current) {
				return messages;
			}

			lastAssistantMessageIdRef.current = latestMessage.id;

			if (autoExecuteEnabled) {
				void executeSqlQuery(sqlQuery, 200, "ai");
				return messages;
			}

			setPendingSqlQuery({
				id: `pending-${Date.now()}`,
				query: sqlQuery,
				source: "ai",
				timestamp: new Date().toISOString(),
			});
			setHiddenAssistantMessage(latestMessage);
			setIsSideWindowOpen(true);

			return messages.slice(0, -1);
		},
		[autoExecuteEnabled, canUseDatabaseTools, executeSqlQuery]
	);

	const resetAssistantTracking = useCallback(() => {
		lastAssistantMessageIdRef.current = null;
	}, []);

	useEffect(() => {
		if (autoExecuteEnabled && pendingSqlQuery) {
			void executeSqlQuery(pendingSqlQuery.query, 200, pendingSqlQuery.source);
			setPendingSqlQuery(null);
		}
	}, [autoExecuteEnabled, pendingSqlQuery, executeSqlQuery]);

	const hasPendingSql = useMemo(() => Boolean(pendingSqlQuery), [pendingSqlQuery]);

	return {
		isSideWindowOpen,
		setIsSideWindowOpen,
		sqlEditorValue,
		setSqlEditorValue,
		sqlSchema,
		isSchemaLoading,
		isExecutingSql,
		sqlConsoleError,
		sqlHistory,
		sqlSuggestions,
		sqlSuggestionAnalysis,
		isFetchingSqlSuggestions,
		sqlSuggestionsError,
		pendingSqlQuery,
		hasPendingSql,
		latestAutoResult,
		autoExecuteEnabled,
		executedQueries,
		clearSqlErrors,
		resetSqlSuggestions,
		resetSqlConsoleState,
		refreshDatabaseSchema,
		executeSqlQuery,
		requestSqlSuggestions,
		approvePendingQuery,
		rejectPendingQuery,
		toggleAutoExecute,
		viewSqlInCanvas,
		handleAssistantMessageForSql,
		filterConversationMessages,
		resetAssistantTracking,
	};
};

export default useSqlConsole;

