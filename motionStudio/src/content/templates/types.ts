import type { AspectRatio, CanvasElement } from '@/engines/project';

/**
 * `Omit<Union, K>` collapses a discriminated union to only its COMMON fields —
 * the same trap that bit `ElementPatch` in the canvas engine. Distributing over
 * the union first keeps every member's own fields (content, shader, assetId…).
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An element as authored in a template — ids are minted at instantiation. */
export type TemplateElement = DistributiveOmit<CanvasElement, 'id'>;

export type TemplateCategory = 'announce' | 'hook' | 'offer' | 'basic';

/**
 * A ready-made starting point: the element list a project begins with, instead
 * of a blank canvas.
 *
 * Templates deliberately use ONLY text and shader elements. Image/video/audio
 * elements reference an `assetId` whose bytes live in IndexedDB (and S3), which
 * a template can't ship — so a media-bearing template would apply as a broken
 * canvas. Text + the 18 shaders render instantly with nothing to upload.
 */
export interface TemplateDefinition {
  /** Stable — used as the analytics id, so don't rename it after shipping. */
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  aspectRatio: AspectRatio;
  fps: number;
  durationInSeconds: number;
  elements: TemplateElement[];
}
