import type { CanvasElement, TextElement } from '@/engines/project/types';
import { scenesOf } from '@/engines/project/scenes';
import type { Flow, FlowStep, World } from './flow';

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
 * Everything the old tour said still exists; it moved to the hover cards
 * (`hooks/useHelperLayer.ts`), where it is available on demand instead of up
 * front.
 *
 * The mechanics — why `isDone` is pure, why it compares against `atStart` —
 * are documented on `FlowStep` in `flow.ts`, the primitive this is an
 * instance of.
 */

const elementsOf = (w: World): CanvasElement[] => w.project?.canvas.elements ?? [];

const textElements = (w: World): TextElement[] =>
  elementsOf(w).filter((el): el is TextElement => el.type === 'text');

/** The frame an element occupies, as one comparable string. */
const box = (el: CanvasElement) =>
  `${el.x},${el.y},${el.width},${el.height},${el.rotation}`;

/** `scenesOf` wants a real project; a World may not have one yet. */
const shotCount = (w: World) => (w.project ? scenesOf(w.project).length : 0);

const STEPS: FlowStep[] = [
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

export const FIRST_VIDEO_FLOW: Flow = { id: 'first-video', steps: STEPS };
