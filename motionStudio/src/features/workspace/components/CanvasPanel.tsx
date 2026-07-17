import { useEffect, useRef, useState } from 'react';
import Moveable from 'react-moveable';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { useProjectStore, getCompositionDimensions } from '@/engines/project';
import { useCanvasEngine } from '@/engines/canvas';
import { useEditorStore } from '@/engines/editor';
import { textElementStyle, elementBoxStyle, MotionComposition } from '@/engines/rendering';
import type { TextElement } from '@/engines/canvas';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 10%) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

const PAD = 48;
const ACCENT = 'oklch(0.627 0.265 298.232)';

interface CanvasPanelProps {
  projectId: string;
}

/* ── editable text node (contenteditable) — shown as overlay during inline edit ── */
function TextNodeEditing({
  el,
  scale,
  onInput,
  onDone,
}: {
  el: TextElement;
  scale: number;
  onInput: (content: string) => void;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.textContent = el.content;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e)   => onInput(e.currentTarget.textContent ?? '')}
      onBlur={onDone}
      onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
      onClick={(e)   => e.stopPropagation()}
      style={{
        ...textElementStyle(el, scale),
        cursor:        'text',
        userSelect:    'text',
        outline:       `2px solid ${ACCENT}`,
        outlineOffset: 2,
      }}
    />
  );
}

export default function CanvasPanel({ projectId }: CanvasPanelProps) {
  const project            = useProjectStore((s) => s.getProject(projectId));
  const { elements, updateElement, removeElement, addImage, addVideo, addAudio } = useCanvasEngine();
  const selectedElementId  = useEditorStore((s) => s.selectedElementId);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const isPlaying          = useEditorStore((s) => s.isPlaying);
  const currentFrame       = useEditorStore((s) => s.currentFrame);

  const areaRef        = useRef<HTMLDivElement>(null);
  const stageRef       = useRef<HTMLDivElement>(null);
  const playerRef      = useRef<PlayerRef>(null);
  const [area, setArea]                         = useState({ w: 0, h: 0 });
  const [moveableTarget,   setMoveableTarget]   = useState<HTMLElement | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [dragOver, setDragOver]                 = useState(false);

  /* ── measure available area → scale factor ── */
  useEffect(() => {
    const node = areaRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      setArea({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  /* ── sync Remotion Player to the editor's current frame ── */
  useEffect(() => {
    playerRef.current?.seekTo(currentFrame);
  }, [currentFrame]);

  /* ── find selected DOM element for moveable ── */
  useEffect(() => {
    if (!selectedElementId || editingElementId || isPlaying || !stageRef.current) {
      setMoveableTarget(null);
      return;
    }
    const el = stageRef.current.querySelector(
      `[data-element-id="${selectedElementId}"]`
    ) as HTMLElement | null;
    setMoveableTarget(el);
  }, [selectedElementId, editingElementId, isPlaying, elements, currentFrame]);

  /* ── clear editing when selection changes ── */
  useEffect(() => {
    setEditingElementId(null);
  }, [selectedElementId]);

  /* ── clear selection/editing when entering preview ── */
  useEffect(() => {
    if (isPlaying) {
      setEditingElementId(null);
      setSelectedElement(null);
    }
  }, [isPlaying, setSelectedElement]);

  /* ── keyboard: Delete / Escape ── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (editingElementId || isPlaying) return;

      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !isTyping) {
        removeElement(selectedElementId);
        setSelectedElement(null);
      }
      if (e.key === 'Escape') setSelectedElement(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedElementId, editingElementId, isPlaying, removeElement, setSelectedElement]);

  if (!project) return null;

  const { width: compW, height: compH } = getCompositionDimensions(project.aspectRatio);

  const availW = Math.max(0, area.w - PAD * 2);
  const availH = Math.max(0, area.h - PAD * 2);
  const scale  = availW > 0 && availH > 0 ? Math.min(availW / compW, availH / compH) : 0;
  const displayW = compW * scale;
  const displayH = compH * scale;
  const ready = scale > 0;

  /* elements alive at the current frame — for the interaction overlay */
  const visibleElements = elements.filter(
    (el) => currentFrame >= el.startFrame && currentFrame < el.startFrame + el.durationInFrames
  );

  /* drop an asset from the panel → place it where it lands (in composition space) */
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const assetId = e.dataTransfer.getData('application/x-motionstudio-asset');
    if (!assetId || !stageRef.current || !project) return;
    const asset = project.assets.find((a) => a.id === assetId);
    if (!asset) return;

    const rect = stageRef.current.getBoundingClientRect();
    const at = { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };

    const el =
      asset.type === 'image' ? addImage(assetId, at) :
      asset.type === 'video' ? addVideo(assetId, at) :
      asset.type === 'audio' ? addAudio(assetId) :
      null;
    if (el) setSelectedElement(el.id);
  }

  return (
    <div
      ref={areaRef}
      className="flex-1 flex flex-col items-center justify-center overflow-hidden bg-studio-bg gap-3"
      style={DOT_GRID}
    >
      {ready && (
        <>
          {/* Stage */}
          <div
            ref={stageRef}
            onClick={() => {
              if (isPlaying) return;
              setEditingElementId(null);
              setSelectedElement(null);
            }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="relative"
            style={{
              width: displayW,
              height: displayH,
              backgroundColor: '#000000',
              boxShadow: [
                '0 0 0 1px oklch(1 0 0 / 8%)',
                '0 30px 80px oklch(0 0 0 / 90%)',
                '0 8px 24px oklch(0 0 0 / 60%)',
              ].join(', '),
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {/* Player — drives all visual output through the same pipeline as export */}
            <Player
              ref={playerRef}
              component={MotionComposition}
              inputProps={{ elements, assets: project.assets }}
              durationInFrames={Math.max(1, project.durationInFrames)}
              fps={project.fps}
              compositionWidth={compW}
              compositionHeight={compH}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              controls={false}
              loop={false}
              clickToPlay={false}
              doubleClickToFullscreen={false}
              allowFullscreen={false}
            />

            {/* Drop-target highlight */}
            {dragOver && (
              <div
                className="absolute inset-0 z-30 pointer-events-none"
                style={{
                  outline: `2px solid ${ACCENT}`,
                  outlineOffset: -2,
                  backgroundColor: 'oklch(0.627 0.265 298.232 / 10%)',
                }}
              />
            )}

            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[12px] text-white/15 font-mono select-none tracking-widest">
                  {project.aspectRatio} · {project.fps} fps
                </span>
              </div>
            )}

            {/* Interaction overlay — transparent hit targets per visible element */}
            {!isPlaying && visibleElements.map((el) => {
              if (editingElementId === el.id && el.type === 'text') {
                return (
                  <TextNodeEditing
                    key={el.id}
                    el={el}
                    scale={scale}
                    onInput={(content) => updateElement(el.id, { content })}
                    onDone={() => setEditingElementId(null)}
                  />
                );
              }
              return (
                <div
                  key={el.id}
                  data-element-id={el.id}
                  style={{
                    ...elementBoxStyle(el, scale),
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (el.type === 'text') {
                      setSelectedElement(el.id);
                      setEditingElementId(el.id);
                    }
                  }}
                />
              );
            })}

            {/* Moveable — targets the transparent overlay div for the selected element */}
            {moveableTarget && selectedElementId && !editingElementId && !isPlaying && (
              <Moveable
                target={moveableTarget}
                container={stageRef.current}
                draggable
                resizable
                rotatable
                keepRatio={false}
                throttleDrag={0}
                throttleResize={0}
                throttleRotate={0}
                onDrag={({ target, left, top }) => {
                  target.style.left = `${left}px`;
                  target.style.top  = `${top}px`;
                }}
                onDragEnd={({ lastEvent }) => {
                  if (lastEvent) updateElement(selectedElementId, {
                    x: lastEvent.left / scale,
                    y: lastEvent.top / scale,
                  });
                }}
                onResize={({ target, width, height, drag }) => {
                  target.style.width  = `${width}px`;
                  target.style.height = `${height}px`;
                  target.style.left   = `${drag.left}px`;
                  target.style.top    = `${drag.top}px`;
                }}
                onResizeEnd={({ lastEvent }) => {
                  if (lastEvent) updateElement(selectedElementId, {
                    width:  lastEvent.width  / scale,
                    height: lastEvent.height / scale,
                    x:      lastEvent.drag.left / scale,
                    y:      lastEvent.drag.top  / scale,
                  });
                }}
                onRotate={({ target, rotate }) => {
                  target.style.transform = `rotate(${rotate}deg)`;
                }}
                onRotateEnd={({ lastEvent }) => {
                  if (lastEvent) updateElement(selectedElementId, { rotation: lastEvent.rotate });
                }}
              />
            )}
          </div>

          {/* Zoom indicator */}
          <div className="flex items-center gap-1.5 px-2.5 h-6 rounded-studio-md bg-studio-surface/60 border border-studio-border backdrop-blur-sm pointer-events-none select-none">
            <span className="text-[11px] font-medium text-studio-text-faint tabular-nums">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
