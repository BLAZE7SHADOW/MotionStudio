import { useRef } from 'react';
import { frameToX, framesToWidth } from '@/engines/timeline';
import type { TimelineScale } from '@/engines/timeline';
import type { CanvasElement } from '@/engines/project';

const MIN_CLIP_FRAMES = 1;

type DragMode = 'move' | 'trim-start' | 'trim-end';

interface DragState {
  mode: DragMode;
  startClientX: number;
  origStart: number;
  origDuration: number;
}

interface TimelineClipProps {
  el: CanvasElement;
  scale: TimelineScale;
  selected: boolean;
  totalFrames: number;
  onSelect: () => void;
  onChange: (startFrame: number, durationInFrames: number) => void;
}

function clipLabel(el: CanvasElement): string {
  if (el.type === 'text') return el.content.trim() || 'Text';
  return el.type;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function TimelineClip({
  el, scale, selected, totalFrames, onSelect, onChange,
}: TimelineClipProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const drag    = useRef<DragState | null>(null);

  const left  = frameToX(scale, el.startFrame);
  const width = framesToWidth(scale, el.durationInFrames);

  function beginDrag(e: React.PointerEvent, mode: DragMode) {
    e.stopPropagation();            // don't let the timeline body scrub
    onSelect();
    drag.current = {
      mode,
      startClientX: e.clientX,
      origStart: el.startFrame,
      origDuration: el.durationInFrames,
    };
    rootRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || scale.pxPerFrame === 0) return;

    // pixel movement → frame movement
    const deltaFrames = Math.round((e.clientX - d.startClientX) / scale.pxPerFrame);
    const rightEdge = d.origStart + d.origDuration; // fixed point for trim-start

    if (d.mode === 'move') {
      const start = clamp(d.origStart + deltaFrames, 0, totalFrames - d.origDuration);
      onChange(start, d.origDuration);
    } else if (d.mode === 'trim-start') {
      const start = clamp(d.origStart + deltaFrames, 0, rightEdge - MIN_CLIP_FRAMES);
      onChange(start, rightEdge - start);              // right edge stays put
    } else {
      const duration = clamp(d.origDuration + deltaFrames, MIN_CLIP_FRAMES, totalFrames - d.origStart);
      onChange(d.origStart, duration);                 // left edge stays put
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    if (rootRef.current?.hasPointerCapture(e.pointerId)) {
      rootRef.current.releasePointerCapture(e.pointerId);
    }
  }

  const handleClass =
    'absolute top-0 bottom-0 w-1.5 cursor-ew-resize z-10 ' +
    (selected ? 'bg-studio-accent' : 'bg-white/10 hover:bg-white/25');

  return (
    <div
      ref={rootRef}
      onPointerDown={(e) => beginDrag(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={[
        'absolute flex items-center px-2 rounded-studio-sm border overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-120',
        selected
          ? 'bg-studio-accent-subtle border-studio-accent text-studio-text'
          : 'bg-studio-surface border-studio-border text-studio-text-muted hover:border-studio-border-strong',
      ].join(' ')}
      style={{ left, width, top: 4, bottom: 4, touchAction: 'none' }}
    >
      {/* left trim handle */}
      <div
        onPointerDown={(e) => beginDrag(e, 'trim-start')}
        className={handleClass}
        style={{ left: 0 }}
      />

      <span className="text-[11px] font-medium truncate pointer-events-none px-1">
        {clipLabel(el)}
      </span>

      {/* right trim handle */}
      <div
        onPointerDown={(e) => beginDrag(e, 'trim-end')}
        className={handleClass}
        style={{ right: 0 }}
      />
    </div>
  );
}
