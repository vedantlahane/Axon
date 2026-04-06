// ─── Auth Modal ──────────────────────────────────────────────────────────────
// Sign in / sign up / forgot / reset flow in a glass-strong overlay.
// Matches FRONTEND_CONTEXT.md §5.4 "AuthModal"

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../stores/AuthProvider';
import Icon from '../ui/Icon';
import type { AuthModalMode } from '../../types/auth';

const AuthModal: React.FC = () => {
  const {
    authModalState,
    closeAuthModal,
    openAuthModal,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    requestPasswordReset,
    confirmPasswordReset,
    authError,
    authSuccessMessage,
    isAuthSubmitting,
  } = useAuth();

  const { open, mode } = authModalState;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset form fields when mode changes
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setResetToken('');
  }, [mode]);

  // Auto-focus first input
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open, mode]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, closeAuthModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') await signIn(email, password);
    else if (mode === 'signup') await signUp(name, email, password);
    else if (mode === 'forgot') {
      const token = await requestPasswordReset(email);
      if (token) setResetToken(token);
    } else if (mode === 'reset') await confirmPasswordReset(resetToken, password);
  };

  // Switch mode without close/reopen flicker
  const switchMode = (newMode: AuthModalMode) => {
    openAuthModal(newMode);
  };

  const showTabs = mode === 'signin' || mode === 'signup';
  const showOAuth = mode === 'signin' || mode === 'signup';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Overlay ──────────────────────────────────────────────── */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.60)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
          />

          {/* ── Modal Card ───────────────────────────────────────────── */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="glass-strong rounded-2xl p-8 w-full max-w-[420px] pointer-events-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                type="button"
                className="absolute top-4 right-4 btn-icon"
                onClick={closeAuthModal}
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>

              {/* ── Tabs ──────────────────────────────────────────── */}
              {showTabs && (
                <div className="flex gap-6 mb-8">
                  {(['signin', 'signup'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className="pb-2 text-sm font-medium transition-colors"
                      style={{
                        color: mode === tab ? '#ffffff' : 'var(--text-muted)',
                        borderBottom: mode === tab
                          ? '2px solid var(--accent-violet-light, #8B5CF6)'
                          : '2px solid transparent',
                      }}
                      onClick={() => switchMode(tab)}
                    >
                      {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Header ────────────────────────────────────────── */}
              {!showTabs && (
                <h2
                  className="text-xl font-semibold text-white mb-6"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {mode === 'forgot' ? 'Reset password' : 'New password'}
                </h2>
              )}

              {showTabs && (
                <h2 className="text-xl font-semibold text-white mb-6">
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </h2>
              )}

              {/* ── Form ──────────────────────────────────────────── */}
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Name
                    </label>
                    <input
                      ref={firstInputRef}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-glass"
                      placeholder="Your name"
                      required
                      autoComplete="name"
                    />
                  </div>
                )}

                {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Email
                    </label>
                    <input
                      ref={mode !== 'signup' ? firstInputRef : undefined}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-glass"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                )}

                {mode === 'reset' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Reset Token
                    </label>
                    <input
                      ref={firstInputRef}
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="input-glass"
                      placeholder="Enter reset token"
                      required
                    />
                  </div>
                )}

                {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-glass pr-10"
                        placeholder="••••••••"
                        required
                        autoComplete={
                          mode === 'signup' ? 'new-password' : 'current-password'
                        }
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Icon
                          name={showPassword ? 'visibility_off' : 'visibility'}
                          style={{ fontSize: 18, color: 'var(--text-ghost)' }}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {authError && (
                  <div className="glass-error rounded-lg p-3 text-xs" style={{ color: 'var(--color-error)' }}>
                    {authError}
                  </div>
                )}

                {/* Success */}
                {authSuccessMessage && (
                  <div className="glass-success rounded-lg p-3 text-xs" style={{ color: 'var(--color-success)' }}>
                    {authSuccessMessage}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={isAuthSubmitting}
                >
                  {isAuthSubmitting
                    ? 'Please wait…'
                    : mode === 'signin'
                    ? 'Sign In'
                    : mode === 'signup'
                    ? 'Create Account'
                    : mode === 'forgot'
                    ? 'Send Reset Link'
                    : 'Reset Password'}
                </button>
              </form>

              {/* ── Forgot password link ──────────────────────────── */}
              {mode === 'signin' && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => switchMode('forgot')}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* ── OAuth Divider + Buttons ───────────────────────── */}
              {showOAuth && (
                <>
                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 gradient-separator" />
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">
                      or continue with
                    </span>
                    <div className="flex-1 gradient-separator" />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="btn-glass flex-1 py-2.5 text-xs"
                      onClick={() => void signInWithGoogle()}
                      disabled={isAuthSubmitting}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </button>
                    <button
                      type="button"
                      className="btn-glass flex-1 py-2.5 text-xs"
                      onClick={() => void signInWithGitHub()}
                      disabled={isAuthSubmitting}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      GitHub
                    </button>
                  </div>
                </>
              )}

              {/* ── Footer Links ──────────────────────────────────── */}
              {mode === 'forgot' && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    className="text-xs transition-colors"
                    style={{ color: 'var(--accent-violet-light)' }}
                    onClick={() => switchMode('signin')}
                  >
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;