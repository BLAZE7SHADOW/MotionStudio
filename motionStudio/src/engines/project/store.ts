import { create } from 'zustand';
import type { Project, CreateProjectInput } from './types';

export type UpdateProjectInput = Partial<Pick<Project, 'name' | 'aspectRatio' | 'fps'>>;

interface ProjectStore {
  projects: Project[];
  createProject: (input: CreateProjectInput) => Project;
  getProject: (id: string) => Project | undefined;
  updateProject: (id: string, updates: UpdateProjectInput) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],

  createProject: (input) => {
    const now = Date.now();
    const project: Project = {
      id: crypto.randomUUID(),
      ...input,
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
}));
