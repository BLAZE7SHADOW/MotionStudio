import { AbsoluteFill, Sequence } from 'remotion';
import type { CanvasElement } from '../../project/types';
import ElementRenderer from './ElementRenderer';

export interface MotionCompositionProps {
  elements: CanvasElement[];
  background?: string;
}

/**
 * The Remotion composition root.
 *
 * Consumed by the editor's <Player> preview and, later, by renderMedia()
 * for export. It is a pure function of element data → frames, so the same
 * component drives preview and final render.
 */
export default function MotionComposition({
  elements,
  background = '#000000',
}: MotionCompositionProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      {elements.map((el) => (
        <Sequence
          key={el.id}
          from={el.startFrame}
          durationInFrames={el.durationInFrames}
          layout="none"
        >
          <ElementRenderer el={el} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
