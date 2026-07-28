import { useEffect, useState } from 'react';
import { Plus, X, ChevronLeft, Sparkle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Project } from '@/engines/project';
import {
  useProjectStore, sceneLabel, scenesOf, sceneOffsets,
  gridActive, barFrames, snapFrameToBeat, MIN_SCENE_FRAMES, MAX_PROJECT_SECONDS,
  TRANSITIONS,
} from '@/engines/project';
import { useEditorStore } from '@/engines/editor';

/** New shots are two seconds — long enough to see, short enough for a cut. */
const NEW_SHOT_SECONDS = 2;

/**
 * The breadcrumb across the top of the timeline: which shot you are in, and
 * how to get to the others.
 *
 * A video is a sequence of moments, and until now the timeline could only say
 * "here are 16 elements". This is the control that makes the sequence itself
 * editable — and the only place `+ Add shot` lives, so it is also how anyone
 * discovers shots exist at all.
 */
export default function ShotStrip({ project }: { project: Project }) {
  const scenes = scenesOf(project);
  const activeSceneId = useEditorStore((s) => s.activeSceneId);
  const setActiveScene = useEditorStore((s) => s.setActiveScene);
  const setCurrentFrame = useEditorStore((s) => s.setCurrentFrame);
  const addShot = useProjectStore((s) => s.addShot);
  const removeShot = useProjectStore((s) => s.removeShot);
  const renameShot = useProjectStore((s) => s.renameShot);
  const setShotTransition = useProjectStore((s) => s.setShotTransition);

  const [renaming, setRenaming] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);

  // The refusal is transient — it explains one click, then gets out of the way.
  useEffect(() => {
    if (!refused) return;
    const t = setTimeout(() => setRefused(false), 4000);
    return () => clearTimeout(t);
  }, [refused]);

  const offsets = sceneOffsets(scenes);
  const activeShot = scenes.find((s) => s.id === activeSceneId);

  function open(sceneId: string) {
    setActiveScene(sceneId);
    // Land the playhead on the shot you just opened, so the canvas shows what
    // the timeline is now talking about.
    setCurrentFrame(offsets.get(sceneId) ?? 0);
  }

  /**
   * How long a new shot should be.
   *
   * With a grid, one bar — musically the unit a cut belongs to, and close to
   * the flat default anyway. The length is then adjusted so the shot *ends* on
   * a beat: successive shots then line up with the music even when the very
   * first boundary doesn't, which it usually won't on a project that existed
   * before the track did.
   */
  function newShotFrames() {
    const grid = project.beatGrid;
    if (!gridActive(grid)) return Math.round(NEW_SHOT_SECONDS * project.fps);
    const end = project.durationInFrames + barFrames(grid, project.fps);
    return Math.max(MIN_SCENE_FRAMES, snapFrameToBeat(grid, project.fps, end) - project.durationInFrames);
  }

  function handleAdd() {
    const before = scenesOf(project).length;
    addShot(project.id, newShotFrames());
    // `addShot` is a no-op past the cap. Comparing counts is how we tell that
    // apart from a successful add without duplicating the cap logic here.
    const added = useProjectStore.getState().getProject(project.id);
    const next = scenesOf(added ?? project);
    if (next.length === before) {
      setRefused(true);
      return;
    }
    open(next[next.length - 1].id);
  }

  return (
    <div data-tour="shots" className="h-9 shrink-0 border-b border-studio-border flex items-center gap-1 px-2 overflow-x-auto">
      <button
        type="button"
        onClick={() => setActiveScene(null)}
        title="Show the whole sequence"
        className={[
          'shrink-0 h-6 pl-1 pr-2 flex items-center gap-0.5 rounded-studio-sm text-[11px] font-medium uppercase tracking-wider transition-colors duration-120',
          activeSceneId === null
            ? 'text-studio-text'
            : 'text-studio-text-faint hover:text-studio-text hover:bg-studio-surface',
        ].join(' ')}
      >
        <ChevronLeft className="w-3 h-3" />
        Sequence
      </button>

      <span className="shrink-0 w-px h-3.5 bg-studio-border-strong mx-1" />

      {scenes.map((scene, i) => {
        const active = scene.id === activeSceneId;
        return (
          <div key={scene.id} className="group relative shrink-0">
            {renaming === scene.id ? (
              <input
                autoFocus
                defaultValue={scene.name ?? ''}
                placeholder={`Shot ${i + 1}`}
                onBlur={(e) => { renameShot(project.id, scene.id, e.target.value); setRenaming(null); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setRenaming(null);
                }}
                className="h-6 w-28 px-2 text-[11px] rounded-studio-sm bg-studio-surface border border-studio-accent-border text-studio-text outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => open(scene.id)}
                onDoubleClick={() => setRenaming(scene.id)}
                title={`${sceneLabel(scenes, scene.id)} — double-click to rename`}
                className={[
                  'h-6 pl-2.5 flex items-center rounded-studio-sm text-[11px] font-medium transition-colors duration-120',
                  scenes.length > 1 ? 'pr-6' : 'pr-2.5',
                  // Accent marks the shot you are in — live state, which is one
                  // of the two things the accent is allowed to mean.
                  active
                    ? 'bg-studio-accent text-white'
                    : 'bg-studio-surface text-studio-text-muted hover:text-studio-text',
                ].join(' ')}
              >
                {sceneLabel(scenes, scene.id)}
              </button>
            )}

            {/* Deleting takes the shot's elements with it, so it stays hidden
                until hover and never appears on the last remaining shot. */}
            {scenes.length > 1 && renaming !== scene.id && (
              <button
                type="button"
                onClick={() => {
                  removeShot(project.id, scene.id);
                  if (active) setActiveScene(null);
                }}
                title={`Delete ${sceneLabel(scenes, scene.id)} and everything in it`}
                className={[
                  'absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-studio-xs opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-120',
                  active ? 'text-white/70 hover:text-white' : 'text-studio-text-faint hover:text-red-400',
                ].join(' ')}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}

      {/* How the open shot arrives. Placed here rather than on the sequence
          block because a block can be 44px wide, and because the transition
          belongs to the shot you are working in. The first shot has no incoming
          cut, so it gets no control. */}
      {activeShot && scenes[0]?.id !== activeShot.id && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title={`How ${sceneLabel(scenes, activeShot.id)} arrives`}
              className={[
                'shrink-0 h-6 pl-1.5 pr-2.5 flex items-center gap-1 rounded-studio-sm text-[11px] font-medium transition-colors duration-120',
                activeShot.transition
                  ? 'text-studio-accent hover:bg-studio-surface'
                  : 'text-studio-text-faint hover:text-studio-text hover:bg-studio-surface',
              ].join(' ')}
            >
              <Sparkle className="w-3 h-3" />
              {TRANSITIONS.find((t) => t.id === (activeShot.transition ?? 'cut'))?.label}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-56 p-1.5 bg-studio-panel border-studio-border-strong rounded-studio-lg"
          >
            {TRANSITIONS.map((t) => {
              const on = (activeShot.transition ?? 'cut') === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setShotTransition(project.id, activeShot.id, t.id)}
                  className={[
                    'w-full text-left px-2.5 py-2 rounded-studio-md transition-colors duration-120',
                    on ? 'bg-studio-accent-subtle' : 'hover:bg-studio-surface',
                  ].join(' ')}
                >
                  <span className={`block text-[12px] font-medium ${on ? 'text-studio-accent' : 'text-studio-text'}`}>
                    {t.label}
                  </span>
                  <span className="block text-[10px] text-studio-text-faint leading-snug mt-0.5">
                    {t.hint}
                  </span>
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      )}

      <button
        type="button"
        onClick={handleAdd}
        title="Add a shot to the end"
        className="shrink-0 h-6 pl-1.5 pr-2.5 flex items-center gap-1 rounded-studio-sm text-[11px] font-medium text-studio-text-muted hover:text-studio-text hover:bg-studio-surface transition-colors duration-120"
      >
        <Plus className="w-3 h-3" />
        Add shot
      </button>

      {refused && (
        <span role="status" className="shrink-0 ml-1 text-[11px] text-amber-300">
          A video can't be longer than {MAX_PROJECT_SECONDS}s — shorten a shot first.
        </span>
      )}
    </div>
  );
}
