import { useMemo, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { Play } from 'lucide-react';
import MotionComposition from '@/engines/rendering/components/MotionComposition';
import { getCompositionDimensions } from '@/engines/project';
import type { TemplateDefinition } from '@/content/templates';
import { instantiateTemplate, templateDurationInFrames } from '@/content/templates';

const ASPECT: Record<string, string> = {
  '16:9': '16 / 9',
  '9:16': '9 / 16',
  '1:1': '1 / 1',
};

/**
 * A still of the template, with a Play button underneath.
 *
 * Mount with `key={template.id}` so switching templates resets it.
 */
export default function TemplatePreview({ template }: { template: TemplateDefinition }) {
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<PlayerRef>(null);
  const { width, height } = getCompositionDimensions(template.aspectRatio);
  const duration = templateDurationInFrames(template);

  const inputProps = useMemo(
    () => ({ elements: instantiateTemplate(template), assets: [] }),
    [template],
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-full max-h-64 mx-auto rounded-studio-md overflow-hidden border border-studio-border bg-studio-bg"
        style={{ aspectRatio: ASPECT[template.aspectRatio] }}
      >
        <Player
          ref={playerRef}
          component={MotionComposition}
          inputProps={inputProps}
          durationInFrames={duration}
          // Not frame 0 — entrance effects start at opacity 0, so a paused
          // player parked there shows an empty frame.
          initialFrame={Math.round(duration * 0.4)}
          fps={template.fps}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: '100%', height: '100%' }}
          // Remotion's own transport, so playback never depends on autoPlay
          // having worked.
          controls
          loop
          clickToPlay
          doubleClickToFullscreen={false}
          allowFullscreen={false}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          const p = playerRef.current;
          if (!p) return;
          if (playing) {
            p.pause();
          } else {
            p.seekTo(0);
            p.play();
          }
          setPlaying(!playing);
        }}
        className="self-start inline-flex items-center gap-1.5 h-7 px-3 rounded-studio-md bg-studio-surface border border-studio-border text-[11px] font-medium text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong transition-colors"
      >
        <Play className="w-3 h-3" fill="currentColor" />
        {playing ? 'Restart' : 'Play preview'}
      </button>
    </div>
  );
}
