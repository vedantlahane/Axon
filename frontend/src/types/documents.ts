// ─── Document Types ──────────────────────────────────────────────────────────

export interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface ConversationDocument {
  id: number;
  original_name: string;
  size: number;
  created_at: string;
  message_id: number;
  message_role: string;
  message_preview: string;
}

export interface ConversationDocumentsResponse {
  conversation_id: number;
  documents: ConversationDocument[];
  count: number;
}

export interface SqlResultExport {
  query: string;
  columns: string[];
  rows: Record<string, unknown>[];
}
