import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';
import AuthModal from './components/AuthModal';
import DatabaseConnectionModal from './components/DatabaseConnectionModal';
import { type SqlSideWindowProps } from './components/Canvas';
import useAuth from './hooks/useAuth';
import useDatabaseSettings from './hooks/useDatabaseSettings';
import useSqlConsole from './hooks/useSqlConsole';
import {
  fetchConversation,
  fetchConversations,
  sendChatMessage,
  deleteConversationWithFiles,
  type RawConversationDetail,
  type RawConversationSummary,
  type RawMessage,
  type RawAttachment,
  type UpdateDatabaseConnectionPayload,
} from './services/chatApi';

export type ChatSender = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  content: string;
  timestamp: string;
  attachments?: RawAttachment[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  summary: string;
  updatedAtISO?: string;
  messageCount?: number;
  messages?: ChatMessage[];
}

const mapMessage = (raw: RawMessage): ChatMessage => ({
  id: raw.id,
  sender: raw.sender,
  content: raw.content,
  timestamp: raw.timestamp,
  attachments: raw.attachments ?? [],
});

const mapSummary = (raw: RawConversationSummary): ConversationSummary => ({
  id: raw.id,
  title: raw.title || 'New chat',
  summary: raw.summary ?? '',
  updatedAt: raw.updatedAt,
  updatedAtISO: raw.updatedAtISO,
  messageCount: raw.messageCount ?? 0,
});

const sortSummaries = (items: ConversationSummary[]): ConversationSummary[] => {
  return [...items].sort((a, b) => {
    const aTime = a.updatedAtISO ? Date.parse(a.updatedAtISO) : Date.parse(a.updatedAt);
    const bTime = b.updatedAtISO ? Date.parse(b.updatedAtISO) : Date.parse(b.updatedAt);
    return bTime - aTime;
  });
};

const App: React.FC = () => {
  const [historyConversations, setHistoryConversations] = useState<ConversationSummary[]>([]);
  const [currentView, setCurrentView] = useState<'chat' | 'history'>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState('chat');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [inputSessionKey, setInputSessionKey] = useState<string>(() => `new-${Date.now()}`);
  const deriveErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const handleStartNewChat = () => {
    setCurrentMessages([]);
    setSelectedHistoryId(null);
    setActiveConversationId(null);
    setInputSessionKey(`new-${Date.now()}`);
    setCurrentView('chat');
    setActiveSidebarItem('chat');
  };

  const refreshConversations = useCallback(async () => {
    try {
      const items = await fetchConversations();
      setHistoryConversations(sortSummaries(items.map(mapSummary)));
    } catch (error) {
      console.error('Failed to load conversations', error);
    }
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
    onSignedIn: async () => {
      await refreshConversations();
    },
    onPasswordResetComplete: async () => {
      handleStartNewChat();
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
    onRevealMessage: (message) => setCurrentMessages((prev) => [...prev, message]),
  });

  useEffect(() => {
    if (!currentUser) {
      setHistoryConversations([]);
      return;
    }

    void refreshConversations();
  }, [currentUser, refreshConversations]);

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

  const handleSignIn = signInUser;

  const handleSignUp = signUpUser;

  const handleSignOut = async () => {
    await signOutUser();
    setHistoryConversations([]);
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

  const applyConversationUpdate = (detail: RawConversationDetail) => {
    const summary = mapSummary(detail);
    setHistoryConversations((prev) => {
      const filtered = prev.filter((item) => item.id !== summary.id);
      return sortSummaries([summary, ...filtered]);
    });
  };

  const updateMessagesFromDetail = (detail: RawConversationDetail) => {
    const mappedMessages = detail.messages.map(mapMessage);
    setSelectedHistoryId(detail.id);
    setActiveConversationId(detail.id);
    setInputSessionKey(detail.id);

    const messagesToDisplay = filterConversationMessages(mappedMessages);

    setCurrentMessages(messagesToDisplay);
  };

  const handleSendMessage = async (
    content: string,
    options?: {
      documentIds?: string[];
    },
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }

    const optimisticMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setCurrentMessages((prev) => [...prev, optimisticMessage]);
    setIsChatLoading(true);

    try {
      const detail = await sendChatMessage({
        message: trimmed,
        conversationId: activeConversationId ?? undefined,
        title: activeConversationId ? undefined : trimmed,
        documentIds: options?.documentIds,
      });

      updateMessagesFromDetail(detail);
      applyConversationUpdate(detail);
      setCurrentView('chat');
      setActiveSidebarItem('chat');
    } catch (error) {
      console.error('Failed to send chat message', error);
      const fallbackReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: 'Sorry, I could not reach the assistant just now.',
        timestamp: new Date().toISOString(),
      };
      setCurrentMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSelectHistoryConversation = async (conversationId: string) => {
    setSelectedHistoryId(conversationId);
    setActiveConversationId(conversationId);
    setInputSessionKey(conversationId);
    setCurrentView('chat');
    setActiveSidebarItem('chat');
    setIsChatLoading(true);

    try {
      const detail = await fetchConversation(conversationId);
      updateMessagesFromDetail(detail);
      applyConversationUpdate(detail);
    } catch (error) {
      console.error('Failed to load conversation detail', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversationWithFiles(Number(conversationId), true);
      setHistoryConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));

      if (selectedHistoryId === conversationId || activeConversationId === conversationId) {
        handleStartNewChat();
      }
    } catch (error) {
      console.error('Failed to delete conversation', error);
    }
  };

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
