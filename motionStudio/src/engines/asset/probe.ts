import type { AssetType } from '../project/types';

export interface ProbedMeta {
  width?: number;
  height?: number;
  durationInSeconds?: number;
}

/** map a File's MIME type to our asset type, or null if unsupported */
export function assetTypeFromFile(file: File): AssetType | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

function probeImage(url: string): Promise<ProbedMeta> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({});
    img.src = url;
  });
}

function probeVideo(url: string): Promise<ProbedMeta> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () =>
      resolve({ width: v.videoWidth, height: v.videoHeight, durationInSeconds: v.duration });
    v.onerror = () => resolve({});
    v.src = url;
  });
}

function probeAudio(url: string): Promise<ProbedMeta> {
  return new Promise((resolve) => {
    const a = document.createElement('audio');
    a.preload = 'metadata';
    a.onloadedmetadata = () => resolve({ durationInSeconds: a.duration });
    a.onerror = () => resolve({});
    a.src = url;
  });
}

/**
 * How long to wait for metadata before giving up on it.
 *
 * Every probe above resolves on success *or* error — which looks exhaustive
 * and isn't. A media element can reach `stalled` with `readyState: 0` and fire
 * neither, and then the promise never settles at all. Because `uploadFiles`
 * awaits each probe in turn, one such file froze every upload permanently: no
 * error, no console message, the file simply never appeared in the library.
 *
 * Observed with a perfectly valid WAV that Web Audio decoded without complaint,
 * so "the file is broken" is not a safe assumption to hang on.
 */
const PROBE_TIMEOUT_MS = 5000;

/**
 * Metadata is an optimisation, not a requirement: it seeds an element's initial
 * size and clip length, and both have sane fallbacks. Timing out and adding the
 * asset anyway is strictly better than waiting forever for a nicety.
 */
function withTimeout(probe: Promise<ProbedMeta>): Promise<ProbedMeta> {
  return Promise.race([
    probe,
    new Promise<ProbedMeta>((resolve) => setTimeout(() => resolve({}), PROBE_TIMEOUT_MS)),
  ]);
}

/** read natural size / duration from a media URL before we store the asset */
export function probeAsset(type: AssetType, url: string): Promise<ProbedMeta> {
  if (type === 'image') return withTimeout(probeImage(url));
  if (type === 'video') return withTimeout(probeVideo(url));
  return withTimeout(probeAudio(url));
}
