import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, CreateProjectInput } from './types';
import { DEFAULT_DURATION_SECONDS } from './dimensions';

export type UpdateProjectInput = Partial<Pick<Project, 'name' | 'aspectRatio' | 'fps' | 'durationInFrames' | 'assets' | 'canvas'>>;

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
        const project: Project = {
          id: crypto.randomUUID(),
          ...rest,
          durationInFrames: durationInFrames ?? Math.round(input.fps * DEFAULT_DURATION_SECONDS),
          assets: [],
          canvas: { elements: elements ?? [] },
          createdAt: now,
          updatedAt: now,
        };
        // creation isn't part of editor undo history
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },

      getProject: (id) => get().projects.find((p) => p.id === id),

      updateProject: (id, updates, opts) =>
        set((state) => {
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

      setProjects: (projects) => set({ projects, past: [], future: [] }),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),

      undo: () =>
        set((state) => {
          if (state.past.length === 0) return {};
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
          if (state.future.length === 0) return {};
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
    },
  ),
);


// "Good implementation. The undo/redo model is clean, coalescing is a nice touch, and 
// history isn't persisted, which is appropriate. As the project grows, consider moving 
// history to the project level instead of storing snapshots of the entire projects array."