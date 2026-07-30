import { useEffect } from 'react';
import { useProjectStore } from '@/engines/project';

/**
 * ⌘Z / Ctrl+Z → undo, ⌘⇧Z / Ctrl+Y → redo. Skipped while typing in a field so
 * the browser's native text undo keeps working inside inputs/contenteditable.
 *
 * Listed in `features/workspace/shortcuts.ts`, which the help menu renders.
 * Change a binding here, change the row there.
 */
export function useUndoRedoShortcuts() {
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const el = document.activeElement as HTMLElement | null;
      const typing = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;
      if (typing) return;

      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);
}
