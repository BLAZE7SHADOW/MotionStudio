import type { Animation } from '../project/types';

export interface AnimationPreset {
  id: string;
  label: string;
  build: () => Animation[];
}

/**
 * Ready-made entrance animations. Each returns a fresh array so elements never
 * share animation objects. Presets compose primitives — "Slide Up" is a y-offset
 * plus a fade, exactly how a designer thinks about it.
 */
export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'fade',
    label: 'Fade In',
    build: () => [
      { property: 'opacity', from: 0, to: 1, startOffset: 0, duration: 15, easing: 'ease' },
    ],
  },
  {
    id: 'slide-up',
    label: 'Slide Up',
    build: () => [
      { property: 'y',       from: 60, to: 0, startOffset: 0, duration: 20, easing: 'ease' },
      { property: 'opacity', from: 0,  to: 1, startOffset: 0, duration: 15, easing: 'ease' },
    ],
  },
  {
    id: 'slide-in',
    label: 'Slide In',
    build: () => [
      { property: 'x',       from: 90, to: 0, startOffset: 0, duration: 20, easing: 'ease' },
      { property: 'opacity', from: 0,  to: 1, startOffset: 0, duration: 15, easing: 'ease' },
    ],
  },
  {
    id: 'pop',
    label: 'Pop In',
    build: () => [
      { property: 'scale',   from: 0.6, to: 1, startOffset: 0, duration: 22, easing: 'spring' },
      { property: 'opacity', from: 0,   to: 1, startOffset: 0, duration: 10, easing: 'ease' },
    ],
  },
];
