import { lazy, Suspense } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { TextElement, TextEffect } from '../../../project/types';
import { textElementStyle, elementBoxStyle } from '../../style';

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
const SwapEffects = {
  'fade-through':       lazy(() => import('@/components/remocn/fade-through').then(m => ({ default: m.FadeThrough }))),
  'per-word-crossfade': lazy(() => import('@/components/remocn/per-word-crossfade').then(m => ({ default: m.PerWordCrossfade }))),
  'shared-axis-y':      lazy(() => import('@/components/remocn/shared-axis-y').then(m => ({ default: m.SharedAxisY }))),
  'shared-axis-z':      lazy(() => import('@/components/remocn/shared-axis-z').then(m => ({ default: m.SharedAxisZ }))),
} satisfies Partial<Record<TextEffect, React.LazyExoticComponent<React.ComponentType<{
  fromText: string; toText: string; fontSize?: number; color?: string; speed?: number;
}>>>>;

const FromToEffects = {
  'strikethrough-replace': lazy(() => import('@/components/remocn/strikethrough-replace').then(m => ({ default: m.StrikethroughReplace }))),
  'slot-machine-roll':     lazy(() => import('@/components/remocn/slot-machine-roll').then(m => ({ default: m.SlotMachineRoll }))),
} satisfies Partial<Record<TextEffect, React.LazyExoticComponent<React.ComponentType<{
  from: string; to: string; fontSize?: number; color?: string; speed?: number;
}>>>>;

const NumberEffects = {
  'rolling-number': lazy(() => import('@/components/remocn/rolling-number').then(m => ({ default: m.RollingNumber }))),
  'number-wheel':   lazy(() => import('@/components/remocn/number-wheel').then(m => ({ default: m.NumberWheel }))),
} satisfies Partial<Record<TextEffect, React.LazyExoticComponent<React.ComponentType<{
  from: number; to: number; fontSize?: number; color?: string; speed?: number;
}>>>>;

// List effects read each line of `content` as one item.
const LazyValueSwap          = lazy(() => import('@/components/remocn/value-swap').then(m => ({ default: m.ValueSwap })));
const LazyRolodexFlip        = lazy(() => import('@/components/remocn/rolodex-flip').then(m => ({ default: m.RolodexFlip })));
const LazyPerspectiveMarquee = lazy(() => import('@/components/remocn/perspective-marquee').then(m => ({ default: m.PerspectiveMarquee })));

// Typewriter and the two highlight effects take a different props shape than the
// shared `Effects` map (extra typewriter-only / before-highlight-after fields) —
// handled separately, and exported for the same preview-reuse reason as above.
export const LazyTypewriter      = lazy(() => import('@/components/remocn/typewriter').then(m => ({ default: m.Typewriter })));
export const LazyInlineHighlight = lazy(() => import('@/components/remocn/inline-highlight').then(m => ({ default: m.InlineHighlight })));
export const LazyMarkerHighlight = lazy(() => import('@/components/remocn/marker-highlight').then(m => ({ default: m.MarkerHighlight })));

export default function TextRenderer({ el }: { el: TextElement }) {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!el.textEffect) {
    return <div style={textElementStyle(el, 1, { localFrame, fps })}>{el.content}</div>;
  }

  const boxStyle = { ...elementBoxStyle(el, 1, { localFrame, fps }), overflow: 'hidden' as const };
  const sharedProps = { text: el.content, fontSize: el.fontSize, color: el.color, speed: el.textEffectSpeed ?? 1 };

  // Highlight effects need before/highlight/after split
  if (el.textEffect === 'inline-highlight' || el.textEffect === 'marker-highlight') {
    const hl = el.textEffectHighlight ?? (el.textEffect === 'marker-highlight' ? el.content : '');
    const idx = hl ? el.content.indexOf(hl) : -1;
    const before = idx > 0 ? el.content.slice(0, idx) : (el.textEffect === 'inline-highlight' ? el.content : '');
    const after  = idx >= 0 ? el.content.slice(idx + hl.length) : '';
    const hlProps = { before, highlight: hl || el.content, after, fontSize: el.fontSize, baseColor: el.color, speed: el.textEffectSpeed ?? 1 };

    return (
      <div style={boxStyle}>
        <Suspense fallback={null}>
          {el.textEffect === 'inline-highlight'
            ? <LazyInlineHighlight {...hlProps} />
            : <LazyMarkerHighlight {...hlProps} />}
        </Suspense>
      </div>
    );
  }

  if (el.textEffect === 'typewriter') {
    return (
      <div style={boxStyle}>
        <Suspense fallback={null}>
          <LazyTypewriter
            {...sharedProps}
            cursorColor={el.color}
            cursorBlinkPerSecond={el.textEffectCursorBlinkSpeed ?? 1}
          />
        </Suspense>
      </div>
    );
  }

  // ── Two-value effects: `content` is the "from", `contentTo` the "to" ──
  const speed = el.textEffectSpeed ?? 1;
  const to = el.contentTo ?? el.content;

  const SwapComponent = SwapEffects[el.textEffect as keyof typeof SwapEffects];
  if (SwapComponent) {
    return (
      <div style={boxStyle}>
        <Suspense fallback={null}>
          <SwapComponent fromText={el.content} toText={to} fontSize={el.fontSize} color={el.color} speed={speed} />
        </Suspense>
      </div>
    );
  }

  const FromToComponent = FromToEffects[el.textEffect as keyof typeof FromToEffects];
  if (FromToComponent) {
    return (
      <div style={boxStyle}>
        <Suspense fallback={null}>
          <FromToComponent from={el.content} to={to} fontSize={el.fontSize} color={el.color} speed={speed} />
        </Suspense>
      </div>
    );
  }

  const NumberComponent = NumberEffects[el.textEffect as keyof typeof NumberEffects];
  if (NumberComponent) {
    // Non-numeric text would render NaN — fall back to 0 so a mistyped value
    // shows a harmless counter instead of breaking the frame.
    const from = Number(el.content.replace(/[^\d.-]/g, '')) || 0;
    const target = Number(to.replace(/[^\d.-]/g, '')) || 0;
    return (
      <div style={boxStyle}>
        <Suspense fallback={null}>
          <NumberComponent from={from} to={target} fontSize={el.fontSize} color={el.color} speed={speed} />
        </Suspense>
      </div>
    );
  }

  // ── List effects: each line of `content` is one item ──
  if (el.textEffect === 'value-swap' || el.textEffect === 'rolodex-flip' || el.textEffect === 'perspective-marquee') {
    const items = el.content.split('\n').filter(Boolean);
    const style = { fontSize: el.fontSize, color: el.color, fontFamily: el.fontFamily };
    // value-swap needs explicit swap frames — space them evenly across the clip
    // so every value gets equal screen time regardless of how many there are.
    const step = el.durationInFrames / Math.max(items.length, 1);
    const swapAt = items.slice(1).map((_, i) => Math.round((i + 1) * step));
    return (
      <div style={boxStyle}>
        <Suspense fallback={null}>
          {el.textEffect === 'value-swap' && <LazyValueSwap values={items} at={swapAt} style={style} />}
          {el.textEffect === 'rolodex-flip' && <LazyRolodexFlip items={items} style={style} />}
          {el.textEffect === 'perspective-marquee' && (
            <LazyPerspectiveMarquee items={items} fontSize={el.fontSize} color={el.color} speed={speed} />
          )}
        </Suspense>
      </div>
    );
  }

  const EffectComponent = Effects[el.textEffect as keyof typeof Effects];
  if (!EffectComponent) return <div style={textElementStyle(el, 1, { localFrame, fps })}>{el.content}</div>;

  return (
    <div style={boxStyle}>
      <Suspense fallback={null}>
        <EffectComponent {...sharedProps} />
      </Suspense>
    </div>
  );
}
