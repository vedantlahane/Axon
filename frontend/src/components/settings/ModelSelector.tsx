import React, { useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ModelSelectorProps {
  currentModel?: string;
  onSave?: (model: string, apiKey: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel = 'Gemini 2.5 Pro', onSave }) => {
  const [selected, setSelected] = useState(currentModel);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const models = [
    { id: 'gemini', name: 'Gemini 2.5 Pro', status: 'Active', icon: 'smart_toy' },
    { id: 'gpt4', name: 'GPT-4o', status: 'Available', icon: 'smart_toy' },
    { id: 'claude', name: 'Claude 3.5 Sonnet', status: 'Available', icon: 'smart_toy' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await onSave?.(selected, apiKey);
    setIsSaving(false);
  };

  return (
    <div className="liquid-glass rounded-xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-on-surface mb-6">AI Model</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelected(model.name)}
              className={`p-3 rounded-lg border transition-all ${
                selected === model.name
                  ? 'liquid-glass border-violet-500 bg-violet-500/10'
                  : 'border-surface-variant hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">{model.icon}</span>
                  <p className="font-medium text-on-surface">{model.name}</p>
                </div>
                <Badge variant={model.status === 'Active' ? 'success' : 'info'} size="sm">
                  {model.status}
                </Badge>
              </div>
            </button>
          ))}
        </div>
        <Input label="API Key" type="password" placeholder="Enter API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        <Button variant="primary" loading={isSaving} onClick={handleSave}>
          Save Model
        </Button>
      </div>
    </div>
  );
};

export default ModelSelector;
