import { OffthreadVideo, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoElement } from '../../../project/types';
import { imageElementStyle } from '../../style';

/**
 * Renders a video element. <OffthreadVideo> extracts the exact frame that
 * matches the composition's current frame — accurate and render-safe. Inside a
 * <Sequence>, it plays from the clip's start automatically.
 */
export default function VideoRenderer({ el, url }: { el: VideoElement; url: string }) {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={imageElementStyle(el, 1, { localFrame, fps })}>
      <OffthreadVideo
        src={url}
        style={{ width: '100%', height: '100%', objectFit: el.objectFit ?? 'cover' }}
      />
    </div>
  );
}
