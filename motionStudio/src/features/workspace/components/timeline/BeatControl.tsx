import { useRef, useState } from 'react';
import { Music4 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrubInput } from '@/components/ui/scrub-input';
import { useProjectStore } from '@/engines/project';
import type { Project } from '@/engines/project';

/** Taps further apart than this start a new count rather than extending one. */
const TAP_TIMEOUT_MS = 2500;

/**
 * The beat grid control: whether the timeline knows where the beats are, and
 * what to do when it is wrong.
 *
 * It sits in the timeline header rather than in Properties because the grid
 * belongs to the timeline, not to whatever happens to be selected — you want
 * it while placing a shot, which is exactly when nothing is selected.
 *
 * **Manual entry is not a fallback here, it is a first-class answer.** Energy
 * detection is good on four-to-the-floor and poor on ambient, orchestral,
 * live-played or spoken audio, and a user who can hear the tempo should never
 * be stuck arguing with a number.
 */
export default function BeatControl({ project }: { project: Project }) {
  const updateProject = useProjectStore((s) => s.updateProject);
  const grid = project.beatGrid;

  const [open, setOpen] = useState(false);
  const taps = useRef<number[]>([]);
  const [tapCount, setTapCount] = useState(0);

  /** The best-detected track, used to offer a reset and to explain the number. */
  const analysed = project.assets.find((a) => a.type === 'audio' && (a.bpm ?? 0) > 0);
  const hasAudio = project.assets.some((a) => a.type === 'audio');

  function patch(next: Partial<NonNullable<Project['beatGrid']>>) {
    const base = grid ?? { bpm: 120, offsetSec: 0, enabled: true };
    updateProject(project.id, { beatGrid: { ...base, ...next } });
  }

  /**
   * Tap tempo from the average interval, not the last one.
   *
   * Averaging over the whole run is what makes four taps usable — a single
   * interval carries every bit of human jitter, and the reading jumps around
   * enough to look broken.
   */
  function tap() {
    const now = performance.now();
    const list = taps.current;
    if (list.length && now - list[list.length - 1] > TAP_TIMEOUT_MS) list.length = 0;
    list.push(now);
    setTapCount(list.length);
    if (list.length < 2) return;
    const span = list[list.length - 1] - list[0];
    const bpm = (60_000 * (list.length - 1)) / span;
    if (bpm >= 40 && bpm <= 300) patch({ bpm: Math.round(bpm * 10) / 10, enabled: true });
  }

  const confidence = analysed?.beatConfidence ?? 0;
  const shaky = analysed !== undefined && confidence < 0.5;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-tour="beat"
          title={grid?.enabled ? `Beat grid — ${grid.bpm} BPM` : 'Beat grid'}
          className={[
            'h-7 px-2 flex items-center gap-1.5 rounded-studio-sm text-[11px] font-medium transition-colors duration-120',
            grid?.enabled
              // Accent means live state, and a grid that is on is exactly that.
              ? 'text-studio-accent hover:bg-studio-surface'
              : 'text-studio-text-faint hover:text-studio-text hover:bg-studio-surface',
          ].join(' ')}
        >
          <Music4 className="w-3.5 h-3.5" />
          {grid?.enabled ? <span className="tabular-nums">{Math.round(grid.bpm)}</span> : 'Beat'}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-64 p-3 bg-studio-panel border-studio-border-strong rounded-studio-lg flex flex-col gap-3"
      >
        {!hasAudio ? (
          <p className="text-[11px] text-studio-text-muted leading-relaxed">
            Add a music track and MotionStudio will work out its tempo, then show
            the beats on the timeline so you can cut to them.
          </p>
        ) : (
          <>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!grid?.enabled}
                onChange={(e) => patch({ enabled: e.target.checked })}
                className="accent-studio-accent"
              />
              <span className="text-[12px] text-studio-text">Show beats on the timeline</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-studio-text-faint w-10 shrink-0">Tempo</span>
              <ScrubInput
                value={grid?.bpm ?? 120}
                onChange={(v) => patch({ bpm: Math.min(300, Math.max(40, v)), enabled: true })}
                min={40}
                max={300}
                unit=" BPM"
                aria-label="Beats per minute"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-studio-text-faint w-10 shrink-0">Offset</span>
              <ScrubInput
                value={Math.round((grid?.offsetSec ?? 0) * 1000)}
                onChange={(v) => patch({ offsetSec: Math.max(0, v) / 1000 })}
                step={5}
                unit="ms"
                aria-label="First beat offset in milliseconds"
              />
            </div>

            <button
              type="button"
              onClick={tap}
              className="h-7 rounded-studio-md bg-studio-surface border border-studio-border text-[12px] text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong transition-colors duration-120"
            >
              {tapCount > 1 ? `Tap along — ${tapCount} taps` : 'Tap along to set the tempo'}
            </button>

            {shaky && (
              <p className="text-[11px] text-amber-300 leading-relaxed">
                The beat in this track was hard to read, so the tempo above is a
                guess. Tap along or type it if it looks wrong.
              </p>
            )}

            {analysed && grid && Math.round(analysed.bpm!) !== Math.round(grid.bpm) && (
              <button
                type="button"
                onClick={() => patch({ bpm: analysed.bpm!, offsetSec: analysed.beatOffsetSec ?? 0 })}
                className="text-[11px] text-studio-text-faint hover:text-studio-text text-left transition-colors"
              >
                Back to the detected {Math.round(analysed.bpm!)} BPM
              </button>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
