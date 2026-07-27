import { useEffect } from 'react';
import { EDITOR_TOUR_STEPS, TOUR_SEEN_KEY } from './editorTour';
import { track } from '@/lib/analytics';

/**
 * The first-run editor walkthrough.
 *
 * `driver.js` and its stylesheet load dynamically — the tour is a
 * once-per-user event, so no reason for every editor session (let alone the
 * landing page) to carry it. Same reasoning as the effects, shaders and the
 * web renderer.
 *
 * `startEditorTour` is a plain function rather than something the hook
 * returns, so the account menu can replay it without threading a callback
 * down through the layout.
 */

// Module-level, not a ref: React mounts effects twice in dev, and driver.js
// has no idea the second call is the same tour.
let running = false;

export async function startEditorTour(replay = false): Promise<void> {
  if (running) return;
  running = true;

  try {
    const [{ driver }] = await Promise.all([
      import('driver.js'),
      import('driver.js/dist/driver.css'),
      import('./tour.css'), // dark-theme overrides, loaded with the tour
    ]);

    track.editorTourStarted({ replay });

    driver({
      showProgress: true,
      steps: EDITOR_TOUR_STEPS,
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Got it',
      popoverClass: 'ms-tour',
      onDestroyed: () => {
        running = false;
        localStorage.setItem(TOUR_SEEN_KEY, '1');
      },
    }).drive();
  } catch {
    running = false; // never leave the tour permanently un-startable
  }
}

export function useEditorTour(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    if (localStorage.getItem(TOUR_SEEN_KEY)) return;

    // Let the editor paint and the panels measure before spotlighting them:
    // driver.js positions against real geometry, and CanvasPanel sizes itself
    // from a ResizeObserver, so starting immediately highlights a stale box.
    const t = setTimeout(() => void startEditorTour(false), 600);
    return () => clearTimeout(t);
  }, [ready]);
}
