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

  return (
    <Player
      component={MotionComposition}
      inputProps={{ elements, assets: [] }}
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
