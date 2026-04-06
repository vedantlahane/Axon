// ─── Command Palette ─────────────────────────────────────────────────────────
// ⌘K overlay — primary navigation mechanism.
// Matches FRONTEND_CONTEXT.md §5.4 "CommandPalette"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';
import { formatRelativeTime } from '../../utils/formatters';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  type: 'command' | 'conversation' | 'document';
  label: string;
  description?: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const startNewChat = useChatStore((s) => s.startNewChat);
  const conversations = useChatStore((s) => s.conversations);
  const selectConversation = useChatStore((s) => s.selectConversation);

  // ── Build command list ─────────────────────────────────────────────────
  const allItems: CommandItem[] = useMemo(() => {
    const commands: CommandItem[] = [
      {
        id: 'new-chat',
        type: 'command',
        label: '/new',
        description: 'New conversation',
        icon: 'add',
        shortcut: '⌘N',
        action: () => { startNewChat(); navigate('/'); },
      },
      {
        id: 'model',
        type: 'command',
        label: '/model',
        description: 'Switch AI model',
        icon: 'smart_toy',
        shortcut: '⌘M',
        action: () => navigate('/settings'),
      },
      {
        id: 'connect',
        type: 'command',
        label: '/connect',
        description: 'Connect database',
        icon: 'database',
        shortcut: '⌘D',
        action: () => navigate('/settings'),
      },
      {
        id: 'upload',
        type: 'command',
        label: '/upload',
        description: 'Upload document',
        icon: 'upload',
        shortcut: '⌘U',
        action: () => navigate('/documents'),
      },
      {
        id: 'go-home',
        type: 'command',
        label: 'Focus',
        description: 'Go to chat',
        icon: 'bolt',
        action: () => navigate('/'),
      },
      {
        id: 'go-library',
        type: 'command',
        label: 'Library',
        description: 'Browse conversations',
        icon: 'auto_stories',
        action: () => navigate('/library'),
      },
      {
        id: 'go-documents',
        type: 'command',
        label: 'Documents',
        description: 'Manage files',
        icon: 'description',
        action: () => navigate('/documents'),
      },
      {
        id: 'go-settings',
        type: 'command',
        label: 'Settings',
        description: 'Preferences & connections',
        icon: 'tune',
        action: () => navigate('/settings'),
      },
    ];

    // Recent conversations (top 5)
    const recentConvos: CommandItem[] = conversations.slice(0, 5).map((c, i) => ({
      id: `conv-${c.id}`,
      type: 'conversation',
      label: c.title || 'Untitled conversation',
      description: c.updatedAt ? formatRelativeTime(c.updatedAtISO || c.updatedAt) : undefined,
      icon: 'chat_bubble_outline',
      shortcut: i < 3 ? `⌘${i + 1}` : undefined,
      action: () => { void selectConversation(c.id); navigate(`/chat/${c.id}`); },
    }));

    return [...commands, ...recentConvos];
  }, [conversations, navigate, selectConversation, startNewChat]);

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
    );
  }, [query, allItems]);

  // ── Grouped for display ────────────────────────────────────────────────
  const groups = useMemo(() => {
    const commandItems = filtered.filter((i) => i.type === 'command');
    const conversationItems = filtered.filter((i) => i.type === 'conversation');
    const result: Array<{ title: string; items: CommandItem[] }> = [];
    if (commandItems.length > 0) result.push({ title: 'Commands', items: commandItems });
    if (conversationItems.length > 0) result.push({ title: 'Recent Conversations', items: conversationItems });
    return result;
  }, [filtered]);

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // ── Lock body scroll ───────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const runCommand = useCallback(
    (cmd: CommandItem) => {
      cmd.action();
      onClose();
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        runCommand(filtered[selectedIndex]);
      }
    },
    [filtered, selectedIndex, onClose, runCommand]
  );

  // ── Scroll selected into view ──────────────────────────────────────────
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector('[aria-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // ── Flat index counter for keyboard nav ────────────────────────────────
  let flatIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Overlay ──────────────────────────────────────────────── */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.60)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* ── Palette Card ─────────────────────────────────────────── */}
          <motion.div
            className="fixed z-50 w-full max-w-2xl px-4"
            style={{ top: '28%', left: '50%', transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
            onKeyDown={handleKeyDown}
          >
            <div
              className="glass-strong rounded-xl overflow-hidden"
              style={{ boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)' }}
            >
              {/* ── Search Input ───────────────────────────────────── */}
              <div
                className="flex items-center gap-3 p-6"
                style={{
                  borderBottom:
                    '1px solid transparent',
                  backgroundImage:
                    'linear-gradient(var(--bg-surface-container), var(--bg-surface-container)), linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
              >
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ color: 'var(--text-ghost)', fontSize: '20px' }}
                >
                  search
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-lg text-white outline-none"
                  style={{ caretColor: 'var(--accent-violet-light)' }}
                  aria-label="Search commands"
                />
                <kbd
                  className="px-2 py-0.5 rounded text-[10px] shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--text-ghost)',
                  }}
                >
                  ESC
                </kbd>
              </div>

              {/* Gradient separator */}
              <div className="gradient-separator" />

              {/* ── Results ────────────────────────────────────────── */}
              <div
                ref={listRef}
                className="max-h-[320px] overflow-y-auto py-2"
                role="listbox"
              >
                {groups.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No results found.
                    </p>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.title}>
                      {/* Section header */}
                      <div className="px-4 py-3">
                        <span
                          className="text-[10px] uppercase font-medium"
                          style={{
                            letterSpacing: '0.15em',
                            color: 'var(--text-faint, #475569)',
                          }}
                        >
                          {group.title}
                        </span>
                      </div>

                      {/* Items */}
                      {group.items.map((cmd) => {
                        flatIndex++;
                        const isSelected = flatIndex === selectedIndex;
                        const currentFlatIndex = flatIndex;

                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-left transition-colors rounded-lg mx-0"
                            style={{
                              background: isSelected
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'transparent',
                              color: isSelected
                                ? 'var(--text-primary)'
                                : 'var(--text-secondary)',
                            }}
                            onClick={() => runCommand(cmd)}
                            onMouseEnter={() =>
                              setSelectedIndex(currentFlatIndex)
                            }
                          >
                            <span
                              className="material-symbols-outlined shrink-0"
                              style={{
                                fontSize: '18px',
                                color: isSelected
                                  ? 'var(--accent-violet-light, #a78bfa)'
                                  : 'var(--text-ghost)',
                              }}
                            >
                              {cmd.icon}
                            </span>

                            <div className="flex-1 min-w-0">
                              {cmd.type === 'command' && cmd.label.startsWith('/') ? (
                                <span className="text-sm">
                                  <span
                                    className="font-mono"
                                    style={{ color: 'var(--accent-violet-light)' }}
                                  >
                                    {cmd.label}
                                  </span>
                                  {cmd.description && (
                                    <span className="ml-2 text-slate-500">
                                      — {cmd.description}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <div>
                                  <span className="text-sm">{cmd.label}</span>
                                  {cmd.description && (
                                    <span className="ml-2 text-xs text-slate-500">
                                      {cmd.description}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {cmd.shortcut && (
                              <kbd
                                className="px-1.5 py-0.5 rounded text-[10px] shrink-0"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                  color: 'var(--text-ghost)',
                                }}
                              >
                                {cmd.shortcut}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* ── Footer ─────────────────────────────────────────── */}
              <div
                className="px-4 py-3 flex items-center gap-4"
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <span
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--text-faint)' }}
                >
                  ↑↓ Navigate
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--text-faint)' }}
                >
                  ↵ Select
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: 'var(--text-faint)' }}
                >
                  esc Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;