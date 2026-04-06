// ─── Top Bar ─────────────────────────────────────────────────────────────────
// Fixed transparent header. Logo left, search + avatar right.
// Matches FRONTEND_CONTEXT.md §5.1 "TopBar"
//
// NOTHING ELSE lives here. No tabs, no links, no toggles.
// Navigation: ⌘K CommandPalette + URL routing.

import React from 'react';
import Icon from '../ui/Icon';
import { Link } from 'react-router-dom';
import { useAuth } from '../../stores/AuthProvider';

interface TopBarProps {
  onOpenCommandPalette?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette }) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  const handleAvatarClick = () => {
    if (!isAuthenticated) {
      openAuthModal('signin');
    }
    // If authenticated, could open a profile dropdown in a future iteration.
    // For now, avatar is display-only when signed in.
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-6"
      style={{ background: 'transparent' }}
      role="banner"
    >
      {/* ── Left: Brand ─────────────────────────────────────────────────── */}
      <Link
        to="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="Axon"
      >
        <img src="/logo.svg" alt="Axon" className="w-6 h-6" />
        <span className="text-xl font-medium tracking-tighter text-slate-200">axon ai</span>
      </Link>

      {/* ── Right: Search + Avatar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search — opens command palette (hidden on mobile) */}
        {onOpenCommandPalette && (
          <button
            type="button"
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            onClick={onOpenCommandPalette}
            aria-label="Search (⌘K)"
            title="⌘K"
          >
            <Icon name="search" style={{ fontSize: 20 }} />
          </button>
        )}

        {/* Avatar — solid gray circle, no image */}
        <button
          type="button"
          className="w-8 h-8 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-slate-600 transition-colors"
          onClick={handleAvatarClick}
          aria-label={isAuthenticated ? 'Profile' : 'Sign in'}
          title={isAuthenticated ? 'Profile' : 'Sign in'}
        >
          {/* Intentionally empty — solid circle per spec.
              No initials, no image, no icon. */}
        </button>
      </div>
    </header>
  );
};

export default TopBar;