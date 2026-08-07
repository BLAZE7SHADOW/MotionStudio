import type { DriverHint, Hints } from 'driver.js/hints';
import { HELP, type HelpId } from '@/content/help';
import { anchorFor } from './anchors';
import { renderCard, renderTitle } from './popoverCard';
import { track } from '@/lib/analytics';

/**
 * Helper dots — a small pulsing beacon beside every control that has something
 * to say, on demand and out of the way.
 *
 * This is where the twenty-one explanations the old tour delivered as a
 * compulsory wall now live. The information was never the problem; the timing
 * was. A dot sits next to the thing it describes and says nothing until asked,
 * so it can answer the question at the moment it occurs to you instead of ten
 * minutes before.
 *
 * ## Why driver.js rather than a component
 *
 * `driver.js@1.8` ships this as a second entry point (`driver.js/hints`), and
 * it does the awkward parts properly: beacons are `position: fixed` and
 * repositioned from a **capture-phase** scroll listener, so a dot on something
 * inside the Assets or Properties panel tracks that panel's own scrolling, not
 * just the window's. It also hides every beacon while a tour is running
 * (`.driver-active .driver-hint { display: none }`) and honours
 * `prefers-reduced-motion`. Writing that again to avoid a dependency we already
 * have would be work spent reaching parity.
 *
 * Both this and the quick start load their halves of driver.js lazily and read
 * their copy from `content/help.ts`, so the two can never describe the same
 * control differently.
 *
 * ## The four states
 *
 * `wanted` is the user's switch. `paused` is the quick start borrowing the
 * screen. Dots show only when wanted and not paused, which is why resuming
 * can't simply call `show()` — the user may have turned them off while the
 * walkthrough was running.
 */

let instance: Hints | null = null;
let loading: Promise<void> | null = null;
/** The user's setting. */
let wanted = false;
/** The quick start is running and owns the screen. */
let paused = false;

/** A beacon for every entry whose control is actually on screen right now. */
function buildHints(): DriverHint[] {
  return (Object.keys(HELP) as HelpId[]).flatMap<DriverHint>((id) => {
    const element = anchorFor(id);
    if (!element) return [];

    const entry = HELP[id];
    return [
      {
        id,
        element,
        /* Beacons default to the top edge of their anchor, which puts the
           toolbar's dots at y = -3 — half off the top of the window and barely
           clickable. `side: 'bottom'` on the popover already means "there is no
           room above this element", so it is exactly the set that needs its
           beacon underneath instead. Derived rather than stored: a second
           placement field on all 21 entries would be 21 chances to get it
           wrong, for one rule that has no exceptions. */
        beacon: { side: entry.side === 'bottom' ? 'bottom' : 'top', align: 'end' },
        popover: {
          title: renderTitle(entry),
          description: renderCard(entry, { includeMore: true }),
          side: entry.side,
          align: entry.align,
          popoverClass: 'ms-tour ms-help',
          /* No "Got it" button. Dismissing a hint in driver.js retires it for
             good, and dots that vanish one by one are not the mode the user
             asked for — this one stays until they switch it off. Clicking the
             beacon again, or anywhere else, closes the card. */
          showButton: false,
        },
        onOpen: () => track.helperHintOpened({ id }),
      },
    ];
  });
}

async function ensureLoaded(): Promise<void> {
  if (instance) return;

  loading ??= (async () => {
    const [{ hints }] = await Promise.all([
      import('driver.js/hints'),
      import('driver.js/dist/hints.css'),
      import('./tour.css'), // shared card styling with the quick start
      import('./helper.css'), // beacon colour and sizing
    ]);

    instance = hints({
      hints: [],
      // The whole promise of this mode: it never takes the screen away.
      overlay: false,
      beacon: { animate: true },
      popoverClass: 'ms-tour ms-help',
    });
  })();

  try {
    await loading;
  } catch {
    loading = null; // a failed chunk must not make the mode permanently dead
  }
}

/** Point the beacons at whatever is on screen now. Cheap; call it freely. */
export function refreshHelperDots(): void {
  if (!instance || !wanted || paused) return;
  instance.setHints(buildHints());
  instance.show();
}

/** Turn the mode on or off. Loads the library on first use only. */
export async function syncHelperDots(on: boolean): Promise<void> {
  wanted = on;

  if (!on) {
    instance?.hide();
    return;
  }
  if (paused) return;

  await ensureLoaded();
  refreshHelperDots();
}

/** The quick start is starting; stand down without forgetting the setting. */
export function pauseHelperDots(): void {
  paused = true;
  instance?.hide();
}

/** The quick start ended. Only come back if the user still wants us. */
export function resumeHelperDots(): void {
  paused = false;
  if (wanted) void syncHelperDots(true);
}
