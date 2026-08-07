import { useEffect } from 'react';
import type { Driver, DriveStep, PopoverDOM } from 'driver.js';
import { HELP } from '@/content/help';
import { FIRST_VIDEO_FLOW } from './quickStart';
import type { FlowStep, World } from './flow';
import { anchorFor } from './anchors';
import { renderCard, renderTitle } from './popoverCard';
import { useEditorStore } from '@/engines/editor';
import { useProjectStore } from '@/engines/project';
import { useTourActive } from './tourActive';
import { track } from '@/lib/analytics';

/**
 * Running the quick start.
 *
 * `driver.js` and its stylesheet load dynamically — the walkthrough is a
 * once-per-user event, so no reason for every editor session (let alone the
 * landing page) to carry it. Same reasoning as the effects, shaders and the
 * web renderer.
 *
 * `startEditorTour` is a plain function rather than something the hook returns,
 * so the help menu can replay it without threading a callback down through the
 * layout.
 *
 * The interesting part is that steps advance **on what the user does**, not on
 * a Next button: each step subscribes to the editor and project stores and asks
 * its `isDone` predicate (see `quickStart.ts`) whether the thing has happened
 * yet. driver.js already leaves the highlighted element clickable — driver.css
 * sets `pointer-events: auto` on `.driver-active-element` and its children —
 * so the real control works through the overlay with nothing special from us.
 * That one detail is what makes a hands-on walkthrough possible at all.
 */

export const TOUR_SEEN_KEY = 'ms_editor_tour_seen';

/** How long the ✅ stays up before moving on: long enough to read, short
    enough that it reads as a reward rather than a wait. */
const CELEBRATE_MS = 900;

// Module-level, not a ref: React mounts effects twice in dev, and driver.js
// has no idea the second call is the same walkthrough.
let running = false;

/** Everything the predicates are allowed to see, read fresh. */
function world(): World {
  const projects = useProjectStore.getState();
  const editor = useEditorStore.getState();
  return {
    project: projects.getProject(projects.activeProjectId ?? ''),
    editor: { selectedElementId: editor.selectedElementId, isPlaying: editor.isPlaying },
  };
}

function toDriveStep(step: FlowStep, element: string): DriveStep {
  const entry = HELP[step.id];
  return {
    element,
    popover: {
      title: renderTitle(entry),
      description: renderCard(entry, {
        prompt: step.prompt,
        done: step.done,
        state: 'waiting',
      }),
      side: entry.side,
      align: entry.align,
      /* No Back button. Stepping back into a step you already completed would
         re-arm a predicate against the state you just left it in, so it could
         never fire again and you'd be looking at an instruction you have
         already followed. Six steps forward, or close it. */
      showButtons: ['next', 'close'],
      /* Honest about what the button does while the app is waiting on you.
         Spread rather than set-to-undefined: a per-step `nextBtnText` beats the
         config's `doneBtnText`, so setting one on the last step would leave it
         reading "Next" at the end of the walkthrough instead of "Got it". */
      ...(step.isDone ? { nextBtnText: 'Skip' } : {}),
    },
  };
}

/** Swap the waiting row for the reward, and stop the button saying "Skip". */
function celebrate(driverObj: Driver, step: FlowStep): void {
  const popover = driverObj.getState('popover') as PopoverDOM | undefined;
  if (!popover) return;
  popover.description.innerHTML = renderCard(HELP[step.id], {
    prompt: step.prompt,
    done: step.done,
    state: 'done',
  });
  // Belt and braces: if the timer below is ever lost, the button still moves on.
  popover.nextButton.innerHTML = 'Next';
}

/**
 * Watch the stores until this step's action happens. Returns its own teardown,
 * or null for a step with nothing to wait for.
 */
function watchStep(driverObj: Driver, step: FlowStep, index: number): (() => void) | null {
  if (!step.isDone) return null;

  const atStart = world();
  let fired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const check = () => {
    if (fired || !step.isDone?.(world(), atStart)) return;
    fired = true;
    celebrate(driverObj, step);
    track.quickStartStepDone({ id: step.id, index });
    timer = setTimeout(() => {
      if (driverObj.isActive()) driverObj.moveNext();
    }, CELEBRATE_MS);
  };

  const unsubscribe = [
    useEditorStore.subscribe(check),
    useProjectStore.subscribe(check),
  ];

  return () => {
    for (const off of unsubscribe) off();
    clearTimeout(timer);
  };
}

export async function startEditorTour(replay = false): Promise<void> {
  if (running) return;
  running = true;

  try {
    const [{ driver }] = await Promise.all([
      import('driver.js'),
      import('driver.js/dist/driver.css'),
      import('./tour.css'), // dark-theme overrides, loaded with the walkthrough
    ]);

    /* Resolved against the live DOM, so a step whose anchor isn't rendered is
       dropped rather than pointed at nothing. Keeping the FlowStep alongside
       its DriveStep is what lets the hooks below look up a step by index. */
    const live = FIRST_VIDEO_FLOW.steps.map((step) => ({
      step,
      element: anchorFor(step.anchor ?? step.id),
    })).filter((s): s is { step: FlowStep; element: string } => s.element !== null);

    if (live.length === 0) {
      running = false;
      return;
    }

    track.editorTourStarted({ replay });
    // Stand the hover layer down while the tour has the screen — driver.js is
    // already spotlighting one control, and a hover-flash on whatever the
    // cursor happens to be resting on would compete with that.
    useTourActive.getState().setActive(true);

    let stopWatching: (() => void) | null = null;
    const clear = () => {
      stopWatching?.();
      stopWatching = null;
    };

    const driverObj: Driver = driver({
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      doneBtnText: 'Got it',
      popoverClass: 'ms-tour',
      steps: live.map(({ step, element }) => toDriveStep(step, element)),

      onHighlighted: (_el, _driveStep, opts) => {
        clear();
        const index = opts.index ?? 0;
        const entry = live[index];
        if (entry) stopWatching = watchStep(driverObj, entry.step, index);
      },

      onDeselected: clear,

      onDestroyed: (_el, _driveStep, opts) => {
        clear();
        useTourActive.getState().setActive(false);
        running = false;
        localStorage.setItem(TOUR_SEEN_KEY, '1');

        const index = opts.index ?? 0;
        if (index >= live.length - 1) track.quickStartFinished();
        else track.quickStartAbandoned({ index });
      },
    });

    driverObj.drive();
  } catch {
    running = false; // never leave the walkthrough permanently un-startable
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
