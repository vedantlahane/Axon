// ─── Model Selector ──────────────────────────────────────────────────────────

import React, { useState } from 'react';
import type { LLMModel } from '../../types/models';

interface ModelSelectorProps {
  models: LLMModel[];
  activeModel: string;
  onSelect: (modelId: string) => Promise<void>;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  activeModel,
  onSelect,
}) => {
  const [isSwitching, setIsSwitching] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleSelect = async (id: string) => {
    if (id === activeModel || isSwitching) return;
    setIsSwitching(true);
    try {
      await onSelect(id);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <section className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <span
          className="material-symbols-outlined"
          style={{ color: 'var(--accent-violet-light, #a78bfa)', fontSize: '20px' }}
        >
          smart_toy
        </span>
        <h2 className="text-lg font-semibold text-white">AI Model</h2>
      </div>

      <div className="space-y-3">
        {models.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No models available.
          </p>
        ) : (
          models.map((model) => {
            const isActive = activeModel === model.id;
            return (
              <button
                key={model.id}
                type="button"
                className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-4"
                style={{
                  background: isActive
                    ? 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))'
                    : 'var(--glass-bg, rgba(255, 255, 255, 0.05))',
                  border: `1px solid ${
                    isActive
                      ? 'rgba(124, 58, 237, 0.30)'
                      : 'var(--glass-border, rgba(255, 255, 255, 0.06))'
                  }`,
                }}
                onClick={() => void handleSelect(model.id)}
                disabled={isSwitching || !model.available}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isActive
                      ? 'rgba(124, 58, 237, 0.20)'
                      : 'var(--bg-surface-high, #222a3d)',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: isActive
                        ? 'var(--accent-violet-light)'
                        : 'var(--text-ghost)',
                      fontSize: '20px',
                    }}
                  >
                    smart_toy
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{model.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {model.provider}
                  </p>
                </div>
                {isActive && (
                  <span
                    className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: 'var(--accent-violet-muted)',
                      color: 'var(--accent-violet-light)',
                      border: '1px solid rgba(124, 58, 237, 0.20)',
                    }}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })
        )}

        {/* API Key */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input-glass"
            placeholder="Enter API key"
          />
        </div>
      </div>
    </section>
  );
};

export default ModelSelector;