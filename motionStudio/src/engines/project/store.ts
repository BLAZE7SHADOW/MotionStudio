import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, CreateProjectInput } from './types';
import { DEFAULT_DURATION_SECONDS } from './dimensions';

export type UpdateProjectInput = Partial<Pick<Project, 'name' | 'aspectRatio' | 'fps' | 'durationInFrames' | 'assets' | 'canvas'>>;

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (input: CreateProjectInput) => Project;
  getProject: (id: string) => Project | undefined;
  updateProject: (id: string, updates: UpdateProjectInput) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      setActiveProjectId: (id) => set({ activeProjectId: id }),

      createProject: (input) => {
        const now = Date.now();
        const project: Project = {
          id: crypto.randomUUID(),
          ...input,
          durationInFrames: Math.round(input.fps * DEFAULT_DURATION_SECONDS),
          assets: [],
          canvas: { elements: [] },
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },

      getProject: (id) => get().projects.find((p) => p.id === id),

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },
    }),
    {
      name: 'motionstudio-projects',
      // persist only data (not activeProjectId — that's session UI state)
      partialize: (s) => ({ projects: s.projects }),
    },
  ),
);
