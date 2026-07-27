import { useEffect, useMemo, useRef } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { evaluateAnimations } from '@/engines/animation';
import type { Animation } from '@/engines/project';

const PREVIEW_DURATION = 60;
const PREVIEW_FPS = 30;

function PreviewComposition({ animations }: { animations: Animation[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = evaluateAnimations(animations, frame, fps);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: '38%',
          height: '38%',
          borderRadius: '22%',
          background: 'var(--studio-accent, #7c3aed)',
          opacity: t.opacity,
          transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.scale}) rotate(${t.rotate}deg)`,
        }}
      />
    </AbsoluteFill>
  );
}

/**
 * A tiny always-looping live preview of one animation preset's motion —
 * sits inline on its picker button so "what does Slide Up actually look
 * like" is answered by glancing at it, not by adding it and pressing play.
 * `animations` is passed as plain data (not the preset object, which also
 * carries a `build` function) since inputProps only needs to be a React
 * prop here, not something export-serializable — keeping it to plain
 * data means this component has no dependency on how presets are shaped.
 */
export default function AnimationPreview({
  animations, size = 28,
}: { animations: Animation[]; size?: number }) {
  const playerRef = useRef<PlayerRef>(null);
  // Callers build this array inline, so it is a new reference every render.
  // Keying the memo on the array's *contents* is what actually holds the
  // Player still — memoising on the array itself would never hit.
  const key = JSON.stringify(animations);
  const inputProps = useMemo(() => ({ animations }), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    p.play();
  }, [key]);

  return (
    <div
      className="rounded-studio-sm overflow-hidden border border-studio-border bg-studio-bg shrink-0"
      style={{ width: size, height: size }}
    >
      <Player
        ref={playerRef}
        component={PreviewComposition}
        inputProps={inputProps}
        durationInFrames={PREVIEW_DURATION}
        fps={PREVIEW_FPS}
        compositionWidth={size}
        compositionHeight={size}
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
