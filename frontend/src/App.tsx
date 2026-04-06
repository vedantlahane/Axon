// ─── App ─────────────────────────────────────────────────────────────────────
// Providers → Router → Shell → done.

import React, { Suspense, lazy, useState, useCallback, useEffect, useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

// Providers
import { ThemeProvider } from './stores/ThemeProvider';
import { ToastProvider } from './stores/ToastProvider';
import { AuthProvider, useAuth } from './stores/AuthProvider';

// Layout
import AppShell from './components/layout/AppShell';
import TopBar from './components/layout/TopBar';

// Components
import CommandPalette from './components/command/CommandPalette';
import AuthModal from './components/modals/AuthModal';
import ToastContainer from './components/ui/ToastContainer';
import CanvasPanel from './components/Canvas/CanvasPanel';
import { ErrorBoundary, ErrorFallback } from './components/errors/ErrorBoundary';
import { ChatSkeleton, LibrarySkeleton, DocumentsSkeleton, SettingsSkeleton } from './components/skeletons/PageSkeletons';

// Hooks
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useChatStore } from './stores/chatStore';
import { useDatabaseStore } from './stores/databaseStore';

// Services
import { fetchAvailableModels } from './services/modelService';
import type { LLMModel } from './types/models';

// Lazy-loaded pages
const ChatView = lazy(() => import('./components/chat/ChatView'));
const LibraryView = lazy(() => import('./components/library/LibraryView'));
const DocumentsView = lazy(() => import('./components/documents/DocumentsView'));
const SettingsView = lazy(() => import('./components/settings/SettingsView'));
const NotFound = lazy(() => import('./components/errors/NotFound'));

// ─── Root Layout ─────────────────────────────────────────────────────────────

const RootLayout: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);
  const [currentModel, setCurrentModelState] = useState<string>('');
  const { isAuthenticated } = useAuth();
  const loadConnection = useDatabaseStore((s) => s.loadConnection);
  const loadConversations = useChatStore((s) => s.loadConversations);

  // Initial data load
  useEffect(() => {
    fetchAvailableModels().then((res) => {
      setAvailableModels(res.models);
      setCurrentModelState(res.current);
    }).catch(console.error);

    if (isAuthenticated) {
      void loadConnection();
      void loadConversations();
    }
  }, [isAuthenticated, loadConnection, loadConversations]);

  // Command palette shortcut
  const toggleCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen((v) => !v);
  }, []);

  const shortcuts = useMemo(() => ({
    'mod+k': toggleCommandPalette,
  }), [toggleCommandPalette]);

  useKeyboardShortcuts(shortcuts);

  return (
    <AppShell>
      <TopBar onOpenCommandPalette={toggleCommandPalette} />

      {/* Main content with Canvas panel support */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <CanvasPanel>
          <div className="flex-1 overflow-auto">
            <Outlet context={{ availableModels, currentModel }} />
          </div>
        </CanvasPanel>
      </main>

      {/* Overlays */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      <AuthModal />
      <ToastContainer />
    </AppShell>
  );
};

// ─── Router ──────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorFallback />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<ChatSkeleton />}>
            <ChatView />
          </Suspense>
        ),
      },
      {
        path: 'chat/:conversationId',
        element: (
          <Suspense fallback={<ChatSkeleton />}>
            <ChatView />
          </Suspense>
        ),
      },
      {
        path: 'library',
        element: (
          <Suspense fallback={<LibrarySkeleton />}>
            <LibraryView />
          </Suspense>
        ),
      },
      {
        path: 'documents',
        element: (
          <Suspense fallback={<DocumentsSkeleton />}>
            <DocumentsView />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<SettingsSkeleton />}>
            <SettingsView />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={null}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
]);

// ─── App ─────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
