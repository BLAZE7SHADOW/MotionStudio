import { useRef } from 'react';
import type { Project } from '@/engines/project';
import {
  useProjectStore,
  sceneLabel,
  scenesOf,
  sceneOffsets,
  elementsInScene,
  MIN_SCENE_FRAMES,
} from '@/engines/project';
import { useEditorStore } from '@/engines/editor';
import { frameToX, framesToWidth } from '@/engines/timeline';
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
    resizeShot(project.id, d.sceneId, Math.max(MIN_SCENE_FRAMES, d.startFrames + deltaFrames));
  }

  function onResizeUp(e: React.PointerEvent) {
    if (!drag.current) return;
    e.stopPropagation();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    drag.current = null;
  }

  return (
    <div className="relative" style={{ height }}>
      {scenes.map((scene) => {
        const start = offsets.get(scene.id) ?? 0;
        const left = frameToX(scale, start);
        const width = Math.max(MIN_BLOCK_PX, framesToWidth(scale, scene.durationInFrames));
        const count = elementsInScene(project, scene.id).length;

        return (
          <div
            key={scene.id}
            role="button"
            tabIndex={0}
            onClick={() => { setActiveScene(scene.id); setCurrentFrame(start); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setActiveScene(scene.id); setCurrentFrame(start); }
            }}
            title={`${sceneLabel(scenes, scene.id)} — click to open`}
            className="absolute top-2 bottom-2 rounded-studio-md border border-studio-border bg-studio-surface hover:border-studio-border-strong overflow-hidden cursor-pointer transition-colors duration-120"
            style={{ left, width }}
          >
            <div className="px-2 py-1.5 flex flex-col gap-0.5 pointer-events-none">
              <span className="block text-[11px] font-medium text-studio-text truncate">
                {sceneLabel(scenes, scene.id)}
              </span>
              <span className="block text-[10px] text-studio-text-faint truncate tabular-nums">
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
              onClick={(e) => e.stopPropagation()}
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
