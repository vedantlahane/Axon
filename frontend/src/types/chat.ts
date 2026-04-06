// ─── Chat Types ──────────────────────────────────────────────────────────────

export type ChatSender = 'user' | 'assistant';

export interface RawAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  content: string;
  timestamp: string;
  attachments?: RawAttachment[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  summary: string;
  updatedAtISO?: string;
  messageCount?: number;
  messages?: ChatMessage[];
}

export interface RawConversationSummary {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  updatedAtISO?: string;
  messageCount?: number;
}

export interface RawMessage {
  id: string;
  sender: ChatSender;
  content: string;
  timestamp: string;
  attachments?: RawAttachment[];
}

export interface RawConversationDetail extends RawConversationSummary {
  messages: RawMessage[];
}

export interface SendChatPayload {
  message: string;
  conversationId?: string;
  title?: string;
  documentIds?: string[];
}

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
