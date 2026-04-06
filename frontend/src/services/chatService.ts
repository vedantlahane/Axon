// ─── Chat Service ────────────────────────────────────────────────────────────

import { get, post, del, downloadBlob, triggerDownload } from './http';
import type {
  RawConversationSummary,
  RawConversationDetail,
  SendChatPayload,
} from '../types/chat';
import type { SqlResultExport } from '../types/documents';

export async function fetchConversations(): Promise<RawConversationSummary[]> {
  const data = await get<{ conversations: RawConversationSummary[] }>('/conversations/');
  return data.conversations ?? [];
}

export async function fetchConversation(id: string): Promise<RawConversationDetail> {
  return get<RawConversationDetail>(`/conversations/${id}/`);
}

export async function deleteConversation(id: string): Promise<void> {
  await del(`/conversations/${id}/`);
}

export async function sendChatMessage(payload: SendChatPayload): Promise<RawConversationDetail> {
  const body: Record<string, unknown> = { message: payload.message };
  if (payload.conversationId) body.conversation_id = payload.conversationId;
  if (payload.title) body.title = payload.title;
  if (payload.documentIds?.length) body.document_ids = payload.documentIds;
  return post<RawConversationDetail>('/chat/', body);
}

export async function exportConversationDocx(id: string): Promise<void> {
  const blob = await downloadBlob(`/conversations/${id}/export/`);
  triggerDownload(blob, `conversation_${id}.docx`);
}

export async function exportConversationZip(id: string, sqlResults: SqlResultExport[] = []): Promise<void> {
  const blob = await downloadBlob(`/conversations/${id}/export/zip/`, 'POST', { sqlResults });
  triggerDownload(blob, `conversation_${id}_${Date.now()}.zip`);
}

export async function searchConversations(query: string): Promise<RawConversationSummary[]> {
  // Stub — backend endpoint doesn't exist yet. Filter client-side.
  const all = await fetchConversations();
  const q = query.toLowerCase();
  return all.filter(
    (c) => c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)
  );
}
