// ─── System Graph Types ──────────────────────────────────────────────────────

export type NodeStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface NodeState {
  status: NodeStatus;
  metric?: string;
  label?: string;
}

export interface StateOverlay {
  [nodeId: string]: NodeState;
}

export interface SystemGraph {
  id: string;
  userId: string;
  vrdString: string;
  stateOverlay: StateOverlay;
  updatedAt: string;
}

export interface SystemGraphSnapshot {
  id: string;
  graphId: string;
  vrdString: string;
  stateOverlay: StateOverlay;
  capturedAt: string;
}

export interface SystemGraphOut {
  graph: SystemGraph | null;
}

export interface StateOverlayIn {
  stateOverlay: StateOverlay;
}
