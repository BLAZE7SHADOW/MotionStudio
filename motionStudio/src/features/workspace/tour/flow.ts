import type { Project } from '@/engines/project/types';
import type { HelpId } from '@/content/help';

/**
 * A guided, sequential walkthrough: one step highlighted at a time, each
 * waiting for the user to actually do the thing before advancing.
 *
 * Generalized out of `quickStart.ts`'s first-run steps so a future guided
 * sequence — search a stock photo, add it, make it the background — is a new
 * `Flow` object and a trigger point, not new machinery. `useEditorTour.ts` is
 * the only thing that drives a `Flow`; it does not care which one.
 */

/** Everything a step's predicate is allowed to see. Plain data, deliberately
    — see `FlowStep.isDone` for why. */
export interface World {
  project: Project | undefined;
  editor: { selectedElementId: string | null; isPlaying: boolean };
}

export interface FlowStep {
  /** Which `HELP` entry supplies the card's words. */
  id: HelpId;
  /**
   * Where to point, when that isn't the same place as the words.
   *
   * driver.js makes everything outside the highlighted element
   * `pointer-events: none`, so an interactive step must be anchored to a
   * container holding whatever the user has to click. `effects-section` is a
   * header `<div>` with the effect picker as its *sibling* — spotlight it and
   * the picker goes dead, and the step can never complete. Anchoring on the
   * whole Properties panel keeps the copy about Effects and the clicking
   * possible. Defaults to `id`.
   */
  anchor?: HelpId;
  /** What to go and do, shown beside a hollow circle. */
  prompt: string;
  /** The reward, shown for a beat after they do it. */
  done: string;
  /**
   * Pure. **No store, no DOM, no React** — the expensive way to get one of
   * these wrong is a step that never completes, leaving the user staring at
   * an instruction they have already followed with no way forward but Skip.
   * Taking plain data and returning a boolean is what lets every step be
   * driven headlessly against fixtures (`tests/quickStart.test.mjs`), and
   * lets `atStart` (captured when the step opened, not absolute state) tell
   * a replay apart from a first run — "a text element exists" is trivially
   * true on a finished project, so every predicate asks what changed *since
   * this step opened* instead.
   *
   * Absent on a step that's read-only and ends the flow.
   */
  isDone?: (now: World, atStart: World) => boolean;
}

export interface Flow {
  id: string;
  steps: FlowStep[];
}
