import { Suspense } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { TextElement } from '../../../project/types';
import { parseEffectNumber } from '../../../project/types';
import { textElementStyle, elementBoxStyle } from '../../style';
import {
  Effects, SwapEffects, FromToEffects, NumberEffects,
  LazyTypewriter, LazyInlineHighlight, LazyMarkerHighlight,
  LazyValueSwap, LazyRolodexFlip, LazyPerspectiveMarquee,
} from '../../textEffects';

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
    // shows a harmless counter instead of breaking the frame. The Properties
    // panel warns about exactly these cases using the same parser.
    const from = parseEffectNumber(el.content) ?? 0;
    const target = parseEffectNumber(to) ?? 0;
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
