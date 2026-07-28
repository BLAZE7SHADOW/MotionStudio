import { frameToX, chooseTickIntervalFrames, formatFrameLabel } from '@/engines/timeline';
import type { TimelineScale } from '@/engines/timeline';
import { BEATS_PER_BAR, beatIndexAt, beatTimeSec } from '@/engines/project';
import type { BeatGrid } from '@/engines/project';

interface TimelineRulerProps {
  scale: TimelineScale;
  fps: number;
  height: number;
  grid?: BeatGrid;
}

/** Minimum pixels between beat ticks before they stop being information. */
const MIN_BEAT_PX = 5;

/**
 * The beats visible in the window, in absolute frames.
 *
 * Walked in **beat indices over seconds**, not by stepping a frame interval —
 * a beat is 14.06 frames at 128 BPM/30fps, so stepping by a rounded interval
 * would drift a whole frame every few bars and the grid would slide away from
 * the music it is supposed to describe. Frames appear once, at the end.
 */
function beatTicks(grid: BeatGrid, scale: TimelineScale, fps: number) {
  const out: { frame: number; bar: boolean }[] = [];
  if (!grid.enabled || grid.bpm <= 0) return out;

  const startSec = scale.originFrame / fps;
  const endSec = (scale.originFrame + scale.totalFrames) / fps;
  const spacingPx = (60 / grid.bpm) * fps * scale.pxPerFrame;
  if (spacingPx < MIN_BEAT_PX) return out;

  // Only draw bars once beats themselves would crowd — the grid should stay
  // legible as the window widens rather than turning into a grey block.
  const everyBar = spacingPx < MIN_BEAT_PX * 3;

  for (let n = Math.max(0, beatIndexAt(grid, startSec)); ; n++) {
    const sec = beatTimeSec(grid, n);
    if (sec > endSec) break;
    if (sec < startSec) continue;
    const bar = n % BEATS_PER_BAR === 0;
    if (everyBar && !bar) continue;
    out.push({ frame: sec * fps, bar });
  }
  return out;
}

/**
 * The time ruler. Reads the coordinate system (scale) and draws a labelled
 * tick at each interval. Purely derived — it owns no state, it just renders
 * whatever the scale tells it to.
 */
export default function TimelineRuler({ scale, fps, height, grid }: TimelineRulerProps) {
  const interval = chooseTickIntervalFrames(scale, fps);

  /* Ticks are placed on absolute frames that are whole multiples of the
     interval, not on offsets from the window's left edge — so a shot starting
     at 3.5s still labels 4s, 5s, 6s rather than 3.5s, 4.5s. Labels stay
     absolute too: knowing where you are in the whole video is the point. */
  const ticks: number[] = [];
  if (interval > 0) {
    const end = scale.originFrame + scale.totalFrames;
    const first = Math.ceil(scale.originFrame / interval) * interval;
    for (let f = first; f <= end; f += interval) {
      ticks.push(f);
    }
  }

  return (
    <div
      className="relative border-b border-studio-border bg-studio-panel select-none"
      style={{ width: scale.trackWidth, height }}
    >
      {/* Beats sit behind the time ticks: they are context for placing things,
          not the thing you read the ruler for. Bars are brighter than beats,
          which is what makes a four-count legible at a glance. */}
      {grid && beatTicks(grid, scale, fps).map(({ frame, bar }) => (
        <div
          key={`b${frame}`}
          className={[
            'absolute bottom-0 w-px pointer-events-none',
            bar ? 'h-3 bg-studio-accent/55' : 'h-1.5 bg-studio-accent/25',
          ].join(' ')}
          style={{ left: frameToX(scale, frame) }}
        />
      ))}

      {ticks.map((frame) => {
        const x = frameToX(scale, frame);
        return (
          <div
            key={frame}
            className="absolute top-0 bottom-0"
            style={{ left: x }}
          >
            {/* tick mark */}
            <div className="absolute bottom-0 left-0 w-px h-2 bg-studio-border-strong" />
            {/* label — nudged right so it doesn't sit on the tick line */}
            <span className="absolute bottom-2.5 left-1 text-[10px] font-mono text-studio-text-faint whitespace-nowrap">
              {formatFrameLabel(frame, fps)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
