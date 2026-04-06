import React, { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface DatabaseSectionProps {
  connectionUrl?: string;
  isConnected?: boolean;
  onConnect?: (url: string) => Promise<void>;
  onTest?: (url: string) => Promise<boolean>;
}

const DatabaseSection: React.FC<DatabaseSectionProps> = ({
  connectionUrl = '',
  isConnected = false,
  onConnect,
  onTest,
}) => {
  const [url, setUrl] = useState(connectionUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    const result = await onTest?.(url);
    setTestResult(result ?? false);
    setIsLoading(false);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    await onConnect?.(url);
    setIsLoading(false);
  };

  return (
    <div className="liquid-glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-on-surface">Database Connection</h2>
        <Badge variant={isConnected ? 'success' : 'warning'} size="md">
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
      <div className="space-y-4">
        <Input
          label="Connection URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="postgresql://user:password@host:port/db"
        />
        {testResult !== null && (
          <div
            className={`p-3 rounded-lg text-sm ${
              testResult ? 'bg-emerald-500/10 text-emerald-300' : 'bg-error/10 text-error'
            }`}
          >
            {testResult ? '✓ Connection successful' : '✗ Connection failed'}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" loading={isLoading} onClick={handleTest}>
            Test Connection
          </Button>
          <Button variant="primary" loading={isLoading} onClick={handleConnect}>
            Save Connection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSection;
