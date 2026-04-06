// ─── Settings View ───────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageContainer from '../layout/PageContainer';
import { useAuth } from '../../stores/AuthProvider';
import { useTheme } from '../../stores/ThemeProvider';
import { useDatabaseStore } from '../../stores/databaseStore';
import { fetchAvailableModels, setCurrentModel } from '../../services/modelService';
import type { LLMModel } from '../../types/models';

const SettingsView: React.FC = () => {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const { theme, setTheme } = useTheme();
  const { connection, loadConnection } = useDatabaseStore();

  const [models, setModels] = useState<LLMModel[]>([]);
  const [activeModel, setActiveModel] = useState<string>('');
  const [isModelSwitching, setIsModelSwitching] = useState(false);

  useEffect(() => {
    fetchAvailableModels().then((res) => {
      setModels(res.models);
      setActiveModel(res.current);
    }).catch(console.error);
    void loadConnection();
  }, [loadConnection]);

  const handleModelSwitch = async (modelId: string) => {
    setIsModelSwitching(true);
    try {
      const res = await setCurrentModel(modelId);
      setActiveModel(res.current);
    } catch (err) {
      console.error('Model switch failed:', err);
    } finally {
      setIsModelSwitching(false);
    }
  };

  const sections = [
    {
      id: 'profile',
      icon: 'person',
      title: 'Profile',
      content: (
        <div className="space-y-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: 'var(--violet-soft)', color: 'var(--violet-bright)' }}>
                  {(currentUser?.name ?? 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="title-md text-white">{currentUser?.name}</p>
                  <p className="body-sm" style={{ color: 'var(--text-secondary)' }}>{currentUser?.email}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="body-md mb-4" style={{ color: 'var(--text-secondary)' }}>Sign in to access your profile settings.</p>
              <button className="btn-primary" onClick={() => openAuthModal('signin')} type="button">Sign In</button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'model',
      icon: 'smart_toy',
      title: 'AI Model',
      content: (
        <div className="space-y-3">
          {models.length === 0 ? (
            <p className="body-sm" style={{ color: 'var(--text-muted)' }}>No models available.</p>
          ) : (
            models.map((model) => (
              <button
                key={model.id}
                type="button"
                className="w-full glass-card p-4 flex items-center gap-4 text-left"
                style={{
                  borderColor: activeModel === model.id ? 'rgba(124,58,237,0.3)' : undefined,
                  background: activeModel === model.id ? 'var(--violet-soft)' : undefined,
                }}
                onClick={() => void handleModelSwitch(model.id)}
                disabled={isModelSwitching || !model.available}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: activeModel === model.id ? 'var(--violet-soft)' : 'var(--surface-container-high)' }}>
                  <span className="material-symbols-outlined" style={{ color: activeModel === model.id ? 'var(--violet-bright)' : 'var(--text-ghost)', fontSize: '20px' }}>smart_toy</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{model.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{model.provider}</p>
                </div>
                {activeModel === model.id && (
                  <span className="badge badge-violet">Active</span>
                )}
              </button>
            ))
          )}
        </div>
      ),
    },
    {
      id: 'database',
      icon: 'database',
      title: 'Database',
      content: (
        <div className="space-y-4">
          {connection ? (
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.1)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '20px' }}>check_circle</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{connection.displayName || connection.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{connection.mode} · {connection.source === 'environment' ? 'Environment' : 'User configured'}</p>
              </div>
              <span className="badge badge-success">Connected</span>
            </div>
          ) : (
            <div className="liquid-glass rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-3xl mb-2 block" style={{ color: 'var(--text-ghost)' }}>database</span>
              <p className="body-md mb-4" style={{ color: 'var(--text-secondary)' }}>No database connected.</p>
              <p className="body-sm" style={{ color: 'var(--text-muted)' }}>Connect a database to enable SQL tools in chat.</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'appearance',
      icon: 'palette',
      title: 'Appearance',
      content: (
        <div className="flex gap-3">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className="glass-card p-4 flex-1 text-center"
              style={{
                borderColor: theme === t ? 'rgba(124,58,237,0.3)' : undefined,
                background: theme === t ? 'var(--violet-soft)' : undefined,
              }}
              onClick={() => setTheme(t)}
            >
              <span className="material-symbols-outlined text-2xl mb-2 block" style={{ color: theme === t ? 'var(--violet-bright)' : 'var(--text-ghost)' }}>
                {t === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <p className="text-sm font-medium text-white capitalize">{t}</p>
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <PageContainer maxWidth="640px">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-10">
          <h1 className="display-sm text-white mb-2">Settings</h1>
          <p className="body-md" style={{ color: 'var(--text-secondary)' }}>Configure your Axon workspace.</p>
        </div>

        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="liquid-glass rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="material-symbols-outlined" style={{ color: 'var(--violet-bright)', fontSize: '20px' }}>{section.icon}</span>
                <h2 className="title-md text-white">{section.title}</h2>
              </div>
              {section.content}
            </motion.section>
          ))}
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default SettingsView;
