import type { CanvasElement } from '@/engines/project';
import type { TemplateDefinition, TemplateCategory } from './types';
import { TEMPLATES } from './definitions';

export { TEMPLATES };
export type { TemplateDefinition, TemplateCategory, TemplateElement } from './types';

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  announce: 'Announce',
  hook: 'Hooks',
  offer: 'Offers',
  basic: 'Basics',
};

/** Display order for the picker — Basics last, since Blank lives beside them. */
export const CATEGORY_ORDER: TemplateCategory[] = ['announce', 'hook', 'offer', 'basic'];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Total composition length in frames for a template. */
export function templateDurationInFrames(template: TemplateDefinition): number {
  return Math.round(template.durationInSeconds * template.fps);
}

/**
 * Turn a template's authored elements into real canvas elements by minting a
 * fresh id for each. Ids live here rather than in the definitions so the same
 * template can be instantiated repeatedly without two projects sharing ids.
 */
export function instantiateTemplate(template: TemplateDefinition): CanvasElement[] {
  return template.elements.map(
    (el) => ({ ...el, id: crypto.randomUUID() }) as CanvasElement,
  );
}
