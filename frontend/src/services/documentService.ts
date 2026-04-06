// ─── Document Service ────────────────────────────────────────────────────────

import { get, del, upload } from './http';
import type { UploadedDocument, ConversationDocumentsResponse } from '../types/documents';

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const formData = new FormData();
  formData.append('file', file);
  return upload<UploadedDocument>('/documents/', formData);
}

export async function deleteDocument(documentId: string): Promise<void> {
  await del(`/documents/${documentId}/`);
}

export async function fetchDocuments(): Promise<UploadedDocument[]> {
  // Stub — backend may not have a list-all endpoint yet.
  // Falls back to empty array.
  try {
    const data = await get<{ documents: UploadedDocument[] }>('/documents/');
    return data.documents ?? [];
  } catch {
    return [];
  }
}

export async function getConversationDocuments(conversationId: string): Promise<ConversationDocumentsResponse> {
  return get<ConversationDocumentsResponse>(`/conversations/${conversationId}/documents/`);
}

export async function deleteConversationDocument(
  conversationId: string,
  documentId: number
): Promise<{ status: string; file_deleted: boolean; message: string }> {
  return del(`/conversations/${conversationId}/documents/${documentId}/`);
}
