import { Suspense } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { AbsoluteFill } from 'remotion';
import { Shaders } from '@/engines/rendering/shaders';
import type { ShaderPreset } from '@/engines/project';

const PREVIEW_W = 320;
const PREVIEW_H = 180;

function PreviewComposition({ preset }: { preset: ShaderPreset }) {
  const ShaderComponent = Shaders[preset];
  return (
    <AbsoluteFill>
      <Suspense fallback={null}>
        <ShaderComponent />
      </Suspense>
    </AbsoluteFill>
  );
}

/**
 * A small looping live preview of one shader preset — lets you see what you're
 * picking before committing, since a plain <select> can't render a thumbnail.
 * Cheap on purpose: one instance at a time (whichever preset is selected),
 * low resolution, autoplaying on loop.
 */
export default function ShaderPreview({ preset }: { preset: ShaderPreset }) {
  const playerRef = useRef<PlayerRef>(null);
  // Referentially stable, or the Player resets to frame 0 on every re-render
  // of the Properties panel and the preview never advances.
  const inputProps = useMemo(() => ({ preset }), [preset]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    p.play();
  }, [preset]);

  return (
    <div
      className="rounded-studio-md overflow-hidden border border-studio-border"
      style={{ width: '100%', aspectRatio: `${PREVIEW_W} / ${PREVIEW_H}` }}
    >
      <Player
        key={preset}
        ref={playerRef}
        component={PreviewComposition}
        inputProps={inputProps}
        durationInFrames={150}
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
