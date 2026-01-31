import { useState } from "react";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isLikelyLocalUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return value.startsWith('http://localhost') || value.startsWith('http://127.0.0.1');
  }
}

function resolveDefaultApiBase(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return '/api';
}

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
const shouldUseConfiguredBase = configuredBase && (import.meta.env.DEV || !isLikelyLocalUrl(configuredBase));
const API_BASE_URL = normalizeBaseUrl(shouldUseConfiguredBase ? configuredBase! : resolveDefaultApiBase());

export interface RawConversationSummary {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  updatedAtISO?: string;
  messageCount?: number;
}

export interface RawAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface RawMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: RawAttachment[];
}

export interface RawConversationDetail extends RawConversationSummary {
  messages: RawMessage[];
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
}

export interface PasswordResetRequestResult {
  message: string;
  resetToken?: string | null;
}

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

export interface SqlQueryRowsResult {
  type: 'rows';
  columns: string[];
  rows: Array<Array<unknown>>;
  rowCount: number;
  hasMore: boolean;
  executionTimeMs: number;
  connection: {
    label: string;
    mode: DatabaseMode;
  };
}

export interface SqlQueryAckResult {
  type: 'ack';
  rowCount: number;
  message: string;
  executionTimeMs: number;
  connection: {
    label: string;
    mode: DatabaseMode;
  };
}

export type SqlQueryResult = SqlQueryRowsResult | SqlQueryAckResult;

export interface RunSqlQueryPayload {
  query: string;
  limit?: number;
}

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
  connection: {
    label: string;
    mode: DatabaseMode;
  };
}

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
  connection: {
    label: string;
    mode: DatabaseMode;
  };
  schemaIncluded: boolean;
  schemaError?: string;
}

export interface SqlSuggestionRequestPayload {
  query: string;
  includeSchema?: boolean;
  maxSuggestions?: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    const cloned = response.clone();

    try {
      const data = (await cloned.json()) as Record<string, unknown>;
      const extractedError = [data?.error, data?.detail]
        .find((value): value is string => typeof value === 'string' && value.trim().length > 0);

      if (extractedError) {
        errorMessage = extractedError;
      } else if (Object.keys(data ?? {}).length > 0) {
        errorMessage = JSON.stringify(data);
      }
    } catch {
      const text = await response.text();
      if (text) {
        errorMessage = text;
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchConversations(): Promise<RawConversationSummary[]> {
  const response = await fetch(`${API_BASE_URL}/conversations/`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ conversations: RawConversationSummary[] }>(response);
  return data.conversations ?? [];
}

export async function fetchConversation(conversationId: string): Promise<RawConversationDetail> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/`, {
    credentials: 'include',
  });
  return handleResponse<RawConversationDetail>(response);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to delete conversation ${conversationId}`);
  }
}

export interface SendChatPayload {
  message: string;
  conversationId?: string;
  title?: string;
  documentIds?: string[];
}

export async function sendChatMessage(payload: SendChatPayload): Promise<RawConversationDetail> {
  const [count,setCount] = useState(0);
  const body: Record<string, unknown> = {
    message: payload.message,
  };

  if (payload.conversationId) {
    body.conversation_id = payload.conversationId;
  }

  if (payload.title) {
    body.title = payload.title;
  }

  if (payload.documentIds && payload.documentIds.length > 0) {
    body.document_ids = payload.documentIds;
  }

  const response = await fetch(`${API_BASE_URL}/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });


  if(response.status === 205 && count < 3){
    handleResponse<RawConversationDetail>(response);
  }

  return handleResponse<RawConversationDetail>(response);
}

export type UploadedDocument = RawAttachment;

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/documents/`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  return handleResponse<UploadedDocument>(response);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to delete document ${documentId}`);
  }
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends SignInPayload {
  name: string;
}

export async function signUp(payload: SignUpPayload): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ user: UserProfile }>(response);
  return data.user;
}

export async function signIn(payload: SignInPayload): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ user: UserProfile }>(response);
  return data.user;
}

export async function signOut(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to sign out.');
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me/`, {
    credentials: 'include',
  });

  const data = await handleResponse<{ user: UserProfile | null }>(response);
  return data.user ?? null;
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
  const response = await fetch(`${API_BASE_URL}/auth/password/reset/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  return handleResponse<PasswordResetRequestResult>(response);
}

export interface ConfirmPasswordResetPayload {
  token: string;
  password: string;
}

export async function confirmPasswordReset(payload: ConfirmPasswordResetPayload): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/password/reset/confirm/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<{ user: UserProfile }>(response);
  return data.user;
}

export async function fetchDatabaseConnectionSettings(): Promise<DatabaseConnectionEnvelope> {
  const response = await fetch(`${API_BASE_URL}/database/connection/`, {
    credentials: 'include',
  });

  return handleResponse<DatabaseConnectionEnvelope>(response);
}

export async function updateDatabaseConnectionSettings(payload: UpdateDatabaseConnectionPayload): Promise<DatabaseConnectionEnvelope> {
  const response = await fetch(`${API_BASE_URL}/database/connection/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return handleResponse<DatabaseConnectionEnvelope>(response);
}

export async function clearDatabaseConnectionSettings(): Promise<DatabaseConnectionEnvelope> {
  const response = await fetch(`${API_BASE_URL}/database/connection/`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return handleResponse<DatabaseConnectionEnvelope>(response);
}

export async function testDatabaseConnectionSettings(payload: UpdateDatabaseConnectionPayload): Promise<DatabaseConnectionTestResult> {
  const response = await fetch(`${API_BASE_URL}/database/connection/test/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return handleResponse<DatabaseConnectionTestResult>(response);
}

export async function runSqlQuery(payload: RunSqlQueryPayload): Promise<SqlQueryResult> {
  const response = await fetch(`${API_BASE_URL}/database/query/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return handleResponse<SqlQueryResult>(response);
}

export async function fetchDatabaseSchema(): Promise<SqlSchemaPayload> {
  const response = await fetch(`${API_BASE_URL}/database/schema/`, {
    credentials: 'include',
  });

  return handleResponse<SqlSchemaPayload>(response);
}

export async function requestSqlSuggestions(payload: SqlSuggestionRequestPayload): Promise<SqlSuggestionEnvelope> {
  const response = await fetch(`${API_BASE_URL}/database/query/suggestions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return handleResponse<SqlSuggestionEnvelope>(response);
}

// ─────────────────────────────────────────────────────────────────────────────
// Model selection API
// ─────────────────────────────────────────────────────────────────────────────

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  available: boolean;
  isDefault: boolean;
}

export interface ModelsResponse {
  models: LLMModel[];
  current: string;
}

export interface SetModelResponse {
  success: boolean;
  current: string;
  message: string;
}

export async function fetchAvailableModels(): Promise<ModelsResponse> {
  const response = await fetch(`${API_BASE_URL}/models/`, {
    credentials: 'include',
  });
  return handleResponse<ModelsResponse>(response);
}

export async function setCurrentModel(modelId: string): Promise<SetModelResponse> {
  const response = await fetch(`${API_BASE_URL}/models/set/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ model: modelId }),
  });
  return handleResponse<SetModelResponse>(response);
}

// ─────────────────────────────────────────────────────────────────────────────
// Message feedback API
// ─────────────────────────────────────────────────────────────────────────────

export type FeedbackType = 'like' | 'dislike' | 'report';

export interface MessageFeedback {
  id: number;
  type: FeedbackType;
  messageId: string;
  createdAt: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedback: MessageFeedback;
}

export async function submitMessageFeedback(
  messageId: string,
  type: FeedbackType,
  reason?: string,
): Promise<FeedbackResponse> {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}/feedback/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ type, reason }),
  });
  return handleResponse<FeedbackResponse>(response);
}

export async function deleteMessageFeedback(messageId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}/feedback/delete/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<{ success: boolean }>(response);
}

// ─────────────────────────────────────────────────────────────────────────────
// User preferences API
// ─────────────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  preferredModel: string;
  theme: string;
  updatedAt: string;
}

export interface PreferencesResponse {
  preferences: UserPreferences;
}

export async function fetchUserPreferences(): Promise<PreferencesResponse> {
  const response = await fetch(`${API_BASE_URL}/preferences/`, {
    credentials: 'include',
  });
  return handleResponse<PreferencesResponse>(response);
}

export async function updateUserPreferences(
  prefs: Partial<Pick<UserPreferences, 'preferredModel' | 'theme'>>,
): Promise<PreferencesResponse> {
  const response = await fetch(`${API_BASE_URL}/preferences/update/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(prefs),
  });
  return handleResponse<PreferencesResponse>(response);
}

// ─────────────────────────────────────────────────────────────────────────────
// User profile API
// ─────────────────────────────────────────────────────────────────────────────

export async function updateUserProfile(
  data: { name?: string; email?: string },
): Promise<{ user: UserProfile }> {
  const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<{ user: UserProfile }>(response);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/password/change/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse<{ success: boolean; message: string }>(response);
}

// Export conversation to DOCX
export async function exportConversationDocx(conversationId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/export/`, {
    method: 'GET',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to export conversation');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation_${conversationId}.docx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Export SQL results to XLSX
export async function exportSqlResultsXlsx(
  query: string,
  columns: string[],
  rows: Record<string, unknown>[]
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/database/export/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ query, columns, rows }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to export SQL results');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sql_results_${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Export complete conversation as ZIP (with DOCX + all SQL results as XLSX)
export interface SqlResultExport {
  query: string;
  columns: string[];
  rows: Record<string, unknown>[];
}

export async function exportConversationZip(
  conversationId: number,
  sqlResults: SqlResultExport[] = []
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/export/zip/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ sqlResults }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to export conversation');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation_${conversationId}_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Conversation document types
export interface ConversationDocument {
  id: number;
  original_name: string;
  size: number;
  created_at: string;
  message_id: number;
  message_role: string;
  message_preview: string;
}

// Get all documents attached to a conversation
export async function getConversationDocuments(conversationId: number): Promise<{
  conversation_id: number;
  documents: ConversationDocument[];
  count: number;
}> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/documents/`, {
    method: 'GET',
    credentials: 'include',
  });
  return handleResponse(response);
}

// Delete a document from a conversation
export async function deleteConversationDocument(
  conversationId: number,
  documentId: number
): Promise<{
  status: string;
  file_deleted: boolean;
  message: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/documents/${documentId}/`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );
  return handleResponse(response);
}

// Delete conversation with all files
export async function deleteConversationWithFiles(
  conversationId: number,
  deleteFiles = true
): Promise<{
  status: string;
  files_deleted: number;
}> {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/?delete_files=${deleteFiles}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );
  return handleResponse(response);
}
