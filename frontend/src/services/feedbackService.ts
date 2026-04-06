// ─── Feedback Service ────────────────────────────────────────────────────────

import { post, del } from './http';
import type { FeedbackType, FeedbackResponse } from '../types/chat';

export async function submitFeedback(
  messageId: string,
  type: FeedbackType,
  reason?: string
): Promise<FeedbackResponse> {
  return post<FeedbackResponse>(`/messages/${messageId}/feedback/`, { type, reason });
}

export async function deleteFeedback(messageId: string): Promise<{ success: boolean }> {
  return del<{ success: boolean }>(`/messages/${messageId}/feedback/delete/`);
}
