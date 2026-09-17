import { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource } from 'mediabunny';
import { getCompositionDimensions } from '../project/dimensions';
import type { Project } from '../project/types';
import { drawFrame } from './canvasFrame';
import type { DrawSources } from './canvasFrame';
import { mixAudioTrack } from './audioMix';

/**
 * Frame-perfect client-side export (WebCodecs via Mediabunny).
 *
 * Renders OFFLINE: every frame is computed deterministically, source videos
 * are seeked to the exact time, and frames are handed to the browser's
 * hardware encoder. Audio is mixed sample-exact offline (see audioMix.ts) and
 * encoded into the same MP4. No dropped frames, no real-time constraint.
 *
 * Mediabunny (successor of mp4-muxer, and the muxer used by Remotion's own
 * web-renderer) owns the encoder configuration, muxing and backpressure —
 * `source.add()` resolves only when the encoder is ready for more.
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
  hasAudio: boolean;
}

/** WebCodecs availability (Chrome / Edge / recent Safari) */
export function isExportSupported(): boolean {
  return typeof VideoEncoder !== 'undefined';
}

const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** prefer AAC (plays everywhere in MP4), fall back to Opus */
async function pickAudioCodec(sampleRate: number): Promise<'aac' | 'opus' | null> {
  if (typeof AudioEncoder === 'undefined') return null;
  const base = { sampleRate, numberOfChannels: 2, bitrate: 192_000 };
  const aac = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', ...base }).catch(() => null);
  if (aac?.supported) return 'aac';
  const opus = await AudioEncoder.isConfigSupported({ codec: 'opus', ...base }).catch(() => null);
  if (opus?.supported) return 'opus';
  return null;
}

/** load every asset the composition actually uses into drawable elements */
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
        // crossOrigin MUST be set before src, or the browser has already
        // started a non-CORS fetch. Without it a remote (S3) asset taints the
        // export canvas and encoding fails with a SecurityError — and it also
        // poisons the cache for any later CORS request for the same file.
        const remote = asset.url.startsWith('http');

        if (asset.type === 'image') {
          const img = new Image();
          if (remote) img.crossOrigin = 'anonymous';
          img.src = asset.url;
          await new Promise((r) => { img.onload = r; img.onerror = r; });
          images.set(asset.id, img);
        } else if (asset.type === 'video') {
          const v = document.createElement('video');
          if (remote) v.crossOrigin = 'anonymous';
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
  // Chrome defaults imageSmoothingQuality to 'low' — every cover-fit crop and
  // any non-1:1 scale (drawMedia in canvasFrame.ts) visibly softens without this.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // fonts, media and the audio mix must be ready before encoding starts
  await document.fonts.ready;
  const sources = await prepareSources(project);
  const audioBuffer = await mixAudioTrack(project);
  const audioCodec = audioBuffer ? await pickAudioCodec(audioBuffer.sampleRate) : null;

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });

  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: opts.videoBitsPerSecond,
  });
  output.addVideoTrack(videoSource, { frameRate: fps });

  let audioSource: AudioBufferSource | null = null;
  if (audioBuffer && audioCodec) {
    try {
      audioSource = new AudioBufferSource({ codec: audioCodec, bitrate: 192_000 });
      output.addAudioTrack(audioSource);
    } catch {
      audioSource = null; // audio track unsupported — export video-only rather than fail
    }
  }

  await output.start();

  const frameDur = 1 / fps;
  for (let frame = 0; frame < totalFrames; frame++) {
    await syncVideosExact(sources, project, frame);
    drawFrame(ctx, project.canvas.elements, frame, fps, scale, sources, width, height);

    // awaiting add() IS the backpressure: it resolves when the encoder is ready
    await videoSource.add(frame * frameDur, frameDur, {
      keyFrame: frame % (fps * 2) === 0, // a keyframe every 2 seconds
    });

    if (frame % 15 === 0) await sleep(0); // let the progress UI paint
    opts.onProgress?.(frame + 1, totalFrames);
  }
  videoSource.close();

  if (audioSource && audioBuffer) {
    await audioSource.add(audioBuffer); // the whole mixed track, from t = 0
    audioSource.close();
  }

  await output.finalize();
  sources.videos.forEach((v) => v.pause());

  const buffer = output.target.buffer;
  if (!buffer) throw new Error('Export produced no data');

  return {
    blob: new Blob([buffer], { type: 'video/mp4' }),
    extension: 'mp4',
    hasAudio: audioSource !== null,
  };
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

/**
 * The same, for a file that already lives somewhere — the cloud render's S3
 * output rather than a blob built in this tab.
 *
 * `download` is **ignored on cross-origin URLs**, so it does not name this file:
 * the name and the save-instead-of-navigate behaviour both come from the
 * `Content-Disposition` header, which `api/render.ts` asks Lambda to set via
 * `downloadBehavior`. It is set anyway because it costs nothing and is the only
 * hint in this file that the filename is decided elsewhere — without it the next
 * person edits this string and wonders why the saved file is unchanged.
 *
 * The anchor is appended to the document before clicking: a detached one is
 * enough in Chrome but not in every browser, and this runs at the end of a
 * minutes-long render where a silent no-op is expensive.
 *
 * `target="_blank"` is the safety belt, and it is not cosmetic. If the header
 * is ever missing the browser *navigates* to the file instead of saving it —
 * found by accident testing against an uploaded asset, which carries no
 * `Content-Disposition`: the tab left the editor and loaded the video. Since
 * this fires automatically, with no click to blame, that would throw someone
 * out of their project unprompted. With `_blank` the same failure opens a tab
 * they can close, and their work is untouched. On the normal path no tab opens
 * at all, because the click resolves to a download.
 */
export function downloadFromUrl(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
