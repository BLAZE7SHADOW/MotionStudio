import { frameToX, chooseTickIntervalFrames, formatFrameLabel } from '@/engines/timeline';
import type { TimelineScale } from '@/engines/timeline';

interface TimelineRulerProps {
  scale: TimelineScale;
  fps: number;
  height: number;
}

/**
 * The time ruler. Reads the coordinate system (scale) and draws a labelled
 * tick at each interval. Purely derived — it owns no state, it just renders
 * whatever the scale tells it to.
 */
export default function TimelineRuler({ scale, fps, height }: TimelineRulerProps) {
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
