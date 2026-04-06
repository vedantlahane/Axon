// ─── Model Types ─────────────────────────────────────────────────────────────

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
