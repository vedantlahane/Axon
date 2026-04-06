import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MainPanel from './components/layout/MainPanel';
import AuthModal from './components/modals/AuthModal';
import DatabaseConnectionModal from './components/modals/DatabaseConnectionModal';
import { type SqlSideWindowProps } from './components/Canvas';
import useAuth from './hooks/useAuth';
import useConversationManager from './hooks/useConversationManager';
import useDatabaseSettings from './hooks/useDatabaseSettings';
import useSqlConsole from './hooks/useSqlConsole';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import {
  type UpdateDatabaseConnectionPayload,
} from './services/chatApi';
import type { ChatMessage } from './types/chat';
import { ToastContainer, type ToastMessage } from './components/Toast';

const deriveErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const createToast = (type: 'success' | 'error' | 'info' | 'warning', message: string): ToastMessage => ({
  id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type,
  message,
});

const App = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'history'>('chat');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const startNewChatRef = useRef<() => void>(() => undefined);

  const showToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setToasts((prev) => [...prev, createToast(type, message)]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const {
    currentUser,
    authModalState,
    openAuthModal,
    closeAuthModal,
    isAuthSubmitting,
    authError,
    authSuccessMessage,
    signIn: signInUser,
    signUp: signUpUser,
    signOut: signOutUser,
    requestPasswordReset: requestPasswordResetUser,
    confirmPasswordReset: confirmPasswordResetUser,
  } = useAuth({
    onPasswordResetComplete: async () => {
      startNewChatRef.current();
    },
  });

  const {
    databaseModalOpen,
    databaseSettings,
    databaseModes,
    environmentFallback,
    isDatabaseLoading,
    isDatabaseBusy,
    databaseFeedback,
    openDatabaseSettings,
    closeDatabaseModal,
    saveDatabaseSettings,
    testDatabaseSettings,
    disconnectDatabase,
    setDatabaseModalOpen,
    setDatabaseFeedback,
  } = useDatabaseSettings({
    currentUser,
    deriveErrorMessage,
  });

  const activeConnection = databaseSettings ?? environmentFallback;
  const canUseDatabaseTools = Boolean(activeConnection);
  const appendMessageRef = useRef<(message: ChatMessage) => void>(() => undefined);

  const {
    isSideWindowOpen,
    setIsSideWindowOpen,
    sqlEditorValue,
    setSqlEditorValue,
    sqlSchema,
    isSchemaLoading,
    isExecutingSql,
    sqlConsoleError,
    sqlHistory,
    sqlSuggestions,
    sqlSuggestionAnalysis,
    isFetchingSqlSuggestions,
    sqlSuggestionsError,
    pendingSqlQuery,
    latestAutoResult,
    autoExecuteEnabled,
    executedQueries,
    clearSqlErrors,
    resetSqlSuggestions,
    resetSqlConsoleState,
    refreshDatabaseSchema,
    executeSqlQuery,
    requestSqlSuggestions,
    approvePendingQuery,
    rejectPendingQuery,
    toggleAutoExecute,
    viewSqlInCanvas,
    handleAssistantMessageForSql,
    filterConversationMessages,
    resetAssistantTracking,
  } = useSqlConsole({
    canUseDatabaseTools,
    onRevealMessage: (message) => appendMessageRef.current?.(message),
  });

  const {
    historyConversations,
    selectedHistoryId,
    currentMessages,
    isChatLoading,
    inputSessionKey,
    startNewChat,
    sendMessage,
    selectHistoryConversation,
    deleteConversation,
    appendMessage,
    clearConversations,
  } = useConversationManager({
    currentUser,
    openAuthModal,
    filterConversationMessages,
  });

  useEffect(() => {
    appendMessageRef.current = appendMessage;
    startNewChatRef.current = () => {
      startNewChat();
      setCurrentView('chat');
    };
  }, [appendMessage, startNewChat]);

  useEffect(() => {
    if (currentMessages.length === 0) {
      resetAssistantTracking();
      return;
    }
    const latest = currentMessages[currentMessages.length - 1];
    if (!latest) return;
    handleAssistantMessageForSql(latest);
  }, [currentMessages, handleAssistantMessageForSql, resetAssistantTracking]);

  const handleOpenDatabaseSettings = () => {
    if (!currentUser) { openAuthModal('signin'); return; }
    void openDatabaseSettings();
  };

  const handleToggleSideWindow = () => {
    if (!currentUser) { openAuthModal('signin'); return; }
    if (!canUseDatabaseTools) { handleOpenDatabaseSettings(); return; }
    clearSqlErrors();
    if (!isSideWindowOpen) {
      resetSqlSuggestions();
      if (!sqlSchema) void refreshDatabaseSchema();
    }
    setIsSideWindowOpen((prev) => !prev);
  };

  const handleCollapseSideWindow = () => { setIsSideWindowOpen(false); clearSqlErrors(); };

  const handleSaveDatabaseSettings = async (payload: UpdateDatabaseConnectionPayload) => {
    const ok = await saveDatabaseSettings(payload);
    if (ok) resetSqlConsoleState();
  };

  const handleTestDatabaseSettings = async (payload: UpdateDatabaseConnectionPayload) => {
    await testDatabaseSettings(payload);
  };

  const handleDisconnectDatabase = async () => {
    const ok = await disconnectDatabase();
    if (ok) resetSqlConsoleState({ close: true });
  };

  const handleStartNewChat = useCallback(() => {
    startNewChat();
    setCurrentView('chat');
  }, [startNewChat]);

  const handleSignOut = async () => {
    await signOutUser();
    clearConversations();
    handleStartNewChat();
    setDatabaseModalOpen(false);
    setDatabaseFeedback(null);
    resetSqlConsoleState({ close: true });
  };

  const handleViewChange = useCallback((view: 'chat' | 'history') => {
    setCurrentView(view);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string, options?: { documentIds?: string[] }) => {
      await sendMessage(content, options);
      setCurrentView('chat');
    },
    [sendMessage]
  );

  const handleSelectHistoryConversation = useCallback(
    async (conversationId: string) => {
      await selectHistoryConversation(conversationId);
      setCurrentView('chat');
    },
    [selectHistoryConversation]
  );

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => { await deleteConversation(conversationId); },
    [deleteConversation]
  );

  const databaseSummary = (() => {
    if (!currentUser) return 'Sign in';
    if (isDatabaseLoading) return 'Loading...';
    if (activeConnection) return activeConnection.displayName || activeConnection.label || 'Connected';
    return 'Select database';
  })();

  const shortcuts = useMemo(() => [
    { key: 'n', ctrl: true, handler: handleStartNewChat },
    { key: 'h', ctrl: true, shift: true, handler: () => handleViewChange('history') },
  ], [handleStartNewChat, handleViewChange]);

  useKeyboardShortcuts(shortcuts);

  const sqlConnectionSummary = activeConnection
    ? activeConnection.displayName || activeConnection.label || 'Connected database'
    : 'Database not configured';

  const sideWindowProps: SqlSideWindowProps = {
    isOpen: isSideWindowOpen,
    onCollapse: handleCollapseSideWindow,
    connectionSummary: sqlConnectionSummary,
    schema: sqlSchema,
    isSchemaLoading,
    onRefreshSchema: refreshDatabaseSchema,
    onExecuteQuery: executeSqlQuery,
    isExecuting: isExecutingSql,
    history: sqlHistory,
    errorMessage: sqlConsoleError,
    onRequestSuggestions: requestSqlSuggestions,
    isSuggesting: isFetchingSqlSuggestions,
    suggestions: sqlSuggestions,
    suggestionsError: sqlSuggestionsError,
    suggestionAnalysis: sqlSuggestionAnalysis,
    queryText: sqlEditorValue,
    onChangeQuery: setSqlEditorValue,
    pendingQuery: pendingSqlQuery,
    onApprovePendingQuery: approvePendingQuery,
    onRejectPendingQuery: rejectPendingQuery,
    autoExecuteEnabled,
    onToggleAutoExecute: toggleAutoExecute,
    latestAutoResult,
  };

  return (
    <div className="app-shell">
      {/* Ambient Orbs — Stitch atmospheric depth */}
      <div className="ambient-orb" style={{ width: 600, height: 600, background: 'rgba(255,255,255,0.05)', top: '-10%', left: '-5%' }} />
      <div className="ambient-orb" style={{ width: 500, height: 500, background: 'rgba(139, 92, 246, 0.05)', bottom: '10%', right: '-5%' }} />
      <div className="ambient-orb" style={{ width: 400, height: 400, background: 'rgba(255,255,255,0.03)', top: '40%', left: '30%' }} />

      <MainPanel
        currentView={currentView}
        onViewChange={handleViewChange}
        messages={currentMessages}
        historyConversations={historyConversations}
        selectedHistoryId={selectedHistoryId}
        onSelectHistory={handleSelectHistoryConversation}
        onSendMessage={handleSendMessage}
        onStartNewChat={handleStartNewChat}
        isChatLoading={isChatLoading}
        onDeleteConversation={handleDeleteConversation}
        inputSessionKey={inputSessionKey}
        isAuthenticated={Boolean(currentUser)}
        currentUser={currentUser}
        onOpenAuthModal={openAuthModal}
        onSignOut={handleSignOut}
        onOpenDatabaseSettings={handleOpenDatabaseSettings}
        databaseSummary={databaseSummary}
        onToggleSideWindow={handleToggleSideWindow}
        isSideWindowOpen={isSideWindowOpen}
        canUseDatabaseTools={canUseDatabaseTools}
        sideWindow={sideWindowProps}
        onViewSqlInCanvas={viewSqlInCanvas}
        executedQueries={executedQueries}
        showToast={showToast}
      />
      <AuthModal
        isOpen={authModalState.open}
        mode={authModalState.mode}
        onClose={closeAuthModal}
        onModeChange={openAuthModal}
        onSignIn={signInUser}
        onSignUp={signUpUser}
        onRequestPasswordReset={requestPasswordResetUser}
        onConfirmPasswordReset={confirmPasswordResetUser}
        isSubmitting={isAuthSubmitting}
        errorMessage={authError}
        successMessage={authSuccessMessage}
      />
      <DatabaseConnectionModal
        isOpen={databaseModalOpen}
        onClose={() => closeDatabaseModal()}
        config={databaseSettings}
        availableModes={databaseModes}
        environmentFallback={environmentFallback}
        onSave={handleSaveDatabaseSettings}
        onTest={handleTestDatabaseSettings}
        onDisconnect={handleDisconnectDatabase}
        isBusy={isDatabaseBusy}
        isLoading={isDatabaseLoading}
        feedback={databaseFeedback}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
