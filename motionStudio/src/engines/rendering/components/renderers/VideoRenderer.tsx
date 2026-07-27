import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import type { VideoElement } from '../../../project/types';
import { imageElementStyle } from '../../style';

/**
 * Renders a video element.
 *
 * Uses <Video> from @remotion/media rather than <OffthreadVideo>: it decodes
 * with Mediabunny and draws the exact frame to a canvas, which works in BOTH
 * the browser (the client-side web renderer refuses <OffthreadVideo> outright)
 * and server-side on Lambda/CLI, where it falls back to <OffthreadVideo> if a
 * file can't be decoded. One component for every path — the same reason
 * style.ts is shared rather than duplicated per renderer.
 */
export default function VideoRenderer({ el, url }: { el: VideoElement; url: string }) {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={imageElementStyle(el, 1, { localFrame, fps })}>
      <Video
        src={url}
        style={{ width: '100%', height: '100%', objectFit: el.objectFit ?? 'cover' }}
      />
    </div>
  );
}


  // Why <OffthreadVideo> and not <video>? This is one of the most important Remotion decisions. A DOM <video> plays in real time.
  // During a render, Remotion captures frames faster than real time — the video element can't keep up and you'd get the wrong
  // frame. <OffthreadVideo> uses a Rust binary running in a separate thread to extract the exact frame at the composition's
  // current time. Frame-perfect.

  // The tradeoff: <OffthreadVideo> only works in Node (CLI render). In the browser editor, we swap to a plain <video> that we
  // manually seek. That's why the export (CLI path) uses this renderer but our in-browser export uses canvasFrame.ts with manual
  // seek + drawFrame.
