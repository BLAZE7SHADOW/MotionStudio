import { lazy, Suspense } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { TextElement, TextEffect } from '../../../project/types';
import { textElementStyle, elementBoxStyle } from '../../style';

// Lazily imported — each effect is a separate bundle chunk, only loaded when used
const Effects = {
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
  'typewriter':          lazy(() => import('@/components/remocn/typewriter').then(m => ({ default: m.Typewriter }))),
  'matrix-decode':       lazy(() => import('@/components/remocn/matrix-decode').then(m => ({ default: m.MatrixDecode }))),
  'rgb-glitch-text':     lazy(() => import('@/components/remocn/rgb-glitch-text').then(m => ({ default: m.RGBGlitchText }))),
} satisfies Partial<Record<TextEffect, React.LazyExoticComponent<React.ComponentType<{
  text: string; fontSize?: number; color?: string; speed?: number;
}>>>>;

// Highlight effects have a different props shape — handled separately
const LazyInlineHighlight  = lazy(() => import('@/components/remocn/inline-highlight').then(m => ({ default: m.InlineHighlight })));
const LazyMarkerHighlight  = lazy(() => import('@/components/remocn/marker-highlight').then(m => ({ default: m.MarkerHighlight })));

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
