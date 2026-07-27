import { useMemo } from 'react';
import { Player } from '@remotion/player';
import MotionComposition from '@/engines/rendering/components/MotionComposition';
import { getCompositionDimensions } from '@/engines/project';
import type { TemplateDefinition } from '@/content/templates';
import { instantiateTemplate, templateDurationInFrames } from '@/content/templates';

/**
 * A small looping live preview of one template — same approach as
 * TextEffectPreview/ShaderPreview, but rendering the real MotionComposition
 * so the card shows exactly what the project will contain, not a mock-up.
 */
export default function TemplatePreview({ template }: { template: TemplateDefinition }) {
  const { width, height } = getCompositionDimensions(template.aspectRatio);

  // Ids are minted per instantiation, so memoise — otherwise every render
  // makes new element ids and remounts the whole preview tree.
  const elements = useMemo(() => instantiateTemplate(template), [template]);

  // inputProps must be memoised too. Built inline it's a fresh object on every
  // render, and Player reads an identity change as new data and snaps back to
  // frame 0 — so the preview sits frozen instead of playing. Same trap as
  // CanvasPanel's inputProps and PRESET_PREVIEW_ANIMATIONS.
  const inputProps = useMemo(() => ({ elements, assets: [] }), [elements]);

  const duration = templateDurationInFrames(template);

  return (
    <Player
      component={MotionComposition}
      inputProps={inputProps}
      durationInFrames={duration}
      // Never start at frame 0. Every template opens with an entrance effect,
      // and those begin at opacity 0 — so frame 0 is a genuinely blank frame,
      // which reads as a broken preview. Starting part-way in shows real
      // content immediately; the loop still comes back around to the entrance.
      initialFrame={Math.round(duration * 0.35)}
      fps={template.fps}
      compositionWidth={width}
      compositionHeight={height}
      style={{ width: '100%', height: '100%' }}
      // A preview is a real composition: it lazy-loads a shader chunk, builds a
      // WebGL context and renders at full composition resolution before it can
      // show anything. That takes a moment, and an empty box while it happens
      // reads as broken — so say it's loading instead of showing nothing.
      renderLoading={() => (
        <div className="w-full h-full flex items-center justify-center bg-studio-surface/40">
          <span className="text-[11px] text-studio-text-faint animate-pulse">Loading preview…</span>
        </div>
      )}
      controls={false}
      loop
      autoPlay
      clickToPlay={false}
      doubleClickToFullscreen={false}
      allowFullscreen={false}
    />
  );
}
