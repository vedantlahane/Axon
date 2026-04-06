// ─── Command Palette ─────────────────────────────────────────────────────────
// ⌘K overlay for quick actions, navigation, and search.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '../../stores/chatStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const startNewChat = useChatStore((s) => s.startNewChat);

  const commands: CommandItem[] = [
    { id: 'new-chat', label: 'New conversation', icon: 'add', shortcut: '⌘N', action: () => { startNewChat(); navigate('/'); } },
    { id: 'go-home', label: 'Go to Focus', icon: 'bolt', action: () => navigate('/') },
    { id: 'go-library', label: 'Go to Library', icon: 'auto_stories', action: () => navigate('/library') },
    { id: 'go-documents', label: 'Go to Documents', icon: 'description', action: () => navigate('/documents') },
    { id: 'go-settings', label: 'Go to Settings', icon: 'tune', action: () => navigate('/settings') },
  ];

  const filtered = query.trim()
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => { setSelectedIndex(0); }, [filtered.length]);

  const runCommand = useCallback((cmd: CommandItem) => {
    cmd.action();
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      runCommand(filtered[selectedIndex]);
    }
  }, [filtered, selectedIndex, onClose, runCommand]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            className="fixed top-[20%] left-1/2 z-[201] w-full max-w-[540px]"
            style={{ transform: 'translateX(-50%)' }}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Command palette"
            onKeyDown={handleKeyDown}
          >
            <div className="liquid-glass rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-ambient)' }}>
              {/* Input */}
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--text-ghost)', fontSize: '20px' }}>search</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command…"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-subtle)]"
                  aria-label="Search commands"
                />
                <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-ghost)' }}>ESC</kbd>
              </div>

              {/* Results */}
              <div className="py-2 max-h-[300px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="body-sm" style={{ color: 'var(--text-muted)' }}>No commands found.</p>
                  </div>
                ) : (
                  filtered.map((cmd, i) => (
                    <button
                      key={cmd.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                      style={{
                        background: i === selectedIndex ? 'var(--glass-bg-hover)' : 'transparent',
                        color: i === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      aria-selected={i === selectedIndex}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: i === selectedIndex ? 'var(--violet-bright)' : 'var(--text-ghost)' }}>{cmd.icon}</span>
                      <span className="flex-1 text-sm">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-ghost)' }}>{cmd.shortcut}</kbd>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
