// ─── Graph Service ───────────────────────────────────────────────────────────
// Stubs for system graph API — backend endpoints may not exist yet.

import { get, post, patch } from './http';
import type { SystemGraphOut, StateOverlayIn, SystemGraphSnapshot } from '../types/graph';

export async function fetchSystemGraph(): Promise<SystemGraphOut> {
  try {
    return await get<SystemGraphOut>('/system-graph/');
  } catch {
    return { graph: null };
  }
}

export async function saveSystemGraph(vrdString: string): Promise<SystemGraphOut> {
  return post<SystemGraphOut>('/system-graph/', { vrdString });
}

export async function updateStateOverlay(payload: StateOverlayIn): Promise<SystemGraphOut> {
  return patch<SystemGraphOut>('/system-graph/state', payload);
}

export async function fetchGraphHistory(): Promise<SystemGraphSnapshot[]> {
  try {
    const data = await get<{ snapshots: SystemGraphSnapshot[] }>('/system-graph/history/');
    return data.snapshots ?? [];
  } catch {
    return [];
  }
}
