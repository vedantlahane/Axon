// ─── Top Bar ─────────────────────────────────────────────────────────────────
// Fixed header with navigation, brand, and right-side actions.

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../stores/AuthProvider';
import { useTheme } from '../../stores/ThemeProvider';
import { useChatStore } from '../../stores/chatStore';

interface TopBarProps {
  onOpenCommandPalette?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, openAuthModal, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const startNewChat = useChatStore((s) => s.startNewChat);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/chat');
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', icon: 'bolt', label: 'Focus' },
    { path: '/library', icon: 'auto_stories', label: 'Library' },
    { path: '/documents', icon: 'description', label: 'Documents' },
    { path: '/settings', icon: 'tune', label: 'Settings' },
  ];

  const handleNewChat = () => {
    startNewChat();
    navigate('/');
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14"
      style={{
        background: 'rgba(8, 8, 12, 0.75)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* ── Left: Brand + Nav ───────────────────────────────────────────── */}
      <div className="flex items-center gap-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group" onClick={handleNewChat}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center logo-breathe" style={{ background: 'var(--violet-soft)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--violet-bright)', fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">axon</span>
        </Link>

        {/* Divider */}
        <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Navigation */}
        <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-ghost)',
                  background: active ? 'var(--glass-bg-hover)' : 'transparent',
                }}
                aria-current={active ? 'page' : undefined}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Right: Actions ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* New chat */}
        <button
          type="button"
          className="btn-icon"
          onClick={handleNewChat}
          aria-label="New conversation"
          title="New conversation"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        </button>

        {/* Command palette shortcut */}
        {onOpenCommandPalette && (
          <button
            type="button"
            className="btn-icon"
            onClick={onOpenCommandPalette}
            aria-label="Command palette (⌘K)"
            title="⌘K"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
          </button>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Auth */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: 'var(--violet-soft)', color: 'var(--violet-bright)' }}
              aria-label={`Signed in as ${currentUser?.name}`}
              title={currentUser?.name}
            >
              {(currentUser?.name ?? 'U').charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={() => void signOut()}
              aria-label="Sign out"
              title="Sign out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-glass text-xs"
            onClick={() => openAuthModal('signin')}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
