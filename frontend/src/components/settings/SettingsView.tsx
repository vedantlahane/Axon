// ─── Settings View ───────────────────────────────────────────────────────────
// 5 stacked glass cards: Profile, AI Model, Database, Appearance, Danger Zone.
// Matches FRONTEND_CONTEXT.md §5.5 "Settings (/settings)"

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../../lib/animations';
import PageContainer from '../layout/PageContainer';
import ProfileSection from './ProfileSection';
import ModelSelector from './ModelSelector';
import DatabaseSection from './DatabaseSection';
import AppearanceSection from './AppearanceSection';
import DangerSection from './DangerSection';
import { useAuth } from '../../stores/AuthProvider';
import { useDatabaseStore } from '../../stores/databaseStore';
import { useChatStore } from '../../stores/chatStore';
import { fetchAvailableModels, setCurrentModel } from '../../services/modelService';
import type { LLMModel } from '../../types/models';

const SettingsView: React.FC = () => {
  const { currentUser, isAuthenticated, openAuthModal, updateProfile, signOut } =
    useAuth();
  const { connection, loadConnection, saveConnection, testConnection } =
    useDatabaseStore();
  const clearConversations = useChatStore((s) => s.clearConversations);

  const [models, setModels] = useState<LLMModel[]>([]);
  const [activeModel, setActiveModel] = useState('');

  useEffect(() => {
    fetchAvailableModels()
      .then((res) => {
        setModels(res.models);
        setActiveModel(res.current);
      })
      .catch(console.error);
    void loadConnection();
  }, [loadConnection]);

  const handleModelSwitch = async (modelId: string) => {
    try {
      const res = await setCurrentModel(modelId);
      setActiveModel(res.current);
    } catch (err) {
      console.error('Model switch failed:', err);
    }
  };

  return (
    <PageContainer maxWidth="720px">
      <motion.div initial="initial" animate="animate" variants={staggerContainer}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div className="mb-10" variants={fadeUp}>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Settings
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Configure your Axon workspace.
          </p>
        </motion.div>

        {/* ── 5 Stacked Cards ─────────────────────────────────────────── */}
        <div className="space-y-8">
          {/* 1. Profile */}
          <motion.div variants={fadeUp}>
            <ProfileSection
              displayName={currentUser?.name ?? ''}
              email={currentUser?.email ?? ''}
              isAuthenticated={isAuthenticated}
              onSave={async (name) => {
                await updateProfile({ name });
              }}
              onSignIn={() => openAuthModal('signin')}
            />
          </motion.div>

          {/* 2. AI Model */}
          <motion.div variants={fadeUp}>
            <ModelSelector
              models={models}
              activeModel={activeModel}
              onSelect={handleModelSwitch}
            />
          </motion.div>

          {/* 3. Database */}
          <motion.div variants={fadeUp}>
            <DatabaseSection
              connection={connection}
              onSave={saveConnection}
              onTest={testConnection}
            />
          </motion.div>

          {/* 4. Appearance */}
          <motion.div variants={fadeUp}>
            <AppearanceSection />
          </motion.div>

          {/* 5. Danger Zone */}
          <motion.div variants={fadeUp}>
            <DangerSection
              onClearHistory={clearConversations}
              onDeleteAccount={() => {
                void signOut();
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default SettingsView;