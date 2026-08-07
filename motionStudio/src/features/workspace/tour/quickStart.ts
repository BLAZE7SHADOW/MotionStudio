import type { CanvasElement, Project, TextElement } from '@/engines/project/types';
import { scenesOf } from '@/engines/project/scenes';
import type { HelpId } from '@/content/help';

/**
 * The first-run walkthrough: six things you *do*, not twenty-one you read.
 *
 * The tour this replaced was 21 read-only steps of correct, complete prose that
 * nobody finished, because nobody learns a video editor by reading about one.
 * Here each step names one action, then **waits for the user to actually take
 * it** and moves on by itself. Ninety seconds in you have a title that animates
 * over a second shot and plays back — which is the thing that makes someone
 * want a video editor, and which the old tour never once let you feel.
 *
 * Everything the old tour said still exists; it moved to the helper dots
 * (`helperMode.ts`), where it is available on demand instead of up front.
 *
 * ## Why `isDone` is a pure function
 *
 * These predicates are the only part of the walkthrough with real logic, and
 * the expensive way to get them wrong is a step that never completes — the user
 * is then stuck staring at an instruction they have already followed. So they
 * take **plain data and return a boolean**: no store, no DOM, no React. The
 * subscription that feeds them live state lives in `useEditorTour.ts`, and
 * `tests/quickStart.test.mjs` drives all six against fixtures in milliseconds.
 *
 * ## Why they compare against `atStart`
 *
 * "A text element exists" is wrong on a replay — someone with a finished
 * project would have step 1 complete instantly and the walkthrough would flash
 * past without them touching anything. Every predicate therefore asks whether
 * something changed **since this step opened**, so a replay is as hands-on as
 * a first run.
 */

/** Everything the predicates are allowed to see. Plain data, deliberately. */
export interface World {
  project: Project | undefined;
  editor: { selectedElementId: string | null; isPlaying: boolean };
}

export interface QuickStep {
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
  /** Absent on the last step, which is read-only and ends the walkthrough. */
  isDone?: (now: World, atStart: World) => boolean;
}

const elementsOf = (w: World): CanvasElement[] => w.project?.canvas.elements ?? [];

const textElements = (w: World): TextElement[] =>
  elementsOf(w).filter((el): el is TextElement => el.type === 'text');

/** The frame an element occupies, as one comparable string. */
const box = (el: CanvasElement) =>
  `${el.x},${el.y},${el.width},${el.height},${el.rotation}`;

/** `scenesOf` wants a real project; a World may not have one yet. */
const shotCount = (w: World) => (w.project ? scenesOf(w.project).length : 0);

export const QUICK_STEPS: QuickStep[] = [
  {
    id: 'insert',
    prompt: 'Your turn — click T',
    done: 'Nice. That is your title.',
    isDone: (now, atStart) => textElements(now).length > textElements(atStart).length,
  },

  {
    /* Anchored on the canvas, which is exactly what they must touch. driver.js
       keeps the highlighted element clickable, so the drag works through the
       overlay without any special handling. */
    id: 'canvas',
    prompt: 'Drag it somewhere else',
    done: 'That is all there is to it.',
    isDone: (now, atStart) => {
      const before = new Map(elementsOf(atStart).map((el) => [el.id, box(el)]));
      // Resizing and rotating count too: any of the three proves the point, and
      // insisting on a move specifically would strand someone who grabbed a
      // corner instead of the middle.
      return elementsOf(now).some((el) => {
        const was = before.get(el.id);
        return was !== undefined && was !== box(el);
      });
    },
  },

  {
    /* Effects only exists while a text element is selected — true here, because
       step 2 ended with the user dragging one. */
    id: 'effects-section',
    anchor: 'properties',
    prompt: 'Pick an effect for it',
    done: 'Now it moves.',
    isDone: (now, atStart) => {
      const before = new Map(textElements(atStart).map((el) => [el.id, el.textEffect]));
      return textElements(now).some((el) => el.textEffect && el.textEffect !== before.get(el.id));
    },
  },

  {
    id: 'preview',
    prompt: 'Press play and watch',
    done: 'There it is — your video.',
    // Playing already? Then this step is about pressing it, so require the flip.
    isDone: (now, atStart) => now.editor.isPlaying && !atStart.editor.isPlaying,
  },

  {
    id: 'shots',
    prompt: 'Add a second shot',
    done: 'Two moments. That is a video.',
    isDone: (now, atStart) => shotCount(now) > shotCount(atStart),
  },

  {
    /* No action to wait for: a first-run user has nothing worth exporting, and
       making them render a file to escape the walkthrough would be absurd. */
    id: 'export',
    prompt: 'That is everything — this is how it leaves',
    done: '',
  },
];
