import { useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import { Play } from 'lucide-react';
import MotionComposition from '@/engines/rendering/components/MotionComposition';
import { getCompositionDimensions } from '@/engines/project';
import type { TemplateDefinition } from '@/content/templates';
import { instantiateTemplate, templateDurationInFrames } from '@/content/templates';

/**
 * Click to play a template. Nothing loads until asked for.
 *
 * Mount with `key={template.id}` so switching templates resets it.
 */
export default function TemplatePreview({ template }: { template: TemplateDefinition }) {
  const [playing, setPlaying] = useState(false);
  const { width, height } = getCompositionDimensions(template.aspectRatio);

  const inputProps = useMemo(
    () => ({ elements: instantiateTemplate(template), assets: [] }),
    [template],
  );

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="group w-full h-full flex flex-col items-center justify-center gap-2 bg-studio-surface/40 hover:bg-studio-surface/60 transition-colors"
      >
        <span className="w-10 h-10 rounded-full bg-studio-accent flex items-center justify-center group-hover:scale-105 transition-transform">
          <Play className="w-4 h-4 text-white translate-x-px" fill="currentColor" />
        </span>
        <span className="text-[11px] text-studio-text-muted">Play preview</span>
      </button>
    );
  }

  return (
    <Player
      component={MotionComposition}
      inputProps={inputProps}
      durationInFrames={templateDurationInFrames(template)}
      fps={template.fps}
      compositionWidth={width}
      compositionHeight={height}
      style={{ width: '100%', height: '100%' }}
      controls={false}
      loop
      autoPlay
      clickToPlay={false}
      doubleClickToFullscreen={false}
      allowFullscreen={false}
    />
  );
}
