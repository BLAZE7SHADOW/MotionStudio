import type { TextElement } from '../../../project/types';
import { textElementStyle } from '../../style';

/**
 * Pure presentational renderer for a text element.
 * Used by the Remotion composition and (via the shared style) by the editor.
 */
export default function TextRenderer({ el }: { el: TextElement }) {
  return <div style={textElementStyle(el)}>{el.content}</div>;
}
