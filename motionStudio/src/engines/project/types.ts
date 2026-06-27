export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  fps: number;
  createdAt: number;
  updatedAt: number;
}

export type CreateProjectInput = Pick<Project, 'name' | 'aspectRatio' | 'fps'>;
