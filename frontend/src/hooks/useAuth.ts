import { useCallback, useEffect, useState } from "react";
import {
  confirmPasswordReset,
  getCurrentUser,
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  type UserProfile,
} from "../services/chatApi";

interface AuthModalState {
  open: boolean;
  mode: "signin" | "signup";
}

interface UseAuthOptions {
  onSignedIn?: () => void | Promise<void>;
  onSignedOut?: () => void;
  onPasswordResetComplete?: () => void | Promise<void>;
}

const useAuth = ({ onSignedIn, onSignedOut, onPasswordResetComplete }: UseAuthOptions = {}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalState, setAuthModalState] = useState<AuthModalState>({
    open: false,
    mode: "signin",
  });
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getCurrentUser();
        if (profile) {
          setCurrentUser(profile);
        }
      } catch (error) {
        console.error("Failed to determine current user", error);
      }
    })();
  }, []);

  const openAuthModal = useCallback((mode: "signin" | "signup") => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    setAuthModalState({ open: true, mode });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, open: false }));
    setAuthError(null);
    setAuthSuccessMessage(null);
  }, []);

  const handleSignIn = useCallback(
    async (payload: { email: string; password: string }) => {
      setIsAuthSubmitting(true);
      setAuthError(null);
      setAuthSuccessMessage(null);

      try {
        const user = await signIn(payload);
        setCurrentUser(user);
        closeAuthModal();
        if (onSignedIn) {
          await onSignedIn();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to sign in.";
        setAuthError(message);
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [closeAuthModal, onSignedIn]
  );

  const handleSignUp = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      setIsAuthSubmitting(true);
      setAuthError(null);
      setAuthSuccessMessage(null);

      try {
        const user = await signUp(payload);
        setCurrentUser(user);
        closeAuthModal();
        if (onSignedIn) {
          await onSignedIn();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to sign up.";
        setAuthError(message);
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [closeAuthModal, onSignedIn]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setCurrentUser(null);
      if (onSignedOut) {
        onSignedOut();
      }
    }
  }, [onSignedOut]);

  const handleRequestPasswordReset = useCallback(async (email: string) => {
    setIsAuthSubmitting(true);
    setAuthError(null);
    setAuthSuccessMessage(null);

    try {
      const result = await requestPasswordReset(email);
      if (result.resetToken) {
        setAuthSuccessMessage("Reset code generated. Enter it below to choose a new password.");
      } else {
        setAuthSuccessMessage("If that email is registered, you will receive reset instructions soon.");
      }
      return result.resetToken ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start password reset.";
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsAuthSubmitting(false);
    }
  }, []);

  const handleConfirmPasswordReset = useCallback(
    async (payload: { token: string; password: string }) => {
      setIsAuthSubmitting(true);
      setAuthError(null);
      setAuthSuccessMessage(null);

      try {
        const user = await confirmPasswordReset(payload);
        setCurrentUser(user);
        setAuthSuccessMessage("Password updated successfully.");
        closeAuthModal();
        if (onSignedIn) {
          await onSignedIn();
        }
        if (onPasswordResetComplete) {
          await onPasswordResetComplete();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to reset password.";
        setAuthError(message);
        throw new Error(message);
      } finally {
        setIsAuthSubmitting(false);
      }
    },
    [closeAuthModal, onPasswordResetComplete, onSignedIn]
  );

  return {
    currentUser,
    setCurrentUser,
    authModalState,
    openAuthModal,
    closeAuthModal,
    isAuthSubmitting,
    authError,
    authSuccessMessage,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    requestPasswordReset: handleRequestPasswordReset,
    confirmPasswordReset: handleConfirmPasswordReset,
  };
};

export default useAuth;
