import { Audio } from 'remotion';
import type { AudioElement } from '../../../project/types';

/**
 * Renders an audio element — no visual output, just sound. Inside its
 * <Sequence>, Remotion plays the audio for the clip's frame range.
 */
export default function AudioRenderer({ el, url }: { el: AudioElement; url: string }) {
  return <Audio src={url} volume={el.volume ?? 1} />;
}
