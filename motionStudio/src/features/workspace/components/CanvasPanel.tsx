import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Type, Sparkles, EyeOff, Maximize, Volume2, VolumeX } from 'lucide-react';
import Moveable from 'react-moveable';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { getCompositionDimensions } from '@/engines/project';
import type { Project } from '@/engines/project';
import { useCanvasEngine } from '@/engines/canvas';
import { useEditorStore } from '@/engines/editor';
import { textElementStyle, elementBoxStyle, MotionComposition } from '@/engines/rendering';
import type { TextElement } from '@/engines/canvas';
import { track } from '@/lib/analytics';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 10%) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

const PAD = 20;
const ACCENT = 'oklch(0.627 0.265 298.232)';

interface CanvasPanelProps {
  /** The project itself, not its id.
   *
   *  This used to take a `projectId` and look the project back up from the
   *  store — even though its only caller already holds the project and passes
   *  it whole to both sibling panels. The lookup returns `Project | undefined`,
   *  which forced a `if (!project) return null` guard, and six hooks sat below
   *  that guard: on the render where the project went missing React would have
   *  been handed fewer hooks than the render before, which throws. Taking the
   *  project as a prop deletes the nullable, the guard and the bug together,
   *  and makes this panel consistent with `Toolbar` and `TimelinePanel`. */
  project: Project;
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

export default function CanvasPanel({ project }: CanvasPanelProps) {
  const { elements, updateElement, removeElement, addImage, addVideo, addAudio, addText, addShader } = useCanvasEngine();
  const selectedElementId  = useEditorStore((s) => s.selectedElementId);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const isPlaying          = useEditorStore((s) => s.isPlaying);
  const setIsPlaying       = useEditorStore((s) => s.setIsPlaying);
  const currentFrame       = useEditorStore((s) => s.currentFrame);
  const setCurrentFrame    = useEditorStore((s) => s.setCurrentFrame);

  const areaRef        = useRef<HTMLDivElement>(null);
  const playerRef      = useRef<PlayerRef>(null);
  /* The stage is state rather than a ref because Moveable takes it as a
     `container` *prop* — reading `stageRef.current` during render is reading a
     value React has not promised is current yet, and on the first render it is
     still null, so Moveable would mount against the document instead of the
     stage. A callback ref re-renders once when the node exists, which is
     exactly when the value becomes true. */
  const [stage, setStage]                       = useState<HTMLDivElement | null>(null);
  const [area, setArea]                         = useState({ w: 0, h: 0 });
  /* The overlay div Moveable attaches its handles to.
     Set by a callback ref on the node itself rather than by an effect that
     queried the DOM for `[data-element-id="…"]`. The node is rendered by this
     very component, so searching for it was asking the browser a question we
     already knew the answer to — and the effect had to re-run on `elements` and
     `currentFrame` to catch the element scrolling out of its own clip, each run
     costing a second render. A ref is called exactly when the node appears and
     with `null` exactly when it goes, which covers every one of those cases
     without listing them. */
  const [moveableTarget,   setMoveableTarget]   = useState<HTMLElement | null>(null);
  const [editingId, setEditingId]               = useState<string | null>(null);
  const [dragOver, setDragOver]                 = useState(false);

  /* Text editing only ever applies to the *selected* element — double-clicking
     sets both — so "is something being edited?" is a question about the current
     selection, not a second piece of state to keep in step with it.

     Deriving it replaces two effects that used to call setState: one clearing
     the id whenever the selection changed, one clearing it on playback. Both
     cost a second render, and both left a window in which the id pointed at an
     element that was no longer selected. Playback is covered for free, because
     entering it clears the selection in the editor store. */
  const editingElementId = editingId === selectedElementId ? editingId : null;

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

  /* ── playback: the Player IS the clock ──
     play  → seek (restarting from 0 if the playhead is at the end) and play();
             'frameupdate' drives the timeline playhead, 'ended' stops playback.
             One clock — a separate rAF clock advancing currentFrame in parallel
             would race the Player and desync the playhead from the pixels.
     pause → freeze; scrubbing seeks the paused Player frame-exactly. */
  const totalFrames = project.durationInFrames;
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    if (!isPlaying) {
      p.pause();
      return;
    }

    const cur = useEditorStore.getState().currentFrame;
    p.seekTo(cur >= totalFrames - 1 ? 0 : cur);
    p.play();

    const onFrame = (e: { detail: { frame: number } }) => setCurrentFrame(e.detail.frame);
    const onEnded = () => setIsPlaying(false);
    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('ended', onEnded);
    return () => {
      p.removeEventListener('frameupdate', onFrame);
      p.removeEventListener('ended', onEnded);
    };
  }, [isPlaying, totalFrames, setCurrentFrame, setIsPlaying]);

  useEffect(() => {
    if (!isPlaying) playerRef.current?.seekTo(currentFrame);
  }, [currentFrame, isPlaying]);

  /* ── keyboard: Delete / Escape ──
     Listed in `features/workspace/shortcuts.ts`, which the help menu renders.
     Change a binding here, change the row there. */
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

  /* what the Player renders:
     - selected element → base pose (keyframes AND text effect stripped) so it is
       always visible and aligned with the moveable box while you work on it —
       entrance effects start at opacity 0, which would hide the text at frame 0
     - element being text-edited → hidden (the contenteditable overlay replaces it)
     - everything else → frame-accurate WYSIWYG (scrubbing previews effects) */
  // Memoized: without this, a brand-new array/object is built on every render —
  // and during playback currentFrame changes every frame, so a fresh `inputProps`
  // reference would hit the Player 30+ times/sec. Player's readiness/buffering
  // state (and any component gating on delayRender, like the WebGL shaders) can
  // get reset by that churn, so we only rebuild when the actual inputs change.
  const playerElements = useMemo(
    () =>
      elements
        .filter((el) => el.id !== editingElementId)
        .map((el) =>
          el.id === selectedElementId && !isPlaying
            ? { ...el, animations: undefined, ...(el.type === 'text' ? { textEffect: undefined } : null) }
            : el
        ),
    [elements, editingElementId, selectedElementId, isPlaying]
  );
  const inputProps = useMemo(
    () => ({ elements: playerElements, assets: project.assets }),
    [playerElements, project.assets]
  );

  /* Audio only exists if something can produce it — an audio clip, or a video
     whose track plays through the same Player. No point offering a mute
     control on a composition that's silent by construction. */
  const hasSound = useMemo(
    () => elements.some((el) => el.type === 'audio' || el.type === 'video'),
    [elements],
  );
  const [muted, setMuted] = useState(false);
  const toggleMuted = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const next = !p.isMuted();
    if (next) p.mute();
    else p.unmute();
    setMuted(next);
  }, []);

  /* Whether the selection is currently being shown WITHOUT motion it actually
     has — the condition the on-canvas notice explains. Kept separate from the
     memo above so adding it can't change that memo's identity, which would
     churn the Player every frame during playback. */
  const motionHiddenOnSelection = useMemo(() => {
    if (isPlaying || !selectedElementId || editingElementId) return false;
    const el = elements.find((e) => e.id === selectedElementId);
    if (!el) return false;
    return (el.animations?.length ?? 0) > 0 || (el.type === 'text' && !!el.textEffect);
  }, [elements, selectedElementId, editingElementId, isPlaying]);

  /* drop an asset from the panel → place it where it lands (in composition space) */
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const assetId = e.dataTransfer.getData('application/x-motionstudio-asset');
    if (!assetId || !stage) return;
    const asset = project.assets.find((a) => a.id === assetId);
    if (!asset) return;

    const rect = stage.getBoundingClientRect();
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
            ref={setStage}
            onClick={() => {
              if (isPlaying) return;
              setEditingId(null);
              setSelectedElement(null);
            }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            // `isolate` is load-bearing: react-moveable gives its control box
            // `z-index: 3000`, and Moveable renders into this container. Without
            // a stacking context here that 3000 competes at the document root
            // and paints the selection handles *over* modals, which sit at
            // z-50. Isolating confines it to the stage.
            className="relative isolate"
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
              inputProps={inputProps}
              durationInFrames={Math.max(1, project.durationInFrames)}
              fps={project.fps}
              compositionWidth={compW}
              compositionHeight={compH}
              // width/height MUST be explicit: without them the Player sizes
              // itself at full composition resolution (1920×1080) and scale=1
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              controls={false}
              loop={false}
              clickToPlay={false}
              doubleClickToFullscreen={false}
              // Enabled so the fullscreen control below can call requestFullscreen();
              // double-click stays off because it's how you edit text.
              allowFullscreen
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

            {/* The selected element is drawn in its base pose — see the
                playerElements memo. That's necessary (an entrance effect
                starts at opacity 0, so the thing you're trying to drag would
                be invisible), but silently showing a static element makes a
                working effect look broken. Say so instead. */}
            {motionHiddenOnSelection && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-sm">
                  <EyeOff className="w-3 h-3 text-white/60" />
                  <span className="text-[11px] text-white/80 select-none">
                    Motion paused while selected — press Preview to see it
                  </span>
                </div>
              </div>
            )}

            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Only this inner card captures clicks — the rest of the
                    empty stage stays click-through so drag-and-drop onto an
                    empty canvas keeps working. */}
                <div className="flex flex-col items-center gap-4 pointer-events-auto">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] text-white/25 font-mono select-none tracking-widest">
                      {project.aspectRatio} · {project.fps} fps
                    </span>
                    <p className="text-[13px] text-white/50 select-none">
                      Nothing here yet — add your first element
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        track.editorTextAdded();
                        const el = addText();
                        if (el) setSelectedElement(el.id);
                      }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-studio-md bg-white/10 border border-white/15 text-[12px] font-medium text-white/80 hover:bg-white/15 hover:text-white transition-colors duration-120"
                    >
                      <Type className="w-3.5 h-3.5" />
                      Add Text
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        track.editorShaderAdded({ shader: 'shader-mesh-gradient' });
                        const el = addShader('shader-mesh-gradient');
                        if (el) setSelectedElement(el.id);
                      }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-studio-md bg-white/10 border border-white/15 text-[12px] font-medium text-white/80 hover:bg-white/15 hover:text-white transition-colors duration-120"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Add Background
                    </button>
                  </div>
                  <p className="text-[10px] text-white/30 select-none">
                    or drag media in from the left panel
                  </p>
                </div>
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
                    onDone={() => setEditingId(null)}
                  />
                );
              }
              return (
                <div
                  key={el.id}
                  data-element-id={el.id}
                  // Only the selected element's box needs to be findable, and
                  // this is the moment it is known to exist.
                  ref={el.id === selectedElementId ? setMoveableTarget : undefined}
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
                      setEditingId(el.id);
                    }
                  }}
                />
              );
            })}

            {/* Moveable — targets the transparent overlay div for the selected element */}
            {moveableTarget && selectedElementId && !editingElementId && !isPlaying && (
              <Moveable
                target={moveableTarget}
                container={stage}
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
                  // live-commit so the Player (the visible pixels) follows the drag;
                  // undo coalescing folds the whole gesture into one step
                  updateElement(selectedElementId, { x: left / scale, y: top / scale });
                }}
                onResize={({ target, width, height, drag }) => {
                  target.style.width  = `${width}px`;
                  target.style.height = `${height}px`;
                  target.style.left   = `${drag.left}px`;
                  target.style.top    = `${drag.top}px`;
                  updateElement(selectedElementId, {
                    width:  width  / scale,
                    height: height / scale,
                    x:      drag.left / scale,
                    y:      drag.top  / scale,
                  });
                }}
                onRotate={({ target, rotate }) => {
                  target.style.transform = `rotate(${rotate}deg)`;
                  updateElement(selectedElementId, { rotation: rotate });
                }}
              />
            )}
          </div>

          {/* Viewer controls + zoom readout */}
          <div className="flex items-center gap-1.5">
            {/* Only worth showing when there's something to hear. Video counts:
                its audio track plays through the same Player. */}
            {hasSound && (
              <button
                type="button"
                onClick={toggleMuted}
                title={muted ? 'Unmute' : 'Mute'}
                className="flex items-center justify-center w-6 h-6 rounded-studio-md bg-studio-surface/60 border border-studio-border backdrop-blur-sm text-studio-text-faint hover:text-studio-text hover:bg-studio-surface transition-colors duration-120"
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => playerRef.current?.requestFullscreen()}
              title="Fullscreen preview"
              className="flex items-center justify-center w-6 h-6 rounded-studio-md bg-studio-surface/60 border border-studio-border backdrop-blur-sm text-studio-text-faint hover:text-studio-text hover:bg-studio-surface transition-colors duration-120"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 px-2.5 h-6 rounded-studio-md bg-studio-surface/60 border border-studio-border backdrop-blur-sm pointer-events-none select-none">
              <span className="text-[11px] font-medium text-studio-text-faint tabular-nums">
                {Math.round(scale * 100)}%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
