import { useEffect } from 'react';

interface KeyboardShortcut {
  /** Key to listen for (e.g., 'n', 'k', 'Escape') */
  key: string;
  /** Whether Ctrl/Cmd must be held */
  ctrl?: boolean;
  /** Whether Shift must be held */
  shift?: boolean;
  /** Handler to call when the shortcut is triggered */
  handler: () => void;
  /** Whether to prevent default browser behaviour */
  preventDefault?: boolean;
}

/**
 * Global keyboard shortcuts hook.
 * Binds keydown listeners for each shortcut and cleans up on unmount.
 */
export default function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire shortcuts when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch) {
          // Escape should always work; other shortcuts skip if user is typing
          if (shortcut.key !== 'Escape' && isInput && !shortcut.ctrl) continue;

          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
