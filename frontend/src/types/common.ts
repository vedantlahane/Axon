// ─── Shared Types ────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Envelope<T> {
  data: T;
  success: boolean;
  message?: string;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
