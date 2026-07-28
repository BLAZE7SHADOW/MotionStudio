import { lazy } from 'react';
import type { TextEffect } from '../project/types';

/**
 * The lazy component map for every text effect.
 *
 * Lives apart from `TextRenderer` because two callers need it — the renderer
 * and the Properties panel's live preview — and a module that exports both
 * components and shared constants breaks fast refresh. Same split as
 * `content/blocks/registry.ts`.
 *
 * The effects are grouped by the *shape of input* they take, not by what they
 * look like: a single string, a from/to pair, a numeric from/to, or a list.
 * Anything rendering one has to dispatch across all four — a caller that checks
 * only `Effects` silently renders nothing for a third of the catalogue.
 */

// Lazily imported — each effect is a separate bundle chunk, only loaded when used.
// Exported so a live preview thumbnail (Properties panel) can reuse the same map.
export const Effects = {
  'soft-blur-in':        lazy(() => import('@/components/remocn/soft-blur-in').then(m => ({ default: m.SoftBlurIn }))),
  'blur-out-up':         lazy(() => import('@/components/remocn/blur-out-up').then(m => ({ default: m.BlurOutUp }))),
  'focus-blur-resolve':  lazy(() => import('@/components/remocn/focus-blur-resolve').then(m => ({ default: m.FocusBlurResolve }))),
  'tracking-in':         lazy(() => import('@/components/remocn/tracking-in').then(m => ({ default: m.TrackingIn }))),
  'per-character-rise':  lazy(() => import('@/components/remocn/per-character-rise').then(m => ({ default: m.PerCharacterRise }))),
  'bottom-up-letters':   lazy(() => import('@/components/remocn/bottom-up-letters').then(m => ({ default: m.BottomUpLetters }))),
  'top-down-letters':    lazy(() => import('@/components/remocn/top-down-letters').then(m => ({ default: m.TopDownLetters }))),
  'spring-scale-in':     lazy(() => import('@/components/remocn/spring-scale-in').then(m => ({ default: m.SpringScaleIn }))),
  'micro-scale-fade':    lazy(() => import('@/components/remocn/micro-scale-fade').then(m => ({ default: m.MicroScaleFade }))),
  'scale-down-fade':     lazy(() => import('@/components/remocn/scale-down-fade').then(m => ({ default: m.ScaleDownFade }))),
  'staggered-fade-up':   lazy(() => import('@/components/remocn/staggered-fade-up').then(m => ({ default: m.StaggeredFadeUp }))),
  'mask-reveal-up':      lazy(() => import('@/components/remocn/mask-reveal-up').then(m => ({ default: m.MaskRevealUp }))),
  'line-by-line-slide':  lazy(() => import('@/components/remocn/line-by-line-slide').then(m => ({ default: m.LineByLineSlide }))),
  'kinetic-center-build':lazy(() => import('@/components/remocn/kinetic-center-build').then(m => ({ default: m.KineticCenterBuild }))),
  'short-slide-right':   lazy(() => import('@/components/remocn/short-slide-right').then(m => ({ default: m.ShortSlideRight }))),
  'short-slide-down':    lazy(() => import('@/components/remocn/short-slide-down').then(m => ({ default: m.ShortSlideDown }))),
  'shimmer-sweep':       lazy(() => import('@/components/remocn/shimmer-sweep').then(m => ({ default: m.ShimmerSweep }))),
  'matrix-decode':       lazy(() => import('@/components/remocn/matrix-decode').then(m => ({ default: m.MatrixDecode }))),
  'rgb-glitch-text':     lazy(() => import('@/components/remocn/rgb-glitch-text').then(m => ({ default: m.RGBGlitchText }))),
  'infinite-marquee':    lazy(() => import('@/components/remocn/infinite-marquee').then(m => ({ default: m.InfiniteMarquee }))),
} satisfies Partial<Record<TextEffect, React.LazyExoticComponent<React.ComponentType<{
  text: string; fontSize?: number; color?: string; speed?: number;
}>>>>;

// Two-value effects animate from one value to another. Their prop NAMES differ
// (fromText/toText vs from/to), so each group is mapped separately rather than
// forced through one signature.
export const SwapEffects = {
  'fade-through':       lazy(() => import('@/components/remocn/fade-through').then(m => ({ default: m.FadeThrough }))),
  'per-word-crossfade': lazy(() => import('@/components/remocn/per-word-crossfade').then(m => ({ default: m.PerWordCrossfade }))),
  'shared-axis-y':      lazy(() => import('@/components/remocn/shared-axis-y').then(m => ({ default: m.SharedAxisY }))),
  'shared-axis-z':      lazy(() => import('@/components/remocn/shared-axis-z').then(m => ({ default: m.SharedAxisZ }))),
} satisfies Partial<Record<TextEffect, React.LazyExoticComponent<React.ComponentType<{
  fromText: string; toText: string; fontSize?: number; color?: string; speed?: number;
}>>>>;

export const FromToEffects = {
  'strikethrough-replace': lazy(() => import('@/components/remocn/strikethrough-replace').then(m => ({ default: m.StrikethroughReplace }))),
  'slot-machine-roll':     lazy(() => import('@/components/remocn/slot-machine-roll').then(m => ({ default: m.SlotMachineRoll }))),
} satisfies Partial<Record<TextEffect, React.LazyExoticComponent<React.ComponentType<{
  from: string; to: string; fontSize?: number; color?: string; speed?: number;
}>>>>;

export const NumberEffects = {
  'rolling-number': lazy(() => import('@/components/remocn/rolling-number').then(m => ({ default: m.RollingNumber }))),
  'number-wheel':   lazy(() => import('@/components/remocn/number-wheel').then(m => ({ default: m.NumberWheel }))),
} satisfies Partial<Record<TextEffect, React.LazyExoticComponent<React.ComponentType<{
  from: number; to: number; fontSize?: number; color?: string; speed?: number;
}>>>>;

// List effects read each line of `content` as one item.
export const LazyValueSwap          = lazy(() => import('@/components/remocn/value-swap').then(m => ({ default: m.ValueSwap })));
export const LazyRolodexFlip        = lazy(() => import('@/components/remocn/rolodex-flip').then(m => ({ default: m.RolodexFlip })));
export const LazyPerspectiveMarquee = lazy(() => import('@/components/remocn/perspective-marquee').then(m => ({ default: m.PerspectiveMarquee })));

// Typewriter and the two highlight effects take a different props shape than the
// shared `Effects` map (extra typewriter-only / before-highlight-after fields) —
// handled separately, and exported for the same preview-reuse reason as above.
export const LazyTypewriter      = lazy(() => import('@/components/remocn/typewriter').then(m => ({ default: m.Typewriter })));
export const LazyInlineHighlight = lazy(() => import('@/components/remocn/inline-highlight').then(m => ({ default: m.InlineHighlight })));
export const LazyMarkerHighlight = lazy(() => import('@/components/remocn/marker-highlight').then(m => ({ default: m.MarkerHighlight })));
