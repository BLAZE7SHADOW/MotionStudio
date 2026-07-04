import type { Animation, AnimationProperty } from '../project/types';

export interface AnimationPreset {
  id: string;
  label: string;
  kind: 'enter' | 'exit';
  /** exit presets use durationInFrames to place themselves at the clip's end */
  build: (durationInFrames: number) => Animation[];
}

/**
 * Ready-made animations. Enter presets play at the clip start; exit presets are
 * positioned near the clip end using the clip's duration. Because animations
 * hold their `from` value before their window and `to` after (clamp), an enter
 * and an exit fade compose cleanly into a fade-in-then-out.
 */
export const ANIMATION_PRESETS: AnimationPreset[] = [
  /* ── enter ── */
  {
    id: 'fade', label: 'Fade In', kind: 'enter',
    build: () => [
      { property: 'opacity', from: 0, to: 1, startOffset: 0, duration: 15, easing: 'ease' },
    ],
  },
  {
    id: 'slide-up', label: 'Slide Up', kind: 'enter',
    build: () => [
      { property: 'y',       from: 60, to: 0, startOffset: 0, duration: 20, easing: 'ease' },
      { property: 'opacity', from: 0,  to: 1, startOffset: 0, duration: 15, easing: 'ease' },
    ],
  },
  {
    id: 'slide-in', label: 'Slide In', kind: 'enter',
    build: () => [
      { property: 'x',       from: 90, to: 0, startOffset: 0, duration: 20, easing: 'ease' },
      { property: 'opacity', from: 0,  to: 1, startOffset: 0, duration: 15, easing: 'ease' },
    ],
  },
  {
    id: 'pop', label: 'Pop In', kind: 'enter',
    build: () => [
      { property: 'scale',   from: 0.6, to: 1, startOffset: 0, duration: 22, easing: 'spring' },
      { property: 'opacity', from: 0,   to: 1, startOffset: 0, duration: 10, easing: 'ease' },
    ],
  },

  /* ── exit ── */
  {
    id: 'fade-out', label: 'Fade Out', kind: 'exit',
    build: (dur) => {
      const d = 15, s = Math.max(0, dur - d);
      return [{ property: 'opacity', from: 1, to: 0, startOffset: s, duration: d, easing: 'ease' }];
    },
  },
  {
    id: 'slide-out', label: 'Slide Out', kind: 'exit',
    build: (dur) => {
      const d = 20, s = Math.max(0, dur - d);
      return [
        { property: 'y',       from: 0, to: 60, startOffset: s, duration: d, easing: 'ease' },
        { property: 'opacity', from: 1, to: 0,  startOffset: s, duration: d, easing: 'ease' },
      ];
    },
  },
  {
    id: 'pop-out', label: 'Pop Out', kind: 'exit',
    build: (dur) => {
      const d = 18, s = Math.max(0, dur - d);
      return [
        { property: 'scale',   from: 1, to: 0.6, startOffset: s, duration: d, easing: 'ease' },
        { property: 'opacity', from: 1, to: 0,   startOffset: s, duration: d, easing: 'ease' },
      ];
    },
  },
];

/* ── sensible default when adding a single bare property ── */
const DEFAULTS: Record<AnimationProperty, Omit<Animation, 'property'>> = {
  opacity: { from: 0,    to: 1, startOffset: 0, duration: 15, easing: 'ease' },
  x:       { from: 90,   to: 0, startOffset: 0, duration: 20, easing: 'ease' },
  y:       { from: 60,   to: 0, startOffset: 0, duration: 20, easing: 'ease' },
  scale:   { from: 0.6,  to: 1, startOffset: 0, duration: 20, easing: 'spring' },
  rotate:  { from: -15,  to: 0, startOffset: 0, duration: 20, easing: 'ease' },
};

export function defaultAnimationFor(property: AnimationProperty): Animation {
  return { property, ...DEFAULTS[property] };
}
