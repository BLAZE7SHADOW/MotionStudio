import { evaluateAnimations } from '../animation';
import type { CanvasElement, TextElement } from '../project/types';

/**
 * Client-side frame renderer. Draws one frame of the composition onto a 2D
 * canvas — the browser-export twin of the DOM/Remotion renderers. It reuses the
 * SAME animation evaluator and the same composition-space model, so the output
 * matches the editor: identical math, different drawing API.
 */

export interface DrawSources {
  images: Map<string, HTMLImageElement>;
  videos: Map<string, HTMLVideoElement>;
}

/** greedy word-wrap that mirrors the DOM's pre-wrap/word-break behaviour */
function drawText(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
  scale: number,
  maxWidth: number,
) {
  const fontSize = el.fontSize * scale;
  ctx.font = `${fontSize}px ${el.fontFamily}`;
  ctx.fillStyle = el.color;
  ctx.textBaseline = 'top';
  const lineH = fontSize * 1.2; // matches lineHeight: 1.2 in style.ts

  let y = 0;
  for (const para of el.content.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) { y += lineH; continue; }
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        ctx.fillText(line, 0, y);
        y += lineH;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) { ctx.fillText(line, 0, y); y += lineH; }
  }
}

/** drawImage with objectFit semantics (cover crops the source, contain letterboxes) */
function drawMedia(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement,
  w: number,
  h: number,
  fit: 'cover' | 'contain' = 'cover',
) {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
  if (!sw || !sh) return;

  if (fit === 'contain') {
    const k = Math.min(w / sw, h / sh);
    const dw = sw * k, dh = sh * k;
    ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else {
    const k = Math.max(w / sw, h / sh);
    const cw = w / k, ch = h / k;                 // crop rect in source pixels
    ctx.drawImage(source, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, w, h);
  }
}

/** draw one full frame: background + every visible element, back → front */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  frame: number,
  fps: number,
  scale: number,          // output-canvas scale relative to composition space
  sources: DrawSources,
  width: number,
  height: number,
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const visible = elements
    .filter((el) => frame >= el.startFrame && frame < el.startFrame + el.durationInFrames)
    .sort((a, b) => a.zIndex - b.zIndex); // canvas paints in call order → sort back-to-front

  for (const el of visible) {
    if (el.type === 'audio') continue; // no visual

    const local = frame - el.startFrame;
    const t = evaluateAnimations(el.animations, local, fps);

    const w = el.width * scale;
    const h = el.height * scale;
    // base pose + animated offsets, mirroring elementBoxStyle()
    const cx = (el.x + t.tx) * scale + w / 2;
    const cy = (el.y + t.ty) * scale + h / 2;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity * t.opacity));
    ctx.translate(cx, cy);
    ctx.rotate(((el.rotation + t.rotate) * Math.PI) / 180);
    ctx.scale(t.scale, t.scale);
    ctx.translate(-w / 2, -h / 2); // element-local space, origin at its top-left

    if (el.type === 'text') {
      drawText(ctx, el, scale, w);
    } else if (el.type === 'image') {
      const img = sources.images.get(el.assetId);
      if (img) drawMedia(ctx, img, w, h, el.objectFit ?? 'cover');
    } else if (el.type === 'video') {
      const vid = sources.videos.get(el.assetId);
      if (vid) drawMedia(ctx, vid, w, h, el.objectFit ?? 'cover');
    }

    ctx.restore();
  }
}
