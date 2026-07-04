/**
 * Timeline coordinate system — the single source of truth for converting
 * between FRAME space (the data: startFrame, durationInFrames) and PIXEL
 * space (where things are drawn on screen).
 *
 * This is the timeline's version of the canvas `scale` factor. On the canvas
 * we mapped composition-pixels ↔ screen-pixels. Here we map frames ↔ pixels.
 * Same idea, different axis (time instead of space).
 */

export interface TimelineScale {
  /** total drawable width of the track area, in pixels */
  trackWidth: number;
  /** total length of the composition, in frames */
  totalFrames: number;
  /** how many screen pixels one frame occupies */
  pxPerFrame: number;
}

/** Build a scale from the measured track width and the composition length. */
export function createScale(trackWidth: number, totalFrames: number): TimelineScale {
  // guard against divide-by-zero before the composition/DOM is ready
  const pxPerFrame = totalFrames > 0 ? trackWidth / totalFrames : 0;
  return { trackWidth, totalFrames, pxPerFrame };
}

/** frame → x pixel (left edge). */
export function frameToX(scale: TimelineScale, frame: number): number {
  return frame * scale.pxPerFrame;
}

/** x pixel → frame, clamped to a valid frame in the composition. */
export function xToFrame(scale: TimelineScale, x: number): number {
  if (scale.pxPerFrame === 0) return 0;
  const frame = Math.round(x / scale.pxPerFrame);
  return Math.min(scale.totalFrames, Math.max(0, frame));
}

/** a duration in frames → a width in pixels (for drawing a clip bar). */
export function framesToWidth(scale: TimelineScale, frames: number): number {
  return frames * scale.pxPerFrame;
}

/* ── ruler tick spacing ───────────────────────────────────────────────── */

/** aim for roughly one labelled tick per this many pixels */
const TICK_TARGET_PX = 80;

/** candidate tick spacings, in SECONDS, from fine to coarse */
const TICK_SECONDS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];

/**
 * Choose a tick interval (in frames) so labels are readable — never so dense
 * they overlap, never so sparse the ruler is empty. Picks the smallest
 * spacing whose on-screen width clears TICK_TARGET_PX.
 */
export function chooseTickIntervalFrames(scale: TimelineScale, fps: number): number {
  for (const seconds of TICK_SECONDS) {
    if (framesToWidth(scale, seconds * fps) >= TICK_TARGET_PX) {
      return seconds * fps;
    }
  }
  return TICK_SECONDS[TICK_SECONDS.length - 1] * fps;
}

/** format a frame as a timecode label, e.g. 90 @ 30fps → "3s", 3630 → "2:01". */
export function formatFrameLabel(frame: number, fps: number): string {
  const totalSeconds = Math.round(frame / fps);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
