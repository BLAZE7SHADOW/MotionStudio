import { interpolate, spring, Easing } from 'remotion';
import type { Animation } from '../project/types';

/**
 * The accumulated result of all of an element's animations at a given frame.
 * The renderer applies this on top of the element's base pose:
 *   opacity → factor,  tx/ty → px offset,  scale → factor,  rotate → deg offset
 */
export interface AnimatedTransform {
  opacity: number;
  tx: number;
  ty: number;
  scale: number;
  rotate: number;
}

const IDENTITY: AnimatedTransform = { opacity: 1, tx: 0, ty: 0, scale: 1, rotate: 0 };

/** value of a single animation at a clip-local frame */
function animationValue(a: Animation, localFrame: number, fps: number): number {
  if (a.easing === 'spring') {
    // spring returns ~0→1 with overshoot; map it onto [from, to]
    const s = spring({
      frame: localFrame - a.startOffset,
      fps,
      durationInFrames: a.duration,
      config: { damping: 12, mass: 0.8, stiffness: 120 },
    });
    return a.from + (a.to - a.from) * s;
  }

  const easing = a.easing === 'ease' ? Easing.out(Easing.cubic) : Easing.linear;
  // interpolate holds `from` before the window and `to` after it (clamp)
  return interpolate(
    localFrame,
    [a.startOffset, a.startOffset + a.duration],
    [a.from, a.to],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing },
  );
}

/** fold every animation into one transform for this frame */
export function evaluateAnimations(
  animations: Animation[] | undefined,
  localFrame: number,
  fps: number,
): AnimatedTransform {
  if (!animations || animations.length === 0) return IDENTITY;

  const acc: AnimatedTransform = { ...IDENTITY };
  for (const a of animations) {
    const v = animationValue(a, localFrame, fps);
    switch (a.property) {
      case 'opacity': acc.opacity *= v; break;
      case 'x':       acc.tx += v;      break;
      case 'y':       acc.ty += v;      break;
      case 'scale':   acc.scale *= v;   break;
      case 'rotate':  acc.rotate += v;  break;
    }
  }
  return acc;
}
