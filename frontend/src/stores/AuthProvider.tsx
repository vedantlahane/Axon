/* eslint-disable react-refresh/only-export-components */

// ─── Auth Provider (Context) ─────────────────────────────────────────────────
// Manages authentication state, modal control, and auth actions.
// Used by: TopBar (avatar), ChatInput (send guard), AuthModal, Settings.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { UserProfile, AuthModalMode } from '../types/auth';
import * as authService from '../services/authService';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface AuthContextValue {
  // State
  currentUser: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Modal control
  authModalState: { open: boolean; mode: AuthModalMode };
  openAuthModal: (mode: AuthModalMode) => void;
  closeAuthModal: () => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;

  // Password reset
  requestPasswordReset: (email: string) => Promise<string>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;

  // Profile
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Feedback
  authError: string | null;
  authSuccessMessage: string | null;
  isAuthSubmitting: boolean;
}

/* ── Context ─────────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ────────────────────────────────────────────────────────────── */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalState, setAuthModalState] = useState<{
    open: boolean;
    mode: AuthModalMode;
  }>({
    open: false,
    mode: 'signin',
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(
    null
  );
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // ── Initial session check ──────────────────────────────────────────────
  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // ── Modal Control ──────────────────────────────────────────────────────

  const openAuthModal = useCallback((mode: AuthModalMode) => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    setAuthModalState({ open: true, mode });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, open: false }));
    setAuthError(null);
    setAuthSuccessMessage(null);
  }, []);

  // ── Auth Actions ───────────────────────────────────────────────────────

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsAuthSubmitting(true);
      setAuthError(null);
      try {
        const user = await authService.signIn({ email, password });
        setCurrentUser(user);
        closeAuthModal();
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Sign in failed'
        );
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [closeAuthModal]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setIsAuthSubmitting(true);
      setAuthError(null);
      try {
        const user = await authService.signUp({ name, email, password });
        setCurrentUser(user);
        closeAuthModal();
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Sign up failed'
        );
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [closeAuthModal]
  );

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } catch {
      /* noop */
    }
    setCurrentUser(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      // When your authService supports OAuth:
      // const user = await authService.signInWithGoogle();
      // setCurrentUser(user);
      // closeAuthModal();

      // For now, show a message:
      setAuthError('Google sign-in is not yet configured');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google sign-in failed'
      );
    } finally {
      setIsAuthSubmitting(false);
    }
  }, []);

  const signInWithGitHub = useCallback(async () => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      // When your authService supports OAuth:
      // const user = await authService.signInWithGitHub();
      // setCurrentUser(user);
      // closeAuthModal();

      setAuthError('GitHub sign-in is not yet configured');
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'GitHub sign-in failed'
      );
    } finally {
      setIsAuthSubmitting(false);
    }
  }, []);

  // ── Password Reset ─────────────────────────────────────────────────────

  const requestPasswordReset = useCallback(
    async (email: string): Promise<string> => {
      setIsAuthSubmitting(true);
      setAuthError(null);
      try {
        const result = await authService.requestPasswordReset(email);
        setAuthSuccessMessage(result.message);
        if (result.resetToken) return result.resetToken;
        setAuthModalState({ open: true, mode: 'reset' });
        return '';
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Failed to request reset'
        );
        return '';
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    []
  );

  const confirmPasswordReset = useCallback(
    async (token: string, password: string) => {
      setIsAuthSubmitting(true);
      setAuthError(null);
      try {
        const user = await authService.confirmPasswordReset({
          token,
          password,
        });
        setCurrentUser(user);
        closeAuthModal();
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Reset failed'
        );
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [closeAuthModal]
  );

  // ── Profile ────────────────────────────────────────────────────────────

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!currentUser) return;
      setIsAuthSubmitting(true);
      setAuthError(null);
      try {
        // When your authService supports profile updates:
        // const updated = await authService.updateProfile(updates);
        // setCurrentUser(updated);

        // Optimistic update:
        setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Failed to update profile'
        );
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [currentUser]
  );

  // ── Provider Value ─────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: currentUser !== null,
        authModalState,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithGitHub,
        requestPasswordReset,
        confirmPasswordReset,
        updateProfile,
        authError,
        authSuccessMessage,
        isAuthSubmitting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}