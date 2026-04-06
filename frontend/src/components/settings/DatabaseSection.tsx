// ─── Database Section (Bug Fix) ──────────────────────────────────────────────
// Fixed: connectionUrl → connectionString

import React, { useState } from 'react';
import Icon from '../ui/Icon';
import type { DatabaseConnectionSettings } from '../../types/database';
import type { ConnectionTestResult } from '../../stores/databaseStore';

interface DatabaseSectionProps {
  connection: DatabaseConnectionSettings | null;
  onSave?: (settings: DatabaseConnectionSettings) => Promise<void>;
  onTest?: (url?: string) => Promise<ConnectionTestResult>;
}

const DatabaseSection: React.FC<DatabaseSectionProps> = ({
  connection,
  onSave,
  onTest,
}) => {
  // BUG FIX: was connection?.connectionUrl (doesn't exist)
  const [url, setUrl] = useState(connection?.connectionString ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const handleTest = async () => {
    if (!onTest) return;
    setIsLoading(true);
    try {
      const result = await onTest(url);
      setTestResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!onSave || !connection) return;
    setIsLoading(true);
    try {
      await onSave({ ...connection, connectionString: url });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Icon
            name="database"
            style={{ color: 'var(--accent-violet-light, #a78bfa)', fontSize: 20 }}
          />
          <h2 className="text-lg font-semibold text-white">Database</h2>
        </div>
        <span
          className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium"
          style={{
            background: connection
              ? 'rgba(52, 211, 153, 0.10)'
              : 'rgba(251, 191, 36, 0.10)',
            color: connection
              ? 'var(--color-success)'
              : 'var(--color-warning)',
            border: `1px solid ${
              connection
                ? 'rgba(52, 211, 153, 0.20)'
                : 'rgba(251, 191, 36, 0.20)'
            }`,
          }}
        >
          {connection ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Connection URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input-glass font-mono text-xs"
            placeholder="postgresql://user:password@host:port/db"
          />
        </div>

        {testResult && (
          <div
            className={`${testResult.success ? 'glass-success' : 'glass-error'} rounded-lg p-3 text-xs`}
            style={{
              color: testResult.success
                ? 'var(--color-success)'
                : 'var(--color-error)',
            }}
          >
            {testResult.success ? '✓' : '✗'} {testResult.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            className="btn-glass text-sm"
            disabled={isLoading || !url}
            onClick={() => void handleTest()}
          >
            Test Connection
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={isLoading || !url}
            onClick={() => void handleSave()}
          >
            Save Connection
          </button>
        </div>
      </div>
    </section>
  );
};

export default DatabaseSection;