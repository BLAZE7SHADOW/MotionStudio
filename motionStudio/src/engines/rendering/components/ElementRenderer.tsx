import type { CanvasElement } from '../../project/types';
import TextRenderer from './renderers/TextRenderer';

/**
 * Dispatches an element to its type-specific renderer.
 * Add a case here when a new element type is introduced (image, shape, video…).
 */
export default function ElementRenderer({ el }: { el: CanvasElement }) {
  switch (el.type) {
    case 'text':
      return <TextRenderer el={el} />;
    default:
      return null;
  }
}
