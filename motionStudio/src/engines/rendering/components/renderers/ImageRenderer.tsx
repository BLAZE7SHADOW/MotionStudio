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
        // Remote assets must be fetched as CORS requests EVERY time. S3 only
        // returns Access-Control-Allow-Origin when an Origin header is sent,
        // and its non-CORS response carries no `Vary`, so one plain <img> load
        // poisons the browser cache: the renderer's later CORS request reuses
        // that ACAO-less response and fails. Being consistent avoids that, and
        // is also what keeps the export canvas untainted.
        crossOrigin={url.startsWith('http') ? 'anonymous' : undefined}
        // `object-fit` via style is fine for <Img> (the web renderer supports
        // that property); only <Video> requires it as an explicit prop.
        style={{ width: '100%', height: '100%', objectFit: el.objectFit ?? 'cover' }}
      />
    </div>
  );
}

  // Why <Img> and not <img>? Remotion's <Img> pauses rendering until the image is fully loaded. A plain <img> might not be decoded
  // yet when Remotion tries to capture that frame — you'd get a blank or half-loaded image in your export. <Img> = frame-safe.

  // The two-div structure: outer <div> owns position/size/animation (from imageElementStyle). Inner <Img> fills that box with
  // objectFit. Clean separation.
