// ─── Auth Provider (Context) ─────────────────────────────────────────────────

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { UserProfile, AuthModalMode } from '../types/auth';
import * as authService from '../services/authService';

interface AuthContextValue {
  currentUser: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Modal
  authModalState: { open: boolean; mode: AuthModalMode };
  openAuthModal: (mode: AuthModalMode) => void;
  closeAuthModal: () => void;

  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;

  // Errors
  authError: string | null;
  authSuccessMessage: string | null;
  isAuthSubmitting: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalState, setAuthModalState] = useState<{ open: boolean; mode: AuthModalMode }>({
    open: false,
    mode: 'signin',
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

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

  const signIn = useCallback(async (email: string, password: string) => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const user = await authService.signIn({ email, password });
      setCurrentUser(user);
      closeAuthModal();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsAuthSubmitting(false);
    }
  }, [closeAuthModal]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const user = await authService.signUp({ name, email, password });
      setCurrentUser(user);
      closeAuthModal();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setIsAuthSubmitting(false);
    }
  }, [closeAuthModal]);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } catch { /* noop */ }
    setCurrentUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<string> => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const result = await authService.requestPasswordReset(email);
      setAuthSuccessMessage(result.message);
      if (result.resetToken) return result.resetToken;
      setAuthModalState({ open: true, mode: 'reset' });
      return '';
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to request reset');
      return '';
    } finally {
      setIsAuthSubmitting(false);
    }
  }, []);

  const confirmPasswordReset = useCallback(async (token: string, password: string) => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    try {
      const user = await authService.confirmPasswordReset({ token, password });
      setCurrentUser(user);
      closeAuthModal();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsAuthSubmitting(false);
    }
  }, [closeAuthModal]);

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
        requestPasswordReset,
        confirmPasswordReset,
        authError,
        authSuccessMessage,
        isAuthSubmitting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
