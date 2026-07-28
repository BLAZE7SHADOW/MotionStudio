import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { RotateCcw } from 'lucide-react';
import { AbsoluteFill } from 'remotion';
import {
  Effects,
  SwapEffects,
  FromToEffects,
  NumberEffects,
  LazyTypewriter,
  LazyInlineHighlight,
  LazyMarkerHighlight,
  LazyValueSwap,
  LazyRolodexFlip,
  LazyPerspectiveMarquee,
} from '@/engines/rendering/textEffects';
import { TEXT_EFFECT_INFO } from '@/content/textEffectInfo';
import type { TextEffect } from '@/engines/project';

const PREVIEW_W = 320;
const PREVIEW_H = 120;
const PREVIEW_FPS = 30;
const PREVIEW_DURATION = 120;
const PREVIEW_TEXT = 'Preview text';
const FONT_SIZE = 30;

// Sample data for the effects that don't take a single string. Real stand-ins
// ("Before" → "After", 0 → 100, three list items) make the preview double as an
// explanation of what the effect expects as input.
const SAMPLE_FROM = 'Before';
const SAMPLE_TO = 'After';
const SAMPLE_ITEMS = ['First', 'Second', 'Third'];

// Text effects render on a transparent background — a flat panel color would
// make that indistinguishable from an opaque one, so a checkerboard (the
// standard "this is transparent" convention) shows through honestly.
const CHECKER_STYLE = {
  backgroundImage:
    'repeating-conic-gradient(var(--studio-surface, #2a2a2e) 0% 25%, var(--studio-bg, #1c1c1f) 0% 50%)',
  backgroundSize: '16px 16px',
};

function PreviewComposition({ effect, color }: { effect: TextEffect; color: string }) {
  const center = {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    display: 'flex' as const,
  };
  const wrap = (node: React.ReactNode) => (
    <AbsoluteFill style={center}>
      <Suspense fallback={null}>{node}</Suspense>
    </AbsoluteFill>
  );

  /* ── highlight effects take a split sentence ── */
  if (effect === 'inline-highlight' || effect === 'marker-highlight') {
    const Comp = effect === 'inline-highlight' ? LazyInlineHighlight : LazyMarkerHighlight;
    return wrap(
      <Comp before="This is a " highlight="preview" after="" baseColor={color} fontSize={FONT_SIZE} />,
    );
  }

  if (effect === 'typewriter') {
    return wrap(
      <LazyTypewriter text={PREVIEW_TEXT} fontSize={FONT_SIZE} color={color} cursorColor={color} />,
    );
  }

  /* ── list effects — one item per line of the real text box ── */
  if (effect === 'value-swap') {
    return wrap(
      <LazyValueSwap values={SAMPLE_ITEMS} at={[40, 80]} style={{ fontSize: FONT_SIZE, color }} />,
    );
  }
  if (effect === 'rolodex-flip') {
    return wrap(<LazyRolodexFlip items={SAMPLE_ITEMS} style={{ fontSize: FONT_SIZE, color }} />);
  }
  if (effect === 'perspective-marquee') {
    return wrap(<LazyPerspectiveMarquee items={SAMPLE_ITEMS} fontSize={FONT_SIZE} color={color} />);
  }

  /* ── two-value effects — a "from" and a "to" ── */
  const Swap = SwapEffects[effect as keyof typeof SwapEffects];
  if (Swap) {
    return wrap(
      <Swap fromText={SAMPLE_FROM} toText={SAMPLE_TO} fontSize={FONT_SIZE} color={color} />,
    );
  }

  const FromTo = FromToEffects[effect as keyof typeof FromToEffects];
  if (FromTo) {
    return wrap(<FromTo from={SAMPLE_FROM} to={SAMPLE_TO} fontSize={FONT_SIZE} color={color} />);
  }

  const NumberComp = NumberEffects[effect as keyof typeof NumberEffects];
  if (NumberComp) {
    return wrap(<NumberComp from={0} to={100} fontSize={FONT_SIZE} color={color} />);
  }

  /* ── everything else takes a single string ── */
  const Comp = Effects[effect as keyof typeof Effects];
  if (!Comp) return null;
  return wrap(<Comp text={PREVIEW_TEXT} fontSize={FONT_SIZE} color={color} />);
}

/**
 * A looping live preview of one text effect, with a line saying what it's for.
 *
 * Covers every effect, including the list and two-value ones. Those used to
 * render blank: this only looked in `Effects`, while the swap, from-to, number
 * and list effects live in four other maps — a third of the catalogue showed an
 * empty box, which reads as broken rather than as "this one takes different
 * input".
 */
export default function TextEffectPreview({ effect, color }: { effect: TextEffect; color: string }) {
  const playerRef = useRef<PlayerRef>(null);

  // A fresh object here makes the Player treat every parent render as new data
  // and reset to frame 0 — and the Properties panel re-renders on any store
  // change, so the preview never got past its first frame.
  const inputProps = useMemo(() => ({ effect, color }), [effect, color]);

  // Driven explicitly rather than via autoPlay, which doesn't reliably start
  // when the element mounts inside a panel that is still settling.
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    p.play();
  }, [effect]);

  function replay() {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    p.play();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="relative rounded-studio-md overflow-hidden border border-studio-border"
        style={{ width: '100%', aspectRatio: `${PREVIEW_W} / ${PREVIEW_H}`, ...CHECKER_STYLE }}
      >
        <Player
          key={effect}
          ref={playerRef}
          component={PreviewComposition}
          inputProps={inputProps}
          durationInFrames={PREVIEW_DURATION}
          fps={PREVIEW_FPS}
          compositionWidth={PREVIEW_W}
          compositionHeight={PREVIEW_H}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          loop
          clickToPlay={false}
          doubleClickToFullscreen={false}
          allowFullscreen={false}
        />

        {/* Entrance effects finish well inside the loop, so the preview spends
            most of its time on a static end frame. Replaying beats waiting for
            the loop to come round. */}
        <button
          type="button"
          onClick={replay}
          title="Replay"
          aria-label="Replay preview"
          className="absolute bottom-1 right-1 w-5 h-5 rounded-studio-sm flex items-center justify-center bg-studio-bg/70 text-studio-text-faint hover:text-studio-text transition-colors duration-120"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[10px] text-studio-text-faint leading-relaxed">
        {TEXT_EFFECT_INFO[effect]}
      </p>
    </div>
  );
}
