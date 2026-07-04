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

  // build the list of frames that get a tick: 0, interval, 2·interval, …
  const ticks: number[] = [];
  if (interval > 0) {
    for (let f = 0; f <= scale.totalFrames; f += interval) {
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
