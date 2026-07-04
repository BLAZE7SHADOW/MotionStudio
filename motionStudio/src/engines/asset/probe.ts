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

/** read natural size / duration from a media URL before we store the asset */
export function probeAsset(type: AssetType, url: string): Promise<ProbedMeta> {
  if (type === 'image') return probeImage(url);
  if (type === 'video') return probeVideo(url);
  return probeAudio(url);
}
