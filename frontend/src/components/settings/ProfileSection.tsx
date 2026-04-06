// ─── Profile Section ─────────────────────────────────────────────────────────

import React, { useState } from 'react';

interface ProfileSectionProps {
  displayName?: string;
  email?: string;
  isAuthenticated?: boolean;
  onSave?: (displayName: string) => Promise<void>;
  onSignIn?: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  displayName = '',
  email = '',
  isAuthenticated = true,
  onSave,
  onSignIn,
}) => {
  const [name, setName] = useState(displayName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(name);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="liquid-glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <span
          className="material-symbols-outlined"
          style={{ color: 'var(--accent-violet-light, #a78bfa)', fontSize: '20px' }}
        >
          person
        </span>
        <h2 className="text-lg font-semibold text-white">Profile</h2>
      </div>

      {isAuthenticated ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                background: 'var(--accent-violet-muted, rgba(124, 58, 237, 0.15))',
                color: 'var(--accent-violet-light, #a78bfa)',
              }}
            >
              {(name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{name || 'User'}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {email}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-glass"
              placeholder="Enter your name"
            />
          </div>

          <button
            type="button"
            className="btn-primary text-sm"
            disabled={isSaving || name === displayName}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access your profile settings.
          </p>
          <button type="button" className="btn-primary text-sm" onClick={onSignIn}>
            Sign In
          </button>
        </div>
      )}
    </section>
  );
};

export default ProfileSection;