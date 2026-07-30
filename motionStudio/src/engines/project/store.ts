import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, CreateProjectInput } from './types';
import { DEFAULT_DURATION_SECONDS } from './dimensions';
import { hasReadOnly, isReadOnly } from '@/lib/projectLock';
import {
  addScene,
  removeScene,
  reorderScene,
  setSceneDuration,
  setTotalDuration,
  rescaleForFps,
  setSceneTransition,
} from './scenes';
import { migrateProject } from './migrations';
import type { TransitionId } from '../animation/transitions';
import { getCompositionDimensions } from './dimensions';

export type UpdateProjectInput = Partial<Pick<Project, 'name' | 'aspectRatio' | 'fps' | 'durationInFrames' | 'assets' | 'canvas' | 'scenes' | 'beatGrid'>>;

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  /** undo/redo stacks — snapshots of the whole projects array (not persisted) */
  past: Project[][];
  future: Project[][];
  setActiveProjectId: (id: string | null) => void;
  createProject: (input: CreateProjectInput) => Project;
  getProject: (id: string) => Project | undefined;
  updateProject: (id: string, updates: UpdateProjectInput, opts?: { history?: boolean }) => void;
  /** Replace the entire projects list — used when loading from cloud. Clears history. */
  setProjects: (projects: Project[]) => void;
  /** Remove one project from local state. Cloud row + asset bytes are the caller's job. */
  deleteProject: (id: string) => void;
  /* ── shots ──
     Thin wrappers over the pure functions in `scenes.ts`. They route through
     `updateProject`, so undo/redo and the read-only tab lock apply to shot
     edits without either having to know shots exist. */
  addShot: (projectId: string, durationInFrames: number) => void;
  removeShot: (projectId: string, sceneId: string) => void;
  resizeShot: (projectId: string, sceneId: string, durationInFrames: number) => void;
  moveShot: (projectId: string, sceneId: string, toIndex: number) => void;
  renameShot: (projectId: string, sceneId: string, name: string) => void;
  /** Changes total length, absorbing the difference into the last shot. */
  setProjectDuration: (projectId: string, durationInFrames: number) => void;
  /** Changes frame rate, rescaling shots and elements so nothing changes length. */
  setProjectFps: (projectId: string, fps: number) => void;
  /** How a shot arrives — materialised as animations on its elements. */
  setShotTransition: (projectId: string, sceneId: string, id: TransitionId) => void;
  undo: () => void;
  redo: () => void;
  /** Wipe all projects + history. Called on account switch to prevent data bleed. */
  clearAll: () => void;
}

const HISTORY_LIMIT = 50;
const COALESCE_MS = 500; // rapid edits within this window become one undo step
let lastEditAt = 0;

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      past: [],
      future: [],

      setActiveProjectId: (id) => set({ activeProjectId: id }),

      createProject: (input) => {
        const now = Date.now();
        // elements/durationInFrames are template-only — pulled out of the spread
        // so they don't land on the Project as stray top-level fields.
        const { elements, durationInFrames, ...rest } = input;
        // `ensureScenes` mints the first shot and stamps every template element
        // with its id, so templates stay authored flat and shot-unaware.
        const project: Project = migrateProject({
          id: crypto.randomUUID(),
          ...rest,
          durationInFrames: durationInFrames ?? Math.round(input.fps * DEFAULT_DURATION_SECONDS),
          assets: [],
          canvas: { elements: elements ?? [] },
          createdAt: now,
          updatedAt: now,
        });
        // creation isn't part of editor undo history
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },

      getProject: (id) => get().projects.find((p) => p.id === id),

      /* Every element mutation in the editor funnels through here, which is
         why the read-only guard lives at this one point rather than being
         spread across the panels. A tab that lost its lock must not write —
         both persistence paths serialise the whole projects array, so one
         stale write clobbers the tab that actually holds the lock. */
      updateProject: (id, updates, opts) =>
        set((state) => {
          if (isReadOnly(id)) return {};
          const now = Date.now();
          const newProjects = state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: now } : p,
          );

          const record = opts?.history !== false;
          // first edit after a quiet gap → checkpoint the pre-edit state
          const newGesture = record && now - lastEditAt > COALESCE_MS;
          if (record) lastEditAt = now;

          return {
            projects: newProjects,
            past: newGesture ? [...state.past, state.projects].slice(-HISTORY_LIMIT) : state.past,
            future: newGesture ? [] : state.future,
          };
        }),

      /* The cloud load path bypasses `persist`, so it needs the migration too —
         and this is the path that actually needs a *versioned* one, because a
         project pulled from Supabase carries no store envelope. Projects from a
         newer build come back untouched; `App.tsx` refuses to autosave those,
         so an older tab can't write its misreading over the newer copy. */
      setProjects: (projects) =>
        set({ projects: projects.map(migrateProject), past: [], future: [] }),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),

      /* Shot operations. Each reads the current project, applies the pure
         function, and writes the result back through `updateProject` — one
         path in, so history, the lock and autosave all keep working. */
      addShot: (projectId, durationInFrames) => {
        const p = get().getProject(projectId);
        if (!p) return;
        const next = addScene(p, durationInFrames, p.fps);
        // Unchanged means the 90s cap refused it; don't record an undo step
        // for something that did nothing.
        if (next === p) return;
        /* `canvas` matters here even though adding a shot moves nothing:
           video-wide elements are re-spanned over the new total, and leaving it
           out silently dropped that. A soundtrack stayed the length of the
           video as it was when the track was added and stopped partway through
           every shot added afterwards. */
        get().updateProject(projectId, {
          scenes: next.scenes,
          durationInFrames: next.durationInFrames,
          canvas: next.canvas,
        });
      },

      removeShot: (projectId, sceneId) => {
        const p = get().getProject(projectId);
        if (!p) return;
        const next = removeScene(p, sceneId);
        if (next === p) return;
        get().updateProject(projectId, {
          scenes: next.scenes,
          durationInFrames: next.durationInFrames,
          canvas: next.canvas,
        });
      },

      resizeShot: (projectId, sceneId, durationInFrames) => {
        const p = get().getProject(projectId);
        if (!p) return;
        const next = setSceneDuration(p, sceneId, durationInFrames, p.fps);
        if (next === p) return;
        get().updateProject(projectId, {
          scenes: next.scenes,
          durationInFrames: next.durationInFrames,
          canvas: next.canvas,
        });
      },

      moveShot: (projectId, sceneId, toIndex) => {
        const p = get().getProject(projectId);
        if (!p) return;
        const next = reorderScene(p, sceneId, toIndex);
        if (next === p) return;
        get().updateProject(projectId, { scenes: next.scenes, canvas: next.canvas });
      },

      renameShot: (projectId, sceneId, name) => {
        const p = get().getProject(projectId);
        if (!p?.scenes) return;
        const trimmed = name.trim();
        get().updateProject(projectId, {
          // Empty clears the override, so the label falls back to "Shot N"
          // rather than rendering as blank.
          scenes: p.scenes.map((s) =>
            s.id === sceneId ? { ...s, name: trimmed || undefined } : s,
          ),
        });
      },

      setProjectDuration: (projectId, durationInFrames) => {
        const p = get().getProject(projectId);
        if (!p) return;
        const next = setTotalDuration(p, durationInFrames, p.fps);
        if (next === p) return;
        get().updateProject(projectId, {
          scenes: next.scenes,
          durationInFrames: next.durationInFrames,
          canvas: next.canvas,
        });
      },

      setShotTransition: (projectId, sceneId, id) => {
        const p = get().getProject(projectId);
        if (!p) return;
        // Travel distance scales with the format, so the whip needs the width.
        const { width } = getCompositionDimensions(p.aspectRatio);
        const next = setSceneTransition(p, sceneId, id, width);
        if (next === p) return;
        get().updateProject(projectId, { scenes: next.scenes, canvas: next.canvas });
      },

      setProjectFps: (projectId, fps) => {
        const p = get().getProject(projectId);
        if (!p) return;
        const next = rescaleForFps(p, fps);
        if (next === p) return;
        get().updateProject(projectId, {
          fps: next.fps,
          scenes: next.scenes,
          durationInFrames: next.durationInFrames,
          canvas: next.canvas,
        });
      },

      /* History snapshots the entire projects array, so an undo in a
         read-only tab would restore every project, not just the one it is
         looking at — the exact clobber the lock exists to prevent. */
      undo: () =>
        set((state) => {
          if (state.past.length === 0 || hasReadOnly()) return {};
          const previous = state.past[state.past.length - 1];
          lastEditAt = 0; // next edit starts a fresh gesture
          return {
            projects: previous,
            past: state.past.slice(0, -1),
            future: [state.projects, ...state.future].slice(0, HISTORY_LIMIT),
          };
        }),

      redo: () =>
        set((state) => {
          if (state.future.length === 0 || hasReadOnly()) return {};
          const next = state.future[0];
          lastEditAt = 0;
          return {
            projects: next,
            past: [...state.past, state.projects].slice(-HISTORY_LIMIT),
            future: state.future.slice(1),
          };
        }),

      clearAll: () => {
        lastEditAt = 0;
        set({ projects: [], activeProjectId: null, past: [], future: [] });
        // also clear IndexedDB so the empty state is persisted immediately
        useProjectStore.persist.clearStorage();
      },
    }),
    {
      name: 'motionstudio-projects',
      // persist only project data — not history or session UI state
      partialize: (s) => ({ projects: s.projects }),
      /* The envelope version, which is not the same thing as the project's own
         `schemaVersion`. This one only says "the persisted blob changed shape";
         the per-project one travels to the cloud and back. Both are needed, and
         the real work lives in `migrations.ts`. */
      version: 1,
      migrate: (persisted) => {
        const state = persisted as { projects?: Project[] } | undefined;
        if (!state?.projects) return state as never;
        return { ...state, projects: state.projects.map(migrateProject) } as never;
      },
    },
  ),
);


// "Good implementation. The undo/redo model is clean, coalescing is a nice touch, and 
// history isn't persisted, which is appropriate. As the project grows, consider moving 
// history to the project level instead of storing snapshots of the entire projects array."