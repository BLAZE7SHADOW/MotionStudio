import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack } from 'lucide-react';
import { useEditorStore } from '@/engines/editor';
import { useCanvasEngine } from '@/engines/canvas';
import { createScale, frameToX, xToFrame, formatFrameLabel } from '@/engines/timeline';
import type { Project, CanvasElement } from '@/engines/project';
import TimelineRuler from './timeline/TimelineRuler';
import TimelineClip from './timeline/TimelineClip';

const TRACK_HEADER_W = 140;
const RULER_H = 28;
const TRACK_ROW_H = 50;

function clipLabel(el: CanvasElement): string {
  if (el.type === 'text') return el.content.trim() || 'Text';
  return el.type;
}

interface TimelinePanelProps {
  project: Project;
}

export default function TimelinePanel({ project }: TimelinePanelProps) {
  const currentFrame       = useEditorStore((s) => s.currentFrame);
  const setCurrentFrame    = useEditorStore((s) => s.setCurrentFrame);
  const selectedElementId  = useEditorStore((s) => s.selectedElementId);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const isPlaying          = useEditorStore((s) => s.isPlaying);
  const setIsPlaying       = useEditorStore((s) => s.setIsPlaying);
  const { updateElement }  = useCanvasEngine();

  /* top layer (highest zIndex) shown as the top row — Figma/CapCut convention */
  const ordered = [...project.canvas.elements].sort((a, b) => b.zIndex - a.zIndex);

  /* ── measure the track body → trackWidth ── */
  const bodyRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const scale = createScale(trackWidth, project.durationInFrames);
  const playheadX = frameToX(scale, currentFrame);

  /* ── scrubbing: pixel under the pointer → frame ── */
  const scrubbing = useRef(false);

  function frameFromPointer(clientX: number): number {
    const rect = bodyRef.current!.getBoundingClientRect();
    return xToFrame(scale, clientX - rect.left);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!bodyRef.current) return;
    scrubbing.current = true;
    bodyRef.current.setPointerCapture(e.pointerId);
    setCurrentFrame(frameFromPointer(e.clientX));
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!scrubbing.current) return;
    setCurrentFrame(frameFromPointer(e.clientX));
  }

  function onPointerUp(e: React.PointerEvent) {
    scrubbing.current = false;
    if (bodyRef.current?.hasPointerCapture(e.pointerId)) {
      bodyRef.current.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">
      {/* Header */}
      <div className="h-9 border-b border-studio-border flex items-center justify-between px-3 shrink-0">
        {/* Transport */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Jump to start"
            onClick={() => setCurrentFrame(0)}
            className="w-7 h-7 flex items-center justify-center rounded-studio-sm text-studio-text-muted hover:text-studio-text hover:bg-studio-surface transition-colors duration-120"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title={isPlaying ? 'Pause' : 'Play'}
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-7 h-7 flex items-center justify-center rounded-studio-sm text-studio-text hover:bg-studio-surface transition-colors duration-120"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <span className="ml-2 text-[11px] font-semibold text-studio-text-faint uppercase tracking-widest">
            Timeline
          </span>
        </div>

        <span className="text-[11px] font-mono text-studio-text-faint tabular-nums">
          {formatFrameLabel(currentFrame, project.fps)} · {currentFrame}/{project.durationInFrames} f
        </span>
      </div>

      {/* Body: headers column + track area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Track headers (left) */}
        <div
          className="border-r border-studio-border flex flex-col shrink-0 bg-studio-panel"
          style={{ width: TRACK_HEADER_W }}
        >
          {/* spacer aligning with the ruler */}
          <div className="border-b border-studio-border shrink-0" style={{ height: RULER_H }} />

          {/* one label row per element (= one layer) */}
          {ordered.map((el) => (
            <button
              key={el.id}
              type="button"
              onClick={() => setSelectedElement(el.id)}
              className={[
                'flex items-center px-3 border-b border-studio-border shrink-0 text-left transition-colors duration-120',
                selectedElementId === el.id
                  ? 'bg-studio-surface text-studio-text'
                  : 'text-studio-text-muted hover:bg-studio-surface/50',
              ].join(' ')}
              style={{ height: TRACK_ROW_H }}
            >
              <span className="text-[11px] truncate">{clipLabel(el)}</span>
            </button>
          ))}
        </div>

        {/* Track body (right) — measured, holds ruler + clips + playhead */}
        <div
          ref={bodyRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex-1 relative overflow-hidden cursor-ew-resize"
          style={{ touchAction: 'none' }}
        >
          {trackWidth > 0 && (
            <>
              <TimelineRuler scale={scale} fps={project.fps} height={RULER_H} />

              {/* one clip row per element */}
              {ordered.length === 0 ? (
                <div
                  className="flex items-center justify-center text-[11px] text-studio-text-faint select-none"
                  style={{ height: TRACK_ROW_H * 2 }}
                >
                  Add text to see clips here
                </div>
              ) : (
                ordered.map((el) => (
                  <div
                    key={el.id}
                    className="relative border-b border-studio-border"
                    style={{ height: TRACK_ROW_H }}
                  >
                    <TimelineClip
                      el={el}
                      scale={scale}
                      selected={selectedElementId === el.id}
                      totalFrames={project.durationInFrames}
                      onSelect={() => setSelectedElement(el.id)}
                      onUpdate={(patch) => updateElement(el.id, patch)}
                    />
                  </div>
                ))
              )}

              {/* Playhead — spans ruler + tracks */}
              <div
                className="absolute top-0 bottom-0 w-px bg-studio-accent z-20 pointer-events-none"
                style={{ left: playheadX }}
              >
                <div className="absolute -top-px -left-0.75 w-1.75 h-1.75 rounded-full bg-studio-accent" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
