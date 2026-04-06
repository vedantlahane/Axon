// ─── Database Types ──────────────────────────────────────────────────────────

export type DatabaseMode = 'sqlite' | 'url';

export interface DatabaseConnectionSettings {
  mode: DatabaseMode;
  displayName: string;
  label: string;
  sqlitePath?: string | null;
  resolvedSqlitePath?: string | null;
  connectionString?: string | null;
  isDefault: boolean;
  source: 'user' | 'environment';
}

export interface DatabaseConnectionEnvelope {
  connection: DatabaseConnectionSettings | null;
  availableModes: DatabaseMode[];
  environmentFallback?: DatabaseConnectionSettings | null;
  tested?: boolean;
}

export interface UpdateDatabaseConnectionPayload {
  mode: DatabaseMode;
  displayName?: string;
  sqlitePath?: string;
  connectionString?: string;
  testConnection?: boolean;
}

export interface DatabaseConnectionTestResult {
  ok: boolean;
  message: string;
  resolvedSqlitePath?: string | null;
}

export interface DatabaseUploadResult {
  path: string;
  filename: string;
  size: number;
}

// ─── SQL Query ───────────────────────────────────────────────────────────────

export interface SqlQueryRowsResult {
  type: 'rows';
  columns: string[];
  rows: Array<Array<unknown>>;
  rowCount: number;
  hasMore: boolean;
  executionTimeMs: number;
  connection: { label: string; mode: DatabaseMode };
}

export interface SqlQueryAckResult {
  type: 'ack';
  rowCount: number;
  message: string;
  executionTimeMs: number;
  connection: { label: string; mode: DatabaseMode };
}

export interface SqlQueryErrorResult {
  type: 'error';
  rowCount: number;
  message: string;
  errorCode?: string;
  executionTimeMs: number;
  connection: { label: string; mode: DatabaseMode };
}

export type SqlQueryResult = SqlQueryRowsResult | SqlQueryAckResult | SqlQueryErrorResult;

export interface RunSqlQueryPayload {
  query: string;
  limit?: number;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

export interface SqlSchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: unknown;
  primaryKey?: boolean;
}

export interface SqlSchemaForeignKey {
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface SqlSchemaTable {
  name: string;
  columns: SqlSchemaColumn[];
  foreignKeys: SqlSchemaForeignKey[];
}

export interface SqlSchemaView {
  name: string;
  columns: SqlSchemaColumn[];
}

export interface SqlSchemaPayload {
  schema: string | null;
  tables: SqlSchemaTable[];
  views: SqlSchemaView[];
  generatedAt: string;
  connection: { label: string; mode: DatabaseMode };
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

export interface SqlQuerySuggestion {
  id: string;
  title: string;
  summary: string;
  query: string;
  rationale?: string;
  warnings?: string[];
}

export interface SqlSuggestionEnvelope {
  originalQuery: string;
  analysis?: string | null;
  suggestions: SqlQuerySuggestion[];
  generatedAt: string;
  connection: { label: string; mode: DatabaseMode };
  schemaIncluded: boolean;
  schemaError?: string;
}

export interface SqlSuggestionRequestPayload {
  query: string;
  includeSchema?: boolean;
  maxSuggestions?: number;
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface SqlQueryHistoryEntry {
  id: string;
  query: string;
  executedAt: string;
  result?: SqlQueryResult;
  executionTimeMs?: number;
}

export interface PendingQuery {
  id: string;
  query: string;
  source: 'assistant' | 'suggestion';
  timestamp: string;
}
