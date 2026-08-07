import { useLayoutEffect, useMemo, useRef } from 'react';
import { Portal } from 'radix-ui';
// Not re-exported by the `radix-ui` meta-package (only its higher-level
// components — HoverCard, Popover, Tooltip — are), but it's a pinned
// dependency of that package (`node_modules/radix-ui/package.json`), so it
// resolves without a separate line in this project's own package.json.
import * as Popper from '@radix-ui/react-popper';
import type { HelpEntry } from '@/content/help';
import type { AnchorPoint } from '../hooks/useHelperLayer';
// Static, not lazy: this preview is a handful of controls and a few KB of
// CSS, and the old `helperMode.ts` lazy-loads the same file on its own
// schedule for a different reason. Once the full rollout replaces that
// module, this import becomes the only source of the styles — keeping it
// static now means the two don't have to coordinate load timing.
import './helper.css';

/**
 * The floating card that opens while a control is hovered.
 *
 * **Why Popper directly, not `<HoverCard>`.** Radix's packaged `HoverCard`
 * expects `<HoverCardTrigger asChild>` wrapping the target JSX — which would
 * mean editing all 21 components carrying a `data-tour` attribute, re-coupling
 * them to onboarding after the whole point of that attribute was to keep them
 * ignorant of it. `Popper.Anchor` takes a `virtualRef` — anything with a
 * `getBoundingClientRect()` — which a plain DOM node found by
 * `document.querySelector('[data-tour="…"]')` already is. This is the same
 * primitive `HoverCard`/`Popover`/`Tooltip` are themselves built on
 * (`@radix-ui/react-popper`, a pinned dependency of the installed `radix-ui`
 * package — present in `node_modules` without needing its own line in
 * `package.json`), so positioning, collision-avoidance and side-flipping are
 * the same battle-tested logic those components use, not hand-rolled.
 *
 * **No pinning, no click handling, nothing progressive.** An earlier version
 * of this let a click inside the card pin it open with a longer answer.
 * Removed: the card now always shows everything — line, chips, and the
 * longer answer together — the instant it opens, because the whole surface
 * is driven by hover alone. This isn't just simpler, it closes off a real bug
 * for good rather than working around it — a click *on the control* to pin
 * its card once also fired the control's own click handler (caught live:
 * clicking `export` opened both the help card and the real Export dialog).
 * With no click listener anywhere near the control, that class of bug can't
 * recur.
 *
 * Open/close timing — hover-in, hover-out with a short grace period so the
 * pointer can travel from the control onto the card — is owned entirely by
 * `useHelperLayer`. This component only renders what it's told and forwards
 * its own mouse events back up so that grace period can tell "left toward the
 * card" apart from "left toward nothing".
 *
 * **`pointer`, not the control's own box, for a handful of entries.**
 * `canvas` is nearly the full width and height of the editor, so no `side`
 * ever has room on both axes relative to the *element's* edges — fixed twice
 * (`side: 'left'` clipped right, `side: 'bottom'` then clipped off the
 * bottom) before landing on anchoring to where the cursor actually entered
 * instead (`HelpEntry.anchorMode: 'cursor'`, set by `useHelperLayer`). A
 * point near the cursor has room on some side almost anywhere it's hovered,
 * which a huge element's own edges don't.
 */

/** Anything `Popper.Anchor`'s `virtualRef` accepts — a real `Element`, or a
    zero-size point standing in for one. */
interface Measurable { getBoundingClientRect(): DOMRect }

function pointRect(x: number, y: number): DOMRect {
  return { x, y, width: 0, height: 0, top: y, right: x, bottom: y, left: x, toJSON: () => ({}) };
}

export interface HelperCardProps {
  /** The control the card is anchored to. */
  target: Element;
  /** When set, anchor to this point instead of `target`'s own box — see the
      module doc above. */
  pointer?: AnchorPoint;
  entry: HelpEntry;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function HelperCard({ target, pointer, entry, onMouseEnter, onMouseLeave }: HelperCardProps) {
  // Popper reads `.current` on measure; the ref object's identity staying
  // fixed across renders is what lets the anchor track a changing target
  // without Popper treating it as a remount. Written in a layout effect, not
  // during render — mutating a ref's value while rendering is undefined
  // behavior under React's concurrent renderer, even though the object
  // identity itself never changes. Layout, not a plain effect, so the value
  // is correct before Popper's own measurement runs.
  // Keyed on the point's coordinates, not `pointer`'s object identity — the
  // caller rebuilds that object every render, and rebuilding this one to
  // match would re-trigger the layout effect below on every unrelated
  // render while a cursor-anchored card is open, not just when the anchor
  // actually moves.
  const px = pointer?.x;
  const py = pointer?.y;
  const measurable: Measurable = useMemo(
    () => (px !== undefined && py !== undefined ? { getBoundingClientRect: () => pointRect(px, py) } : target),
    [target, px, py],
  );
  const virtualRef = useRef<Measurable>(measurable);
  useLayoutEffect(() => { virtualRef.current = measurable; }, [measurable]);

  return (
    <Popper.Root>
      <Popper.Anchor virtualRef={virtualRef as React.RefObject<Element>} />
      <Portal.Root>
        <Popper.Content
          side={entry.side}
          align={entry.align}
          sideOffset={10}
          collisionPadding={12}
          avoidCollisions
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="ms-help-card"
        >
          <div className="ms-card-head">
            <span className="ms-card-emoji">{entry.emoji}</span>
            <span className="ms-card-title">{entry.title}</span>
          </div>
          <p className="ms-card-line">{entry.line}</p>

          {entry.chips && entry.chips.length > 0 && (
            <div className="ms-card-chips">
              {entry.chips.map((c) => (
                <span key={c.text} className="ms-chip">
                  <span className="ms-chip-emoji">{c.emoji}</span>
                  {c.text}
                </span>
              ))}
            </div>
          )}

          {entry.more && <p className="ms-card-more">{entry.more}</p>}
        </Popper.Content>
      </Portal.Root>
    </Popper.Root>
  );
}
