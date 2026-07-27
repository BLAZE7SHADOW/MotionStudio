import type { CanvasElement, Asset } from '../../project/types';
import TextRenderer from './renderers/TextRenderer';
import ImageRenderer from './renderers/ImageRenderer';
import VideoRenderer from './renderers/VideoRenderer';
import AudioRenderer from './renderers/AudioRenderer';
import ShaderRenderer from './renderers/ShaderRenderer';
import BlockRenderer from './renderers/BlockRenderer';

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
    // A blank url means the asset couldn't be resolved (see rehydrateAssets).
    // Rendering nothing is deliberate: handing a dead src to the media decoder
    // makes it retry the failed fetch forever and hang the whole composition.
    case 'image': {
      const asset = assets.find((a) => a.id === el.assetId);
      return asset?.url ? <ImageRenderer el={el} url={asset.url} /> : null;
    }
    case 'video': {
      const asset = assets.find((a) => a.id === el.assetId);
      return asset?.url ? <VideoRenderer el={el} url={asset.url} /> : null;
    }
    case 'audio': {
      const asset = assets.find((a) => a.id === el.assetId);
      return asset?.url ? <AudioRenderer el={el} url={asset.url} /> : null;
    }
    case 'shader':
      return <ShaderRenderer el={el} />;
    case 'block':
      return <BlockRenderer el={el} />;
    default:
      return null;
  }
}
