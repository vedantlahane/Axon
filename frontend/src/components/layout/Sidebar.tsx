import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile } from '../../services/chatApi';
import { applyTheme, resolveInitialTheme } from '../../utils/theme';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onSelect: (itemId: string) => void;
  onStartNewChat: () => void;
  isAuthenticated: boolean;
  onRequireAuth: (mode: 'signin' | 'signup') => void;
  currentUser: UserProfile | null;
  onSignOut: () => Promise<void> | void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const spring = { type: 'spring', stiffness: 120, damping: 20 } as const;

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  activeItem,
  onSelect,
  onStartNewChat,
  isAuthenticated,
  onRequireAuth,
  currentUser,
  onSignOut,
}) => {
  const [darkTheme, setDarkTheme] = useState(() => resolveInitialTheme() === 'dark');

  useEffect(() => {
    applyTheme(darkTheme ? 'dark' : 'light');
  }, [darkTheme]);

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        id: 'chat',
        label: 'Focus',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        id: 'history',
        label: 'Library',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
    ],
    []
  );

  return (
    <motion.aside
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-low)',
        borderRight: 'none',
      }}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={spring}
    >
      {/* ── Brand header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pb-3 pt-5" style={{ gap: '0.75rem' }}>
        {!collapsed && (
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="grid h-8 w-8 place-items-center rounded-xl logo-breathe"
              style={{ background: 'linear-gradient(135deg, rgba(185,200,222,0.15), rgba(185,200,222,0.05))' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-secondary)' }}>
                <path d="M4 4h9l7 8-7 8H4l7-8z" />
                <path d="M11 4 7 12l4 8" />
              </svg>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}
            >
              Axon
            </span>
          </motion.div>
        )}

        <motion.button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="btn-glass"
          style={{
            width: '32px',
            height: '32px',
            padding: 0,
            borderRadius: 'var(--radius-md)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </motion.button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav
        className={`flex flex-1 flex-col gap-1 overflow-y-auto pb-4 pt-2 ${collapsed ? 'px-2.5' : 'px-3'}`}
        aria-label="Primary navigation"
      >
        {navItems.map((item, index) => {
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              className={`group relative flex items-center transition-all ${collapsed ? 'justify-center px-2.5 py-2.5' : 'justify-start gap-3 px-3 py-2.5'}`}
              style={{
                borderRadius: 'var(--radius-lg)',
                background: isActive ? 'var(--glass-bg-active)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                boxShadow: isActive ? 'inset 0 0.5px 0 0 var(--glass-inner-glow)' : 'none',
              }}
              onClick={() => onSelect(item.id)}
              aria-pressed={isActive}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{
                background: isActive ? 'var(--glass-bg-active)' : 'var(--glass-bg-hover)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="flex items-center justify-center" aria-hidden>
                {item.icon}
              </span>
              {!collapsed && (
                <motion.span
                  className="text-[13px] font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {item.label}
                </motion.span>
              )}
              {/* Active indicator — subtle left edge glow */}
              {isActive && (
                <motion.div
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                  style={{ background: 'var(--accent-secondary)' }}
                  layoutId="sidebar-indicator"
                  transition={spring}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* ── Bottom actions ──────────────────────────────────────────── */}
      <div className={`flex flex-col gap-2 pb-4 pt-3 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {/* New Chat */}
        <motion.button
          type="button"
          onClick={() => (isAuthenticated ? onStartNewChat() : onRequireAuth('signup'))}
          className="btn-glass"
          style={{
            height: '40px',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            justifyContent: 'center',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-secondary)' }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {!collapsed && <span>New chat</span>}
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          type="button"
          className="btn-glass"
          style={{
            height: '36px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            justifyContent: 'center',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setDarkTheme((prev) => !prev)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {darkTheme ? (
              <>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </>
            ) : (
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            )}
          </svg>
          {!collapsed && (
            <span style={{ color: 'var(--text-muted)' }}>
              {darkTheme ? 'Dark' : 'Light'}
            </span>
          )}
        </motion.button>

        {/* User / Auth */}
        {isAuthenticated ? (
          <motion.button
            type="button"
            className="btn-glass"
            style={{
              height: '44px',
              borderRadius: 'var(--radius-lg)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '0.75rem',
              padding: collapsed ? '0' : '0 0.75rem',
            }}
            whileHover={{ scale: 1.02, borderColor: 'rgba(255, 180, 171, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void onSignOut()}
          >
            <span
              className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-semibold"
              style={{
                background: 'var(--glass-bg-active)',
                color: 'var(--accent-secondary)',
              }}
            >
              {(currentUser?.name?.charAt(0) ?? currentUser?.email?.charAt(0) ?? 'A').toUpperCase()}
            </span>
            {!collapsed && (
              <span className="flex flex-col items-start min-w-0">
                <span className="label-section" style={{ fontSize: '0.5625rem' }}>Sign out</span>
                <span className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                  {currentUser?.name ?? currentUser?.email ?? 'Account'}
                </span>
              </span>
            )}
          </motion.button>
        ) : (
          <motion.button
            type="button"
            className="btn-glass"
            style={{
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              justifyContent: 'center',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRequireAuth('signin')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
            </svg>
            {!collapsed && <span>Sign in</span>}
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
