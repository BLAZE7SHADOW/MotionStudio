import { useCallback, useEffect, useRef, useState } from 'react';
import { HELP, type HelpEntry, type HelpId } from '@/content/help';
import { anchorFor } from '../tour/anchors';
import { useHelperMode } from '@/lib/helperMode';
import { useEditorStore } from '@/engines/editor';
import { useProjectStore } from '@/engines/project';
import { useTourActive } from '../tour/tourActive';

/**
 * The hover-only border flash — every explainable control in the editor.
 *
 * Two rounds of live preview on a 4-control subset (`insert`, `export`,
 * `canvas`, `properties`) validated the mechanism and caught bugs before this
 * widened to the full set — `HOVER_IDS` is derived from the registry itself
 * rather than hand-maintained, so a new `HelpId` added to `content/help.ts`
 * is automatically covered here with nothing else to edit. The bugs, in the
 * order they were found:
 *
 *   - Clicking a control to pin its card also fired the control's own click
 *     handler (`export` opened its card *and* the real Export dialog).
 *   - The border only rendered on one edge of `overflow-hidden` anchors —
 *     fixed by an inset `outline-offset`, see `helper.css`.
 *   - `canvas`'s card clipped off the right of the viewport with `side:
 *     'left'`, then off the *bottom* once that was fixed to `side: 'bottom'`
 *     — the element is nearly the full width and height of the editor, so no
 *     side has room on both axes relative to its own edges. Fixed by
 *     anchoring to the cursor position instead for that one entry
 *     (`HelpEntry.anchorMode`), not by hand-tuning `side` further.
 *   - Clicking the **`?` button** opened its own menu underneath its own
 *     still-open hover card, since the card's `z-index` was simply higher.
 *     Rather than tune z-indices against every future overlay, any click on a
 *     hovered control now closes that control's card immediately — the
 *     click means the user is doing the thing, not asking about it, the same
 *     reasoning that already kept a click listener off the control in the
 *     first bug above. This one only *reads* the click, never intercepts it.
 *
 * **Nothing is visible until the cursor is over a control, and only that one
 * control ever shows anything.** An earlier version of this hook applied a
 * ring to every resolved anchor continuously, which reproduced the old dots'
 * real problem — several things competing for attention at once — just in a
 * different shape. There is no ambient state here at all: `mouseenter`/
 * `focus` is the *only* thing that ever adds the flash class, to the one
 * element it fired on, and `mouseleave`/`blur` (after a short grace period,
 * to let the pointer travel onto the card) or a click is the only thing that
 * removes it.
 */
const HOVER_IDS = Object.keys(HELP) as HelpId[];

/** How long the pointer has to be off the target *and* the card before the
    card closes — enough to travel from one to the other, short enough that
    it never reads as "stuck open". */
const CLOSE_GRACE_MS = 150;

/** A fixed point captured once, at the moment the pointer entered a
    `cursor`-anchored control — not tracked live, the same as a normal
    element anchor doesn't move mid-hover either. */
export interface AnchorPoint { x: number; y: number }

interface OpenState {
  id: HelpId;
  target: Element;
  /** Set only for `anchorMode: 'cursor'` entries. */
  pointer?: AnchorPoint;
  /** The shot active when this opened. A shot change while hovering is a
      context change; comparing at read time, rather than resetting state
      from a second effect, is what lets `open` below stay a pure derivation. */
  sceneId: string | null;
  /** Copied from `HELP[id].requiresSelection` when this opened. Selection
      clearing mid-hover fires no `mouseleave` — the mouse hasn't moved — so
      without this the card would sit open describing a panel that just went
      back to its empty state. Same shape as `sceneId` above: a fact captured
      at open time, re-checked at read time, rather than a third effect
      hunting for another way state could go stale out from under it. */
  requiresSelection: boolean;
}

export interface OpenHelper {
  id: HelpId;
  target: Element;
  pointer?: AnchorPoint;
  entry: HelpEntry;
}

export interface HelperLayerState {
  open: OpenHelper | null;
  /** Wired to `HelperCard`'s own mouse events so the pointer can travel from
      the control onto the card — reading the chips — without the card
      closing under it. */
  onCardMouseEnter: () => void;
  onCardMouseLeave: () => void;
}

export function useHelperLayer(): HelperLayerState {
  const wanted = useHelperMode((s) => s.on);
  const tourActive = useTourActive((s) => s.active);
  // The user's switch, minus whatever the guided quick start is currently
  // borrowing. driver.js is already spotlighting one control with its own
  // overlay while the tour runs; a hover-flash on some other control the
  // cursor happens to be resting on would compete with that rather than
  // support it, so the layer stands down for the duration rather than the
  // tour needing to know this layer exists.
  const on = wanted && !tourActive;
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const activeSceneId = useEditorStore((s) => s.activeSceneId);
  const shape = useProjectStore((s) => {
    const project = s.getProject(s.activeProjectId ?? '');
    if (!project) return '';
    return `${project.canvas.elements.length}:${project.assets.length}:${project.scenes?.length ?? 0}`;
  });

  const [open, setOpen] = useState<OpenState | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The one element currently wearing the flash class, if any. Kept separate
  // from `open` state so the class toggle is a plain DOM side effect — not
  // something living inside a `setOpen` updater, which React may invoke more
  // than once and must therefore stay pure.
  const flashing = useRef<Element | null>(null);

  const unflash = useCallback(() => {
    flashing.current?.classList.remove('ms-help-flash');
    flashing.current = null;
  }, []);

  const clearCloseTimer = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    unflash();
    setOpen(null);
  }, [clearCloseTimer, unflash]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(close, CLOSE_GRACE_MS);
  }, [clearCloseTimer, close]);

  // Resolve anchors and attach hover/focus listeners whenever the mode is
  // toggled or the DOM this hook cares about could have changed shape.
  useEffect(() => {
    if (!on) return;

    const cleanups: (() => void)[] = [];

    for (const id of HOVER_IDS) {
      const entry = HELP[id];
      if (entry.requiresSelection && !selectedElementId) continue;

      const selector = anchorFor(id);
      const el = selector ? document.querySelector(selector) : null;
      if (!el) continue;

      const onEnter = (e: Event) => {
        clearCloseTimer();
        unflash();
        el.classList.add('ms-help-flash');
        flashing.current = el;
        const pointer =
          entry.anchorMode === 'cursor' && e instanceof MouseEvent
            ? { x: e.clientX, y: e.clientY }
            : undefined;
        setOpen({
          id,
          target: el,
          pointer,
          sceneId: useEditorStore.getState().activeSceneId,
          requiresSelection: !!entry.requiresSelection,
        });
      };
      const onLeave = () => scheduleClose();
      // A click is the user doing the real thing, not asking about it again
      // — close immediately rather than waiting out the grace period. Purely
      // reads the event; nothing here calls preventDefault/stopPropagation,
      // so the control's own click handler still runs exactly as it would
      // with this layer switched off entirely.
      const onClick = () => close();

      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      el.addEventListener('focus', onEnter);
      el.addEventListener('blur', onLeave);
      el.addEventListener('click', onClick);
      cleanups.push(() => {
        if (flashing.current === el) unflash();
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.removeEventListener('focus', onEnter);
        el.removeEventListener('blur', onLeave);
        el.removeEventListener('click', onClick);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [on, selectedElementId, activeSceneId, shape, clearCloseTimer, scheduleClose, unflash, close]);

  // Mode switched off mid-hover shouldn't leave the flash class stuck on a
  // control forever. Pure DOM cleanup, not a setState call — `visible` below
  // already derives to nothing once `on` is false, so there's no state left
  // to reset here.
  useEffect(() => {
    if (!on) unflash();
  }, [on, unflash]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  /* Closing on a shot change, or on a selection clearing out from under a
     gated entry, is a comparison at read time, not a reset — `open` simply
     stops being shown once either fact it captured at open time no longer
     holds, without a second effect hunting for ways state could go stale. */
  const visible: OpenHelper | null =
    on &&
    open &&
    open.sceneId === activeSceneId &&
    !(open.requiresSelection && !selectedElementId)
      ? { id: open.id, target: open.target, pointer: open.pointer, entry: HELP[open.id] }
      : null;

  return { open: visible, onCardMouseEnter: clearCloseTimer, onCardMouseLeave: scheduleClose };
}
