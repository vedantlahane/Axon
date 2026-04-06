// ─── Auth Modal ──────────────────────────────────────────────────────────────
// Refactored sign in/up/reset modal using glass design system.

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../stores/AuthProvider';
import type { AuthModalMode } from '../../types/auth';

const AuthModal: React.FC = () => {
  const {
    authModalState,
    closeAuthModal,
    openAuthModal,
    signIn,
    signUp,
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
  const [resetToken, setResetToken] = useState('');

  // Reset form on mode change
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setResetToken('');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      await signIn(email, password);
    } else if (mode === 'signup') {
      await signUp(name, email, password);
    } else if (mode === 'forgot') {
      const token = await requestPasswordReset(email);
      if (token) setResetToken(token);
    } else if (mode === 'reset') {
      await confirmPasswordReset(resetToken, password);
    }
  };


  const titles: Record<AuthModalMode, string> = {
    signin: 'Welcome back',
    signup: 'Create account',
    forgot: 'Reset password',
    reset: 'New password',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuthModal}
          />
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="modal-content pointer-events-auto p-8" onClick={(e) => e.stopPropagation()}>
              {/* Close button */}
              <button type="button" className="absolute top-4 right-4 btn-icon" onClick={closeAuthModal} aria-label="Close">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>

              {/* Header */}
              <div className="mb-8 text-center">
                <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--violet-soft)' }}>
                  <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--violet-bright)', fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <h2 className="headline-sm text-white">{titles[mode]}</h2>
              </div>

              {/* Form */}
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="label-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-glass" placeholder="Your name" required autoComplete="name" />
                  </div>
                )}

                {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && (
                  <div>
                    <label className="label-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" placeholder="you@example.com" required autoComplete="email" />
                  </div>
                )}

                {mode === 'reset' && (
                  <div>
                    <label className="label-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reset Token</label>
                    <input type="text" value={resetToken} onChange={(e) => setResetToken(e.target.value)} className="input-glass" placeholder="Enter reset token" required />
                  </div>
                )}

                {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
                  <div>
                    <label className="label-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" placeholder="••••••••" required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                  </div>
                )}

                {/* Error */}
                {authError && (
                  <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.15)', color: 'var(--error)' }}>
                    {authError}
                  </div>
                )}

                {/* Success */}
                {authSuccessMessage && (
                  <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.15)', color: 'var(--success)' }}>
                    {authSuccessMessage}
                  </div>
                )}

                <button type="submit" className="btn-primary w-full py-3" disabled={isAuthSubmitting}>
                  {isAuthSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Reset Password'}
                </button>
              </form>

              {/* Footer links */}
              <div className="mt-6 text-center space-y-2">
                {mode === 'signin' && (
                  <>
                    <button type="button" onClick={() => { closeAuthModal(); setTimeout(() => openAuthModal('forgot'), 150); }} className="text-xs transition-colors" style={{ color: 'var(--text-ghost)' }}>
                      Forgot password?
                    </button>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Don't have an account?{' '}
                      <button type="button" onClick={() => { closeAuthModal(); setTimeout(() => openAuthModal('signup'), 150); }} className="font-medium" style={{ color: 'var(--violet-bright)' }}>Sign up</button>
                    </p>
                  </>
                )}
                {mode === 'signup' && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <button type="button" onClick={() => { closeAuthModal(); setTimeout(() => openAuthModal('signin'), 150); }} className="font-medium" style={{ color: 'var(--violet-bright)' }}>Sign in</button>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
