import { Img, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ImageElement } from '../../../project/types';
import { imageElementStyle } from '../../style';

/**
 * Renders an image element. Remotion's <Img> guarantees the image is loaded
 * before the frame is drawn — essential for a correct export.
 */
export default function ImageRenderer({ el, url }: { el: ImageElement; url: string }) {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={imageElementStyle(el, 1, { localFrame, fps })}>
      <Img
        src={url}
        style={{ width: '100%', height: '100%', objectFit: el.objectFit ?? 'cover' }}
      />
    </div>
  );
}
