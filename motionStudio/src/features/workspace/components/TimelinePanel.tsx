import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, Trash2, Layers, Square } from 'lucide-react';
import { useEditorStore } from '@/engines/editor';
import { useCanvasEngine } from '@/engines/canvas';
import { createScale, frameToX, xToFrame, formatFrameLabel } from '@/engines/timeline';
import type { Project } from '@/engines/project';
import { scenesOf, sceneSpan, spansAllShots } from '@/engines/project';
import TimelineRuler from './timeline/TimelineRuler';
import TimelineClip from './timeline/TimelineClip';
import ShotStrip from './timeline/ShotStrip';
import SequenceTrack from './timeline/SequenceTrack';
import { clipLabel } from './timeline/clipLabel';

const TRACK_HEADER_W = 140;
const RULER_H = 28;
const TRACK_ROW_H = 50;

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
  const { updateElement, removeElement, setElementSpan } = useCanvasEngine();
  const activeSceneId = useEditorStore((s) => s.activeSceneId);
  const setActiveScene = useEditorStore((s) => s.setActiveScene);

  const scenes = scenesOf(project);
  /* The shot being edited, if it still exists — deleting the open shot leaves
     a dangling id, and falling back to the overview is friendlier than an
     empty track. */
  const activeScene = scenes.find((s) => s.id === activeSceneId) ?? null;
  const viewWindow = activeScene
    ? sceneSpan(scenes, activeScene.id)
    : { start: 0, end: project.durationInFrames };

  /* top layer (highest zIndex) shown as the top row — Figma/CapCut convention.
     Scoped to the open shot, which is the whole point of drilling in: sixteen
     beat cuts stop being sixteen permanent rows. */
  const ordered = activeScene
    ? [...project.canvas.elements]
        // Video-wide elements — a background, a soundtrack — appear in every
        // shot, because that is where they actually are.
        .filter((el) => el.sceneId === activeScene.id || spansAllShots(el))
        .sort((a, b) => b.zIndex - a.zIndex)
    // The sequence view shows shots, not elements, so it has no element rows
    // and therefore no header labels either.
    : [];

  /* Which shot opens on arrival is chosen in EditorPage, next to the `reset()`
     that would otherwise wipe it — see the comment there. */

  /* Selecting an element that lives in another shot moves the timeline to it.
     Without this, clicking something on the canvas could select a clip the
     timeline refuses to show — the selection and the view disagreeing about
     what you are working on. */
  useEffect(() => {
    if (!selectedElementId) return;
    const el = project.canvas.elements.find((e) => e.id === selectedElementId);
    if (el?.sceneId && el.sceneId !== activeSceneId) setActiveScene(el.sceneId);
  }, [selectedElementId, project.canvas.elements, activeSceneId, setActiveScene]);

  /* ── measure the track body → trackWidth ── */
  const bodyRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  /* vertical scroll — keep the header labels and clip rows in lockstep */
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef   = useRef<HTMLDivElement>(null);
  const syncScroll = (from: 'header' | 'body') => {
    const h = headerScrollRef.current;
    const b = bodyScrollRef.current;
    if (!h || !b) return;
    if (from === 'body') h.scrollTop = b.scrollTop;
    else b.scrollTop = h.scrollTop;
  };

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      setTrackWidth(entry.contentRect.width);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const scale = createScale(trackWidth, viewWindow.end - viewWindow.start, viewWindow.start);
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
            title={activeScene ? 'Jump to the start of this shot' : 'Jump to start'}
            onClick={() => setCurrentFrame(viewWindow.start)}
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

      <ShotStrip project={project} />

      {/* Body: headers column + track area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Track headers (left) */}
        <div
          className="border-r border-studio-border flex flex-col shrink-0 bg-studio-panel"
          style={{ width: TRACK_HEADER_W }}
        >
          {/* spacer aligning with the ruler */}
          <div className="border-b border-studio-border shrink-0" style={{ height: RULER_H }} />

          {/* scrollable label rows (synced with clip rows) */}
          <div
            ref={headerScrollRef}
            onScroll={() => syncScroll('header')}
            className="flex-1 overflow-y-auto overflow-x-hidden"
          >
            {ordered.map((el) => (
              <div
                key={el.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedElement(el.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedElement(el.id)}
                className={[
                  'group w-full flex items-center gap-1 px-3 border-b border-studio-border shrink-0 text-left cursor-pointer transition-colors duration-120',
                  selectedElementId === el.id
                    ? 'bg-studio-surface text-studio-text'
                    : 'text-studio-text-muted hover:bg-studio-surface/50',
                ].join(' ')}
                style={{ height: TRACK_ROW_H }}
              >
                <span className="text-[11px] truncate flex-1">{clipLabel(el)}</span>
                {/* Pin to the whole video. The control lives here rather than in
                    Properties because this row is where you notice the problem:
                    the background is missing from the shot you just made. */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setElementSpan(el.id, !spansAllShots(el)); }}
                  title={spansAllShots(el)
                    ? 'Plays through the whole video — click to keep it to this shot only'
                    : 'Only in this shot — click to play it through the whole video'}
                  className={[
                    'w-5 h-5 shrink-0 flex items-center justify-center rounded-studio-xs transition-all duration-120',
                    spansAllShots(el)
                      ? 'text-studio-accent'
                      : 'text-studio-text-faint opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-studio-text',
                  ].join(' ')}
                >
                  {spansAllShots(el) ? <Layers className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeElement(el.id);
                    if (selectedElementId === el.id) setSelectedElement(null);
                  }}
                  title="Delete element"
                  className="w-5 h-5 shrink-0 flex items-center justify-center rounded-studio-xs text-studio-text-faint opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all duration-120"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Track body (right) — measured; ruler fixed, rows scroll, playhead spans both */}
        <div
          ref={bodyRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex-1 relative flex flex-col overflow-hidden cursor-ew-resize"
          style={{ touchAction: 'none' }}
        >
          {trackWidth > 0 && (
            <>
              <div className="shrink-0">
                <TimelineRuler scale={scale} fps={project.fps} height={RULER_H} />
              </div>

              {/* scrollable clip rows */}
              <div
                ref={bodyScrollRef}
                onScroll={() => syncScroll('body')}
                className="flex-1 overflow-y-auto overflow-x-hidden"
              >
                {!activeScene ? (
                  /* Sequence view: the video as its shots. Element rows would
                     be meaningless here — they belong to individual shots. */
                  <SequenceTrack project={project} scale={scale} height={TRACK_ROW_H + 12} />
                ) : ordered.length === 0 ? (
                  <div
                    className="flex items-center justify-center text-[11px] text-studio-text-faint select-none"
                    style={{ height: TRACK_ROW_H * 2 }}
                  >
                    This shot is empty — add something from the toolbar
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
                        bounds={spansAllShots(el) ? { start: 0, end: project.durationInFrames } : viewWindow}
                        onSelect={() => setSelectedElement(el.id)}
                        onUpdate={(patch) => updateElement(el.id, patch)}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Playhead — spans the ruler + the rows viewport */}
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
