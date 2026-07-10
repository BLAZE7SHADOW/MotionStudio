import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { getCompositionDimensions } from '../project/dimensions';
import type { Project } from '../project/types';
import { drawFrame } from './canvasFrame';
import type { DrawSources } from './canvasFrame';

/**
 * Frame-perfect client-side export (WebCodecs + mp4-muxer).
 *
 * Unlike a real-time recording, this renders OFFLINE: every frame is computed
 * deterministically (frame 0, 1, 2, …), videos are seeked to the exact source
 * time, and each frame is handed to the browser's hardware VideoEncoder. No
 * dropped frames, no real-time constraint — quality is limited only by the
 * bitrate you choose. Output is a standard MP4 (H.264).
 */

export interface ExportOptions {
  /** output size relative to composition (1 = full, 0.5 = half) */
  resolutionScale: number;
  /** encoder budget — higher = better quality, larger file */
  videoBitsPerSecond: number;
  onProgress?: (frame: number, totalFrames: number) => void;
}

export interface ExportResult {
  blob: Blob;
  extension: 'mp4';
}

/** WebCodecs availability (Chrome / Edge / recent Safari) */
export function isExportSupported(): boolean {
  return typeof VideoEncoder !== 'undefined';
}

const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** H.264 codec strings, best profile first; pick the first the browser accepts */
const AVC_CANDIDATES = ['avc1.640028', 'avc1.4d0028', 'avc1.42E01E'];

async function pickCodec(width: number, height: number, bitrate: number, fps: number) {
  for (const codec of AVC_CANDIDATES) {
    const { supported } = await VideoEncoder.isConfigSupported({
      codec, width, height, bitrate, framerate: fps,
    });
    if (supported) return codec;
  }
  throw new Error('No supported H.264 encoder configuration found');
}

/** load every asset the composition uses into drawable elements */
async function prepareSources(project: Project): Promise<DrawSources> {
  const images = new Map<string, HTMLImageElement>();
  const videos = new Map<string, HTMLVideoElement>();

  const usedIds = new Set(
    project.canvas.elements
      .filter((el) => el.type === 'image' || el.type === 'video')
      .map((el) => (el as { assetId: string }).assetId),
  );

  await Promise.all(
    project.assets
      .filter((a) => usedIds.has(a.id))
      .map(async (asset) => {
        if (asset.type === 'image') {
          const img = new Image();
          img.src = asset.url;
          await new Promise((r) => { img.onload = r; img.onerror = r; });
          images.set(asset.id, img);
        } else if (asset.type === 'video') {
          const v = document.createElement('video');
          v.src = asset.url;
          v.muted = true;
          v.playsInline = true;
          v.preload = 'auto';
          await new Promise((r) => { v.onloadeddata = r; v.onerror = r; });
          videos.set(asset.id, v);
        }
      }),
  );

  return { images, videos };
}

/** seek a video to an exact time and wait until the frame is actually decoded */
function seekTo(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(v.currentTime - t) < 1 / 240) return resolve();
    const done = () => { v.removeEventListener('seeked', done); resolve(); };
    v.addEventListener('seeked', done);
    v.currentTime = t;
    setTimeout(done, 500); // safety: never hang on a bad seek
  });
}

/** seek every active source video to the exact frame time (frame-accurate) */
async function syncVideosExact(sources: DrawSources, project: Project, frame: number) {
  for (const el of project.canvas.elements) {
    if (el.type !== 'video') continue;
    const v = sources.videos.get(el.assetId);
    if (!v) continue;
    const active = frame >= el.startFrame && frame < el.startFrame + el.durationInFrames;
    if (active) await seekTo(v, (frame - el.startFrame) / project.fps);
  }
}

export async function exportComposition(
  project: Project,
  opts: ExportOptions,
): Promise<ExportResult> {
  if (!isExportSupported()) {
    throw new Error('This browser does not support WebCodecs — use Chrome or Edge.');
  }

  const { width: compW, height: compH } = getCompositionDimensions(project.aspectRatio);
  // even dimensions required by H.264
  const width  = Math.round((compW * opts.resolutionScale) / 2) * 2;
  const height = Math.round((compH * opts.resolutionScale) / 2) * 2;
  const fps = project.fps;
  const totalFrames = project.durationInFrames;
  const scale = width / compW;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');

  // fonts + media must be ready before the first frame is drawn
  await document.fonts.ready;
  const sources = await prepareSources(project);

  const codec = await pickCodec(width, height, opts.videoBitsPerSecond, fps);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height },
    fastStart: 'in-memory',
  });

  let encodeError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encodeError = e as Error; },
  });
  encoder.configure({
    codec,
    width,
    height,
    bitrate: opts.videoBitsPerSecond,
    framerate: fps,
  });

  const microsPerFrame = 1_000_000 / fps;
  const keyframeEvery = fps * 2; // a keyframe every 2 seconds

  for (let frame = 0; frame < totalFrames; frame++) {
    if (encodeError) throw encodeError;

    await syncVideosExact(sources, project, frame);
    drawFrame(ctx, project.canvas.elements, frame, fps, scale, sources, width, height);

    const videoFrame = new VideoFrame(canvas, {
      timestamp: Math.round(frame * microsPerFrame),
      duration: Math.round(microsPerFrame),
    });
    encoder.encode(videoFrame, { keyFrame: frame % keyframeEvery === 0 });
    videoFrame.close();

    // backpressure: don't let the encode queue run away
    while (encoder.encodeQueueSize > 4) await sleep(0);
    // let the progress UI paint
    if (frame % 15 === 0) await sleep(0);

    opts.onProgress?.(frame + 1, totalFrames);
  }

  await encoder.flush();
  muxer.finalize();
  sources.videos.forEach((v) => v.pause());

  const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
  return { blob, extension: 'mp4' };
}

/** trigger a browser download for the finished file */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
