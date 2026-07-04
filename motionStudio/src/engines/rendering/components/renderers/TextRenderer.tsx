import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { TextElement } from '../../../project/types';
import { textElementStyle } from '../../style';

/**
 * Pure presentational renderer for a text element.
 * Inside a <Sequence>, useCurrentFrame() is already clip-local (0 at the
 * clip's start) — exactly the frame our animation evaluator expects.
 */
export default function TextRenderer({ el }: { el: TextElement }) {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={textElementStyle(el, 1, { localFrame, fps })}>{el.content}</div>
  );
}
