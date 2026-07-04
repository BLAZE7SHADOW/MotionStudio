import type { CanvasElement, Asset } from '../../project/types';
import TextRenderer from './renderers/TextRenderer';
import ImageRenderer from './renderers/ImageRenderer';

/**
 * Dispatches an element to its type-specific renderer. Image elements resolve
 * their asset URL from the library (assetId → Asset).
 */
export default function ElementRenderer({
  el,
  assets,
}: {
  el: CanvasElement;
  assets: Asset[];
}) {
  switch (el.type) {
    case 'text':
      return <TextRenderer el={el} />;
    case 'image': {
      const asset = assets.find((a) => a.id === el.assetId);
      return asset ? <ImageRenderer el={el} url={asset.url} /> : null;
    }
    default:
      return null;
  }
}
