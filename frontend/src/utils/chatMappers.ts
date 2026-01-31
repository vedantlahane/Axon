import type { RawConversationSummary, RawMessage } from "../services/chatApi";
import type { ChatMessage, ConversationSummary } from "../types/chat";

export const mapMessage = (raw: RawMessage): ChatMessage => ({
  id: raw.id,
  sender: raw.sender,
  content: raw.content,
  timestamp: raw.timestamp,
  attachments: raw.attachments ?? [],
});

export const mapSummary = (raw: RawConversationSummary): ConversationSummary => ({
  id: raw.id,
  title: raw.title || "New chat",
  summary: raw.summary ?? "",
  updatedAt: raw.updatedAt,
  updatedAtISO: raw.updatedAtISO,
  messageCount: raw.messageCount ?? 0,
});

export const sortSummaries = (items: ConversationSummary[]): ConversationSummary[] => {
  return [...items].sort((a, b) => {
    const aTime = a.updatedAtISO ? Date.parse(a.updatedAtISO) : Date.parse(a.updatedAt);
    const bTime = b.updatedAtISO ? Date.parse(b.updatedAtISO) : Date.parse(b.updatedAt);
    return bTime - aTime;
  });
};
