import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';
import AuthModal from './components/AuthModal';
import DatabaseConnectionModal from './components/DatabaseConnectionModal';
import { type SqlSideWindowProps } from './components/Canvas';
import useAuth from './hooks/useAuth';
import useConversationManager from './hooks/useConversationManager';
import useDatabaseSettings from './hooks/useDatabaseSettings';
import useSqlConsole from './hooks/useSqlConsole';
import {
  type UpdateDatabaseConnectionPayload,
} from './services/chatApi';
import type { ChatMessage } from './types/chat';

const App = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'history'>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('chat');
  const startNewChatRef = useRef<() => void>(() => undefined);
  const deriveErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

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
      setActiveSidebarItem('chat');
    };
  }, [appendMessage, startNewChat]);

  useEffect(() => {
    if (currentMessages.length === 0) {
      resetAssistantTracking();
      return;
    }

    const latest = currentMessages[currentMessages.length - 1];
    if (!latest) {
      return;
    }

    handleAssistantMessageForSql(latest);
  }, [currentMessages, handleAssistantMessageForSql, resetAssistantTracking]);

  const handleOpenDatabaseSettings = () => {
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }

    void openDatabaseSettings();
  };

  const handleCloseDatabaseModal = () => {
    closeDatabaseModal();
  };

  const handleToggleSideWindow = () => {
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }

    if (!canUseDatabaseTools) {
      handleOpenDatabaseSettings();
      return;
    }

    clearSqlErrors();

    if (!isSideWindowOpen) {
      resetSqlSuggestions();
      if (!sqlSchema) {
        void refreshDatabaseSchema();
      }
    }

    setIsSideWindowOpen((prev) => !prev);
  };

  const handleCollapseSideWindow = () => {
    setIsSideWindowOpen(false);
    clearSqlErrors();
  };

  const handleSaveDatabaseSettings = async (payload: UpdateDatabaseConnectionPayload) => {
    const ok = await saveDatabaseSettings(payload);
    if (ok) {
      resetSqlConsoleState();
    }
  };

  const handleTestDatabaseSettings = async (payload: UpdateDatabaseConnectionPayload) => {
    await testDatabaseSettings(payload);
  };

  const handleDisconnectDatabase = async () => {
    const ok = await disconnectDatabase();
    if (ok) {
      resetSqlConsoleState({ close: true });
    }
  };

  const handleStartNewChat = useCallback(() => {
    startNewChat();
    setCurrentView('chat');
    setActiveSidebarItem('chat');
  }, [startNewChat]);

  const handleSignIn = signInUser;

  const handleSignUp = signUpUser;

  const handleSignOut = async () => {
    await signOutUser();
    clearConversations();
    handleStartNewChat();
    setDatabaseModalOpen(false);
    setDatabaseFeedback(null);
    resetSqlConsoleState({ close: true });
  };

  const handleRequestPasswordReset = requestPasswordResetUser;

  const handleConfirmPasswordReset = confirmPasswordResetUser;

  const handleSidebarSelect = (itemId: string) => {
    setActiveSidebarItem(itemId);
    if (itemId === 'chat' || itemId === 'history') {
      setCurrentView(itemId);
    }
  };

  const handleViewChange = (view: 'chat' | 'history') => {
    setCurrentView(view);
    setActiveSidebarItem(view);
  };

  const handleSendMessage = useCallback(
    async (
      content: string,
      options?: {
        documentIds?: string[];
      },
    ) => {
      await sendMessage(content, options);
      setCurrentView('chat');
      setActiveSidebarItem('chat');
    },
    [sendMessage]
  );

  const handleSelectHistoryConversation = useCallback(
    async (conversationId: string) => {
      await selectHistoryConversation(conversationId);
      setCurrentView('chat');
      setActiveSidebarItem('chat');
    },
    [selectHistoryConversation]
  );

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      await deleteConversation(conversationId);
    },
    [deleteConversation]
  );

  const databaseSummary = (() => {
    if (!currentUser) return 'Sign in';
    if (isDatabaseLoading) return 'Loading...';
    if (activeConnection) return activeConnection.displayName || activeConnection.label || 'Connected';
    return 'Select database';
  })();

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
    <div className="flex h-screen w-screen overflow-hidden text-white bg-[#030407] dark:bg-[radial-gradient(ellipse_at_top,_rgba(25,40,85,0.35),_transparent_70%)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem={activeSidebarItem}
        onSelect={handleSidebarSelect}
        onStartNewChat={handleStartNewChat}
        isAuthenticated={Boolean(currentUser)}
        onRequireAuth={(mode: 'signin' | 'signup') => openAuthModal(mode)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />
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
      />
      <AuthModal
        isOpen={authModalState.open}
        mode={authModalState.mode}
        onClose={closeAuthModal}
        onModeChange={openAuthModal}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onRequestPasswordReset={handleRequestPasswordReset}
        onConfirmPasswordReset={handleConfirmPasswordReset}
        isSubmitting={isAuthSubmitting}
        errorMessage={authError}
        successMessage={authSuccessMessage}
      />
      <DatabaseConnectionModal
        isOpen={databaseModalOpen}
        onClose={handleCloseDatabaseModal}
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
    </div>
  );
};

export default App;
