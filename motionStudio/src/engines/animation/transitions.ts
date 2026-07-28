import type { Animation } from '../project/types';

/**
 * What happens at a cut.
 *
 * The insight that makes this cheap: **a transition is already an animation.**
 * A zoom punch is `scale 1.18 → 1`; a whip is `x +432 → 0`. Both are exactly
 * what `Animation` describes, and `evaluateAnimations` is already called by the
 * Remotion renderer *and* by `canvasFrame.ts`, so a transition built this way
 * renders and exports everywhere without a line changing in either.
 *
 * Every animation here is tagged `source: 'transition'`, which is what lets a
 * transition be replaced without disturbing animations the user added by hand.
 * Guessing which animations were ours would be the alternative, and it would be
 * wrong the first time somebody added their own scale.
 */

export type TransitionId = 'cut' | 'fade' | 'zoom-punch' | 'whip' | 'spin';

export interface TransitionPreset {
  id: TransitionId;
  label: string;
  /** Shown under the picker — what it looks like, not what it does. */
  hint: string;
}

/**
 * Five, chosen because they read at a hard cut.
 *
 * No cross-dissolve: shots are sequential and never overlap, so two of them can
 * never be on screen at once. It is also the least useful transition for this
 * kind of edit — `fade` still gives a clean dissolve out of black.
 */
export const TRANSITIONS: TransitionPreset[] = [
  { id: 'cut', label: 'Cut', hint: 'Straight cut, no movement.' },
  { id: 'fade', label: 'Fade', hint: 'Comes up out of black.' },
  { id: 'zoom-punch', label: 'Zoom punch', hint: 'Snaps in from slightly too big.' },
  { id: 'whip', label: 'Whip', hint: 'Flies in from the side.' },
  { id: 'spin', label: 'Spin', hint: 'Twists into place.' },
];

/** Fallback length when there is no tempo to take one from. */
export const DEFAULT_TRANSITION_FRAMES = 6;
/** Shorter than this doesn't register; longer stops feeling like a cut. */
export const MIN_TRANSITION_FRAMES = 3;
export const MAX_TRANSITION_FRAMES = 12;

/**
 * How long a transition should last.
 *
 * Half a beat when there's a grid. A transition that scales with the tempo is
 * the difference between landing *on* the beat and being *of* it — the same
 * move at 90 and 160 BPM reads as sloppy at one of them.
 */
export function transitionFrames(fps: number, bpm?: number): number {
  if (!bpm || bpm <= 0 || fps <= 0) return DEFAULT_TRANSITION_FRAMES;
  const halfBeat = ((60 / bpm) / 2) * fps;
  return Math.round(Math.min(MAX_TRANSITION_FRAMES, Math.max(MIN_TRANSITION_FRAMES, halfBeat)));
}

export interface TransitionContext {
  durationInFrames: number;
  /** Composition width, so travel scales with the format. A 180px shove is
      barely a nudge at 1920 and a catastrophe at 1080×1920. */
  compositionWidth: number;
}

const tag = (a: Omit<Animation, 'source'>): Animation => ({ ...a, source: 'transition' });

/**
 * The animations for a transition.
 *
 * Every one ends on the element's own pose — `to: 1` for factors, `to: 0` for
 * offsets — so a transition can always be removed by deleting it, and can never
 * leave an element permanently displaced.
 */
export function buildTransition(id: TransitionId, ctx: TransitionContext): Animation[] {
  const d = Math.max(1, Math.round(ctx.durationInFrames));
  const travel = Math.round(ctx.compositionWidth * 0.4);

  switch (id) {
    case 'fade':
      return [tag({ property: 'opacity', from: 0, to: 1, startOffset: 0, duration: d, easing: 'ease' })];

    case 'zoom-punch':
      return [tag({ property: 'scale', from: 1.18, to: 1, startOffset: 0, duration: d, easing: 'spring' })];

    case 'whip':
      return [
        tag({ property: 'x', from: travel, to: 0, startOffset: 0, duration: d, easing: 'ease' }),
        // A short opacity ramp hides the hard edge as it arrives; without it the
        // element pops into existence at full strength and the whip reads as a
        // glitch rather than a movement.
        tag({ property: 'opacity', from: 0, to: 1, startOffset: 0, duration: Math.max(1, Math.round(d / 2)), easing: 'ease' }),
      ];

    case 'spin':
      return [
        tag({ property: 'rotate', from: 10, to: 0, startOffset: 0, duration: d, easing: 'spring' }),
        tag({ property: 'scale', from: 1.1, to: 1, startOffset: 0, duration: d, easing: 'spring' }),
      ];

    case 'cut':
    default:
      return [];
  }
}
