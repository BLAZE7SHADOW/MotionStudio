import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { AbsoluteFill } from 'remotion';
import { Effects, LazyTypewriter, LazyInlineHighlight, LazyMarkerHighlight } from '@/engines/rendering/components/renderers/TextRenderer';
import type { TextEffect } from '@/engines/project';

const PREVIEW_W = 320;
const PREVIEW_H = 120;
const PREVIEW_TEXT = 'Preview text';

// Text effects render on a transparent background — a flat panel color would
// make that indistinguishable from an opaque one, so a checkerboard (the
// standard "this is transparent" convention) shows through honestly.
const CHECKER_STYLE = {
  backgroundImage:
    'repeating-conic-gradient(var(--studio-surface, #2a2a2e) 0% 25%, var(--studio-bg, #1c1c1f) 0% 50%)',
  backgroundSize: '16px 16px',
};

function PreviewComposition({ effect, color }: { effect: TextEffect; color: string }) {
  const center = { alignItems: 'center' as const, justifyContent: 'center' as const, display: 'flex' as const };

  if (effect === 'inline-highlight' || effect === 'marker-highlight') {
    const Comp = effect === 'inline-highlight' ? LazyInlineHighlight : LazyMarkerHighlight;
    return (
      <AbsoluteFill style={center}>
        <Suspense fallback={null}>
          <Comp before="This is a " highlight="preview" after="" baseColor={color} fontSize={32} />
        </Suspense>
      </AbsoluteFill>
    );
  }

  if (effect === 'typewriter') {
    return (
      <AbsoluteFill style={center}>
        <Suspense fallback={null}>
          <LazyTypewriter text={PREVIEW_TEXT} fontSize={32} color={color} cursorColor={color} />
        </Suspense>
      </AbsoluteFill>
    );
  }

  const Comp = Effects[effect as keyof typeof Effects];
  if (!Comp) return null;
  return (
    <AbsoluteFill style={center}>
      <Suspense fallback={null}>
        <Comp text={PREVIEW_TEXT} fontSize={32} color={color} />
      </Suspense>
    </AbsoluteFill>
  );
}

/**
 * A small looping live preview of one text effect — same idea as ShaderPreview,
 * so you can see how an effect actually moves/reveals before committing to it,
 * since a plain <select> option only has a name.
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

  return (
    <div
      className="rounded-studio-md overflow-hidden border border-studio-border"
      style={{ width: '100%', aspectRatio: `${PREVIEW_W} / ${PREVIEW_H}`, ...CHECKER_STYLE }}
    >
      <Player
        key={effect}
        ref={playerRef}
        component={PreviewComposition}
        inputProps={inputProps}
        durationInFrames={90}
        fps={30}
        compositionWidth={PREVIEW_W}
        compositionHeight={PREVIEW_H}
        style={{ width: '100%', height: '100%' }}
        controls={false}
        loop
        autoPlay
        clickToPlay={false}
        doubleClickToFullscreen={false}
        allowFullscreen={false}
      />
    </div>
  );
}
