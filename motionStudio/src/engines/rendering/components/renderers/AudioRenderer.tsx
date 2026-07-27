import { Audio } from '@remotion/media';
import type { AudioElement } from '../../../project/types';

/**
 * Renders an audio element — no visual output, just sound. Inside its
 * <Sequence>, Remotion plays the audio for the clip's frame range.
 *
 * From @remotion/media, not `remotion`: the client-side web renderer rejects
 * the older Html5Audio path, and this one decodes through Mediabunny in every
 * environment — browser export, Lambda and CLI alike.
 */
export default function AudioRenderer({ el, url }: { el: AudioElement; url: string }) {
  return <Audio src={url} volume={el.volume ?? 1} />;
}
