// ─── Keyboard Shortcuts Hook ─────────────────────────────────────────────────

import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;

      // Build key string
      let key = '';
      if (meta) key += 'mod+';
      if (e.shiftKey) key += 'shift+';
      key += e.key.toLowerCase();

      const action = shortcuts[key];
      if (action) {
        e.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

export default useKeyboardShortcuts;
