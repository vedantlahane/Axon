// ─── Model Service ───────────────────────────────────────────────────────────

import { get, post } from './http';
import type { ModelsResponse, SetModelResponse } from '../types/models';

export async function fetchAvailableModels(): Promise<ModelsResponse> {
  try {
    return await get<ModelsResponse>('/models/');
  } catch {
    // Guest fallback
    return { models: [], current: 'gemini' };
  }
}

export async function setCurrentModel(modelId: string): Promise<SetModelResponse> {
  return post<SetModelResponse>('/models/set/', { model: modelId });
}
