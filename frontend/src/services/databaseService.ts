// ─── Database Service ────────────────────────────────────────────────────────

import { get, post, del, downloadBlob, triggerDownload, upload } from './http';
import type {
  DatabaseConnectionEnvelope,
  UpdateDatabaseConnectionPayload,
  DatabaseConnectionTestResult,
  DatabaseUploadResult,
  SqlQueryResult,
  RunSqlQueryPayload,
  SqlSchemaPayload,
  SqlSuggestionEnvelope,
  SqlSuggestionRequestPayload,
} from '../types/database';

export async function fetchConnectionSettings(): Promise<DatabaseConnectionEnvelope> {
  return get<DatabaseConnectionEnvelope>('/database/connection/');
}

export async function updateConnectionSettings(payload: UpdateDatabaseConnectionPayload): Promise<DatabaseConnectionEnvelope> {
  return post<DatabaseConnectionEnvelope>('/database/connection/', payload);
}

export async function clearConnectionSettings(): Promise<DatabaseConnectionEnvelope> {
  return del<DatabaseConnectionEnvelope>('/database/connection/');
}

export async function testConnection(payload: UpdateDatabaseConnectionPayload): Promise<DatabaseConnectionTestResult> {
  return post<DatabaseConnectionTestResult>('/database/connection/test/', payload);
}

export async function uploadDatabase(file: File): Promise<DatabaseUploadResult> {
  const formData = new FormData();
  formData.append('database', file);
  return upload<DatabaseUploadResult>('/database/upload/', formData);
}

export async function runSqlQuery(payload: RunSqlQueryPayload): Promise<SqlQueryResult> {
  return post<SqlQueryResult>('/database/query/', payload);
}

export async function fetchSchema(): Promise<SqlSchemaPayload> {
  return get<SqlSchemaPayload>('/database/schema/');
}

export async function requestSuggestions(payload: SqlSuggestionRequestPayload): Promise<SqlSuggestionEnvelope> {
  return post<SqlSuggestionEnvelope>('/database/query/suggestions/', payload);
}

export async function exportSqlResults(
  query: string,
  columns: string[],
  rows: Record<string, unknown>[]
): Promise<void> {
  const blob = await downloadBlob('/database/export/', 'POST', { query, columns, rows });
  triggerDownload(blob, `sql_results_${Date.now()}.xlsx`);
}
