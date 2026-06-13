import { useEffect } from 'react';

export type Shortcut = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: (e: KeyboardEvent) => void;
};

/**
 * 全局快捷键 Hook
 *
 * @example
 * useShortcuts([
 *   { key: 's', ctrl: true, callback: handleSave },
 *   { key: 'k', ctrl: true, callback: openCommandPalette },
 * ]);
 */
export function useShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.callback(e);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts]);
}

/**
 * 预定义的常用快捷键
 */
export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true } as const,
  COMMAND_PALETTE: { key: 'k', ctrl: true } as const,
  FIND: { key: 'f', ctrl: true } as const,
  UNDO: { key: 'z', ctrl: true } as const,
  REDO: { key: 'z', ctrl: true, shift: true } as const,
  NEW: { key: 'n', ctrl: true } as const,
  CLOSE: { key: 'w', ctrl: true } as const,
} as const;

/**
 * 格式化快捷键为显示文本
 */
export function formatShortcut(shortcut: Partial<Shortcut>): string {
  const parts: string[] = [];

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.key) {
    parts.push(shortcut.key.toUpperCase());
  }

  return parts.join(isMac ? '' : '+');
}
