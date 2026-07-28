import { useRef, useState } from 'react';
import type { Project } from '@/engines/project';
import {
  useProjectStore,
  sceneLabel,
  scenesOf,
  sceneOffsets,
  elementsInScene,
  MIN_SCENE_FRAMES,
  gridActive,
  snapFrameToBeat,
  framesInBeats,
} from '@/engines/project';
import { useEditorStore } from '@/engines/editor';
import { frameToX, framesToWidth, xToFrame } from '@/engines/timeline';
import type { TimelineScale } from '@/engines/timeline';

/**
 * The whole video as its shots — the view that finally lets you think about a
 * video as a sequence of moments rather than a pile of elements.
 *
 * Blocks are proportional to duration, so this reads as a plan of the video.
 * A minimum width keeps a half-second beat cut clickable at densities where
 * proportional alone would render it three pixels wide.
 */
const MIN_BLOCK_PX = 44;

/** Movement below this reads as a click, not a drag. */
const DRAG_SLOP_PX = 4;

export default function SequenceTrack({
  project,
  scale,
  height,
}: {
  project: Project;
  scale: TimelineScale;
  height: number;
}) {
  const scenes = scenesOf(project);
  const offsets = sceneOffsets(scenes);
  const setActiveScene = useEditorStore((s) => s.setActiveScene);
  const setCurrentFrame = useEditorStore((s) => s.setCurrentFrame);
  const resizeShot = useProjectStore((s) => s.resizeShot);

  const moveShot = useProjectStore((s) => s.moveShot);

  /* Same reasoning as ScrubInput: the drag origin lives in a ref because it
     changes on every pointermove, and re-rendering the timeline at pointer
     frequency is exactly the jank worth avoiding. */
  const drag = useRef<{ sceneId: string; startX: number; startFrames: number } | null>(null);

  function onResizeDown(e: React.PointerEvent, sceneId: string, durationInFrames: number) {
    // Stop the parent's scrub handler taking the pointer.
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { sceneId, startX: e.clientX, startFrames: durationInFrames };
  }

  function onResizeMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || scale.pxPerFrame === 0) return;
    e.stopPropagation();
    const deltaFrames = Math.round((e.clientX - d.startX) / scale.pxPerFrame);
    let next = d.startFrames + deltaFrames;

    /* Snap the shot's END to a beat, not its length — the boundary is the thing
       that has to land on the music. Alt escapes it, because snapping you can't
       get out of is worse than none when you want a deliberately odd length. */
    if (gridActive(project.beatGrid) && !e.altKey) {
      const start = offsets.get(d.sceneId) ?? 0;
      next = snapFrameToBeat(project.beatGrid, project.fps, start + next) - start;
    }
    resizeShot(project.id, d.sceneId, Math.max(MIN_SCENE_FRAMES, next));
  }

  function onResizeUp(e: React.PointerEvent) {
    if (!drag.current) return;
    e.stopPropagation();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    drag.current = null;
  }

  /* ── reordering ──
     Committed once on release rather than continuously during the drag. Moving
     a shot rewrites the absolute start frame of every element in it, so
     reordering live would push a burst of those through undo history and make
     the blocks shuffle under the pointer. A drop marker says where it will land
     and one write does it. */
  const move = useRef<{ sceneId: string; fromIndex: number; startX: number; moved: number; dropIndex: number | null } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function onBlockDown(e: React.PointerEvent, sceneId: string, index: number) {
    /* The track body behind us starts a scrub on pointerdown and calls
       `setPointerCapture` on itself, which would redirect every subsequent
       pointermove away from this block — so the drag would silently become a
       playhead scrub. Claim the gesture before it can. */
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    move.current = { sceneId, fromIndex: index, startX: e.clientX, moved: 0, dropIndex: null };
  }

  function onBlockMove(e: React.PointerEvent) {
    const m = move.current;
    if (!m) return;
    m.moved = Math.max(m.moved, Math.abs(e.clientX - m.startX));
    if (m.moved < DRAG_SLOP_PX) return;
    setDragging(m.sceneId);

    // Which slot the pointer is over: the first block whose midpoint it hasn't
    // passed. Measured in frames so it works at any zoom.
    const rect = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
    const frame = xToFrame(scale, e.clientX - rect.left);
    let target = scenes.length - 1;
    for (let i = 0; i < scenes.length; i++) {
      const s = offsets.get(scenes[i].id) ?? 0;
      if (frame < s + scenes[i].durationInFrames / 2) { target = i; break; }
    }
    m.dropIndex = target;
    setDropIndex(target);
  }

  function onBlockUp(e: React.PointerEvent, sceneId: string, start: number) {
    const m = move.current;
    move.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(null);
    setDropIndex(null);
    if (!m) return;

    // Never moved → it was a click, and a click opens the shot.
    if (m.moved < DRAG_SLOP_PX) {
      setActiveScene(sceneId);
      setCurrentFrame(start);
      return;
    }
    if (m.dropIndex !== null && m.dropIndex !== m.fromIndex) {
      moveShot(project.id, sceneId, m.dropIndex);
    }
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Where the dragged shot will land. Drawn on the boundary rather than
          animating the blocks, so nothing moves until the move is real. */}
      {dropIndex !== null && dragging && (
        <div
          className="absolute top-1 bottom-1 w-0.5 bg-studio-accent rounded-full pointer-events-none z-10"
          style={{ left: frameToX(scale, offsets.get(scenes[dropIndex].id) ?? 0) }}
        />
      )}

      {scenes.map((scene, index) => {
        const start = offsets.get(scene.id) ?? 0;
        const left = frameToX(scale, start);
        const width = Math.max(MIN_BLOCK_PX, framesToWidth(scale, scene.durationInFrames));
        const count = elementsInScene(project, scene.id).length;

        return (
          <div
            key={scene.id}
            role="button"
            tabIndex={0}
            onPointerDown={(e) => onBlockDown(e, scene.id, index)}
            onPointerMove={onBlockMove}
            onPointerUp={(e) => onBlockUp(e, scene.id, start)}
            onPointerCancel={(e) => onBlockUp(e, scene.id, start)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setActiveScene(scene.id); setCurrentFrame(start); }
            }}
            title={`${sceneLabel(scenes, scene.id)} — click to open, drag to reorder`}
            className={[
              'absolute top-2 bottom-2 rounded-studio-md border overflow-hidden transition-colors duration-120',
              dragging === scene.id
                ? 'border-studio-accent-border bg-studio-surface opacity-60 cursor-grabbing'
                : 'border-studio-border bg-studio-surface hover:border-studio-border-strong cursor-pointer',
            ].join(' ')}
            style={{ left, width, touchAction: 'none' }}
          >
            <div className="px-2 py-1.5 flex flex-col gap-0.5 pointer-events-none">
              <span className="block text-[11px] font-medium text-studio-text truncate">
                {sceneLabel(scenes, scene.id)}
              </span>
              <span className="block text-[10px] text-studio-text-faint truncate tabular-nums">
                {/* Beats first when there's a grid: with music, "4 beats" is the
                    length you're actually choosing and seconds are the detail. */}
                {gridActive(project.beatGrid)
                  ? `${framesInBeats(project.beatGrid, project.fps, scene.durationInFrames)} beats · `
                  : ''}
                {(scene.durationInFrames / project.fps).toFixed(1)}s
                {count > 0 && ` · ${count}`}
              </span>
            </div>

            {/* Resize by the trailing edge only. A leading edge would have to
                decide whether it moves this shot or the one before it, and
                either answer surprises half the people who drag it. */}
            <div
              onPointerDown={(e) => onResizeDown(e, scene.id, scene.durationInFrames)}
              onPointerMove={onResizeMove}
              onPointerUp={onResizeUp}
              onPointerCancel={onResizeUp}
              title={`Drag to change how long ${sceneLabel(scenes, scene.id)} lasts`}
              className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize bg-transparent hover:bg-studio-accent/40"
              style={{ touchAction: 'none' }}
            />
          </div>
        );
      })}
    </div>
  );
}
