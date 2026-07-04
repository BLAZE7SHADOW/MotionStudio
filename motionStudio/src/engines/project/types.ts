export type AspectRatio = '16:9' | '9:16' | '1:1';

/* ── Canvas element types ── */

export type BaseElement = {
  id: string;
  type: string;
  /* geometry — stored in composition space (e.g. 1920×1080) */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  /* temporal — Remotion <Sequence> model */
  startFrame: number;
  durationInFrames: number;
};

export type TextElement = BaseElement & {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
};

export type CanvasElement = TextElement;

/* ── Project ── */

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  fps: number;
  durationInFrames: number;
  createdAt: number;
  updatedAt: number;
  canvas: {
    elements: CanvasElement[];
  };
}

export type CreateProjectInput = Pick<Project, 'name' | 'aspectRatio' | 'fps'>;
