/**
 * Every keyboard and modifier gesture the editor answers to.
 *
 * **This table documents the bindings; it does not drive them.** That is a
 * deliberate limit rather than an oversight. Half these rows are not key
 * handlers at all — Shift and Alt change what a *drag* means, and two of them
 * are double-clicks — so a table that drove the handlers would drive some rows
 * and merely describe others, and a reader could no longer tell which. An
 * honest document with one home beats a generator that covers half the surface.
 *
 * The contract instead is: **add a binding, add a row.** Each handler carries a
 * comment pointing here, so the two are edited together.
 *
 * Handlers live in `hooks/useUndoRedoShortcuts.ts` (undo/redo),
 * `components/CanvasPanel.tsx` (delete/escape/double-click),
 * `components/ui/scrub-input.tsx` (Shift-drag) and
 * `components/timeline/SequenceTrack.tsx` (Alt to defeat beat snapping).
 */

export interface Shortcut {
  /** Rendered as separate keycaps; `mod` becomes ⌘ on Mac, Ctrl elsewhere. */
  keys: string[];
  what: string;
}

export interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Editing',
    shortcuts: [
      { keys: ['mod', 'Z'], what: 'Undo' },
      { keys: ['mod', 'Shift', 'Z'], what: 'Redo' },
      { keys: ['Delete'], what: 'Remove the selected element' },
      { keys: ['Esc'], what: 'Deselect' },
      { keys: ['Double-click'], what: 'Edit a text element on the canvas' },
    ],
  },
  {
    title: 'Dragging',
    shortcuts: [
      { keys: ['Shift', 'drag'], what: 'Move a number in steps of ten' },
      { keys: ['Alt', 'drag'], what: 'Resize a shot without snapping to the beat' },
    ],
  },
  {
    title: 'Shots',
    shortcuts: [
      { keys: ['Double-click'], what: 'Rename a shot in the sequence' },
    ],
  },
];

/**
 * Resolved at call time rather than module load: the sheet is the only reader,
 * and a module-level `navigator` touch would break the headless test runner
 * for anything that imports this file.
 */
export function modKeyLabel(): string {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  return mac ? '⌘' : 'Ctrl';
}
