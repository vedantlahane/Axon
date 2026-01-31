import type { RawAttachment } from "../services/chatApi";

export type ChatSender = "user" | "assistant";

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
