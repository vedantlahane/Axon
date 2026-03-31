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

const baseIconProps = {
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

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
  const [darkTheme, setDarkTheme] = useState(() => {
    return resolveInitialTheme() === 'dark';
  });

  useEffect(() => {
    applyTheme(darkTheme ? 'dark' : 'light');
  }, [darkTheme]);


  const navItems = useMemo<NavItem[]>(
    () => [
      {
        id: 'chat',
        label: 'Chat',
        icon: (
          <svg {...baseIconProps} viewBox="0 0 24 24" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        id: 'history',
        label: 'History',
        icon: (
          <svg {...baseIconProps} viewBox="0 0 24 24" aria-hidden>
            <path d="M3 3v5h5M3 8.5A9 9 0 1 0 12 3" />
          </svg>
        ),
      },
    ],
    []
  );

  const navButtonClass = (isActive: boolean) =>
    [
      'group relative flex items-center rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
      collapsed ? 'justify-center px-3 py-3' : 'justify-start gap-3 px-4 py-2.5',
      isActive
        ? 'border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_14px_28px_-22px_rgba(19,99,255,0.8)]'
        : 'border border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-primary)]',
    ].join(' ');


  return (
    <motion.aside
      className="flex flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--bg-panel)]/90 backdrop-blur-xl"
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-5">
        {!collapsed && (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#1363ff] to-[#63a0ff] text-lg font-black text-white shadow-lg">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#d7e6ff]"
              >
                <path d="M4 4h9l7 8-7 8H4l7-8z" />
                <path d="M11 4 7 12l4 8" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">Axon</span>
          </motion.div>
        )}

        <motion.button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </motion.button>
      </div>

      <nav
        className={`flex flex-1 flex-col gap-1.5 overflow-y-auto pb-5 pt-2 ${
          collapsed ? 'px-3' : 'px-4'
        }`}
        aria-label="Primary navigation"
      >
        {navItems.map((item, index) => {
          const isActive = activeItem === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              className={navButtonClass(isActive)}
              onClick={() => onSelect(item.id)}
              aria-pressed={isActive}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ x: collapsed ? 0 : 2 }}
            >
              <span className="flex items-center justify-center" aria-hidden>
                {item.icon}
              </span>
              {!collapsed && (
                <motion.span
                  className="text-sm font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {item.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </nav>

      <div
        className={`flex flex-col gap-3 border-t border-[var(--border)] pb-5 pt-4 ${collapsed ? 'px-3' : 'px-4'}`}
      >
        <motion.button
          type="button"
          onClick={() => (isAuthenticated ? onStartNewChat() : onRequireAuth('signup'))}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          {!collapsed && <span>New chat</span>}
        </motion.button>
        <motion.button
          type="button"
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] text-sm text-[var(--text-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setDarkTheme((prev) => !prev)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          {!collapsed && <span className="text-[var(--text-muted)]">{darkTheme ? 'Dark theme' : 'Light theme'}</span>}
        </motion.button>
        {isAuthenticated ? (
          <motion.button
            type="button"
            className="flex h-11 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-sm text-[var(--text-muted)] transition hover:bg-rose-500/10 hover:text-rose-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void onSignOut()}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]" aria-hidden>
              {(currentUser?.name?.charAt(0) ?? currentUser?.email?.charAt(0) ?? 'A').toUpperCase()}
            </span>
            {!collapsed && (
              <span className="flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-subtle)]">Sign out</span>
                <span className="text-sm font-medium text-[var(--text-muted)]">{currentUser?.name ?? currentUser?.email ?? 'Account'}</span>
              </span>
            )}
          </motion.button>
        ) : (
          <motion.button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] text-sm text-[var(--text-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRequireAuth('signin')}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
              </svg>
            </span>
            {!collapsed && <span>Sign in</span>}
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
