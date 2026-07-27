import { useRef } from 'react';
import { frameToX, framesToWidth } from '@/engines/timeline';
import type { TimelineScale } from '@/engines/timeline';
import type { CanvasElement, Animation } from '@/engines/project';
import { clipLabel } from './clipLabel';

const MIN_CLIP_FRAMES = 1;
const MIN_ANIM_FRAMES = 1;
const LABEL_H = 22;
const STRIP_H = 20;
const BAR_H = 6;
const BAR_PITCH = 7;

type ClipMode = 'move' | 'trim-start' | 'trim-end';

type Drag =
  | { kind: 'clip'; mode: ClipMode; startClientX: number; origStart: number; origDuration: number }
  | { kind: 'anim'; index: number; mode: 'move' | 'resize'; startClientX: number; origStart: number; origDuration: number };

interface TimelineClipProps {
  el: CanvasElement;
  scale: TimelineScale;
  selected: boolean;
  totalFrames: number;
  onSelect: () => void;
  onUpdate: (patch: { startFrame?: number; durationInFrames?: number; animations?: Animation[] }) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function TimelineClip({
  el, scale, selected, totalFrames, onSelect, onUpdate,
}: TimelineClipProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const drag    = useRef<Drag | null>(null);

  const left  = frameToX(scale, el.startFrame);
  const width = framesToWidth(scale, el.durationInFrames);
  const anims = el.animations ?? [];

  function begin(e: React.PointerEvent, d: Drag) {
    e.stopPropagation();
    onSelect();
    drag.current = d;
    rootRef.current?.setPointerCapture(e.pointerId);
  }
  const beginClip = (e: React.PointerEvent, mode: ClipMode) =>
    begin(e, { kind: 'clip', mode, startClientX: e.clientX, origStart: el.startFrame, origDuration: el.durationInFrames });
  const beginAnim = (e: React.PointerEvent, index: number, mode: 'move' | 'resize') =>
    begin(e, { kind: 'anim', index, mode, startClientX: e.clientX, origStart: anims[index].startOffset, origDuration: anims[index].duration });

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || scale.pxPerFrame === 0) return;
    const deltaFrames = Math.round((e.clientX - d.startClientX) / scale.pxPerFrame);

    if (d.kind === 'clip') {
      const rightEdge = d.origStart + d.origDuration;
      if (d.mode === 'move') {
        onUpdate({ startFrame: clamp(d.origStart + deltaFrames, 0, totalFrames - d.origDuration), durationInFrames: d.origDuration });
      } else if (d.mode === 'trim-start') {
        const start = clamp(d.origStart + deltaFrames, 0, rightEdge - MIN_CLIP_FRAMES);
        onUpdate({ startFrame: start, durationInFrames: rightEdge - start });
      } else {
        onUpdate({ startFrame: d.origStart, durationInFrames: clamp(d.origDuration + deltaFrames, MIN_CLIP_FRAMES, totalFrames - d.origStart) });
      }
    } else {
      const clipDur = el.durationInFrames;
      const next = anims.slice();
      const a = next[d.index];
      if (!a) return;
      if (d.mode === 'move') {
        next[d.index] = { ...a, startOffset: clamp(d.origStart + deltaFrames, 0, clipDur - a.duration) };
      } else {
        next[d.index] = { ...a, duration: clamp(d.origDuration + deltaFrames, MIN_ANIM_FRAMES, clipDur - a.startOffset) };
      }
      onUpdate({ animations: next });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    if (rootRef.current?.hasPointerCapture(e.pointerId)) rootRef.current.releasePointerCapture(e.pointerId);
  }

  const handleClass =
    'absolute top-0 bottom-0 w-1.5 cursor-ew-resize z-10 ' +
    (selected ? 'bg-studio-accent' : 'bg-white/10 hover:bg-white/25');

  return (
    <div
      ref={rootRef}
      onPointerDown={(e) => beginClip(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={[
        'absolute rounded-studio-sm border overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-120',
        selected
          ? 'bg-studio-accent-subtle border-studio-accent text-studio-text'
          : 'bg-studio-surface border-studio-border text-studio-text-muted hover:border-studio-border-strong',
      ].join(' ')}
      style={{ left, width, top: 4, bottom: 4, touchAction: 'none' }}
    >
      {/* left trim handle */}
      <div onPointerDown={(e) => beginClip(e, 'trim-start')} className={handleClass} style={{ left: 0 }} />

      {/* label (grab here to move the clip) */}
      <div className="absolute top-0 left-0 right-0 flex items-center px-2.5" style={{ height: LABEL_H }}>
        <span className="text-[11px] font-medium truncate pointer-events-none">{clipLabel(el)}</span>
      </div>

      {/* animation strip — one draggable bar per animation */}
      {anims.length > 0 && width > 12 && (
        <div className="absolute left-0 right-0 bottom-0" style={{ height: STRIP_H }}>
          {anims.map((a, i) => (
            <div
              key={i}
              onPointerDown={(e) => beginAnim(e, i, 'move')}
              title="Drag to move · edge to resize"
              className="absolute rounded-[2px] bg-studio-accent/70 hover:bg-studio-accent cursor-grab active:cursor-grabbing"
              style={{
                left: framesToWidth(scale, a.startOffset),
                width: Math.max(framesToWidth(scale, a.duration), 6),
                height: BAR_H,
                bottom: 2 + i * BAR_PITCH,
              }}
            >
              <div
                onPointerDown={(e) => beginAnim(e, i, 'resize')}
                className="absolute top-0 bottom-0 right-0 w-1 cursor-ew-resize bg-white/50 rounded-r-[2px]"
              />
            </div>
          ))}
        </div>
      )}

      {/* right trim handle */}
      <div onPointerDown={(e) => beginClip(e, 'trim-end')} className={handleClass} style={{ right: 0 }} />
    </div>
  );
}
