import { useEffect, useRef, useState } from 'react';
import Moveable from 'react-moveable';
import { useProjectStore } from '@/engines/project';
import { useCanvasEngine } from '@/engines/canvas';
import { useEditorStore } from '@/engines/editor';
import type { TextElement } from '@/engines/canvas';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 10%) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

interface CanvasPanelProps {
  projectId: string;
}

const ASPECT_DIMS: Record<string, { w: number; h: number }> = {
  '16:9': { w: 16, h: 9 },
  '9:16': { w: 9,  h: 16 },
  '1:1':  { w: 1,  h: 1 },
};

/* ── static text node (selectable, draggable) ── */
function TextNode({
  el,
  onSelect,
  onEditStart,
}: {
  el: TextElement;
  onSelect: () => void;
  onEditStart: () => void;
}) {
  return (
    <div
      data-element-id={el.id}
      onClick={(e)       => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEditStart(); }}
      style={{
        position:   'absolute',
        left:       el.x,
        top:        el.y,
        width:      el.width,
        height:     el.height,
        transform:  `rotate(${el.rotation}deg)`,
        opacity:    el.opacity,
        zIndex:     el.zIndex,
        fontSize:   el.fontSize,
        fontFamily: el.fontFamily,
        color:      el.color,
        cursor:     'pointer',
        userSelect: 'none',
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        wordBreak:  'break-word',
      }}
    >
      {el.content}
    </div>
  );
}

/* ── editable text node (contenteditable, cursor visible) ── */
function TextNodeEditing({
  el,
  onInput,
  onDone,
}: {
  el: TextElement;
  onInput: (content: string) => void;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  /* set content via ref on mount only — never via children
     so React never touches the DOM and cursor never resets */
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
        position:   'absolute',
        left:       el.x,
        top:        el.y,
        width:      el.width,
        minHeight:  el.height,
        transform:  `rotate(${el.rotation}deg)`,
        opacity:    el.opacity,
        zIndex:     el.zIndex,
        fontSize:   el.fontSize,
        fontFamily: el.fontFamily,
        color:      el.color,
        cursor:     'text',
        userSelect: 'text',
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        wordBreak:  'break-word',
        outline:    '2px solid oklch(0.627 0.265 298.232)',
        outlineOffset: 2,
      }}
    />
  );
}

export default function CanvasPanel({ projectId }: CanvasPanelProps) {
  const project            = useProjectStore((s) => s.getProject(projectId));
  const { elements, updateElement, removeElement } = useCanvasEngine();
  const selectedElementId  = useEditorStore((s) => s.selectedElementId);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);

  const zoom = useEditorStore((s) => s.zoom);

  const containerRef   = useRef<HTMLDivElement>(null);
  const [moveableTarget,   setMoveableTarget]   = useState<HTMLElement | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  /* ── find selected DOM element for moveable ── */
  useEffect(() => {
    if (!selectedElementId || editingElementId || !containerRef.current) {
      setMoveableTarget(null);
      return;
    }
    const el = containerRef.current.querySelector(
      `[data-element-id="${selectedElementId}"]`
    ) as HTMLElement | null;
    setMoveableTarget(el);
  }, [selectedElementId, editingElementId, elements]);

  /* ── clear editing when selection changes ── */
  useEffect(() => {
    setEditingElementId(null);
  }, [selectedElementId]);

  /* ── keyboard: Delete / Escape ── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (editingElementId) return;

      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !isTyping) {
        removeElement(selectedElementId);
        setSelectedElement(null);
      }
      if (e.key === 'Escape') {
        setSelectedElement(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedElementId, editingElementId, removeElement, setSelectedElement]);

  if (!project) return null;

  const dims = ASPECT_DIMS[project.aspectRatio];
  const pad  = 48;

  function handleEditDone() {
    setEditingElementId(null);
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center overflow-hidden bg-studio-bg gap-3"
      style={DOT_GRID}
    >
      {/* Canvas */}
      <div
        ref={containerRef}
        onClick={() => {
          setEditingElementId(null);
          setSelectedElement(null);
        }}
        className="relative"
        style={{
          aspectRatio:     `${dims.w} / ${dims.h}`,
          maxWidth:        `calc(100% - ${pad * 2}px)`,
          maxHeight:       `calc(100% - ${pad * 2}px)`,
          width:  dims.w >= dims.h ? '100%' : 'auto',
          height: dims.w <  dims.h ? '100%' : 'auto',
          backgroundColor: '#000000',
          boxShadow: [
            '0 0 0 1px oklch(1 0 0 / 8%)',
            '0 30px 80px oklch(0 0 0 / 90%)',
            '0 8px 24px oklch(0 0 0 / 60%)',
          ].join(', '),
          borderRadius: 2,
        }}
      >
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[12px] text-white/15 font-mono select-none tracking-widest">
              {project.aspectRatio} · {project.fps} fps
            </span>
          </div>
        )}

        {elements.map((el) => {
          if (el.type !== 'text') return null;

          if (editingElementId === el.id) {
            return (
              <TextNodeEditing
                key={el.id}
                el={el}
                onInput={(content) => updateElement(el.id, { content })}
                onDone={handleEditDone}
              />
            );
          }

          return (
            <TextNode
              key={el.id}
              el={el}
              onSelect={() => setSelectedElement(el.id)}
              onEditStart={() => {
                setSelectedElement(el.id);
                setEditingElementId(el.id);
              }}
            />
          );
        })}

        {/* Moveable — hidden while editing */}
        {moveableTarget && selectedElementId && !editingElementId && (
          <Moveable
            target={moveableTarget}
            container={containerRef.current}
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
              if (lastEvent) updateElement(selectedElementId, { x: lastEvent.left, y: lastEvent.top });
            }}
            onResize={({ target, width, height, drag }) => {
              target.style.width  = `${width}px`;
              target.style.height = `${height}px`;
              target.style.left   = `${drag.left}px`;
              target.style.top    = `${drag.top}px`;
            }}
            onResizeEnd={({ lastEvent }) => {
              if (lastEvent) updateElement(selectedElementId, {
                width:  lastEvent.width,
                height: lastEvent.height,
                x:      lastEvent.drag.left,
                y:      lastEvent.drag.top,
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
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
