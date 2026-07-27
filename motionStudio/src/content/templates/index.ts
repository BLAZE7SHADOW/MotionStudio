import type { CanvasElement, ShaderPreset } from '@/engines/project';
import type { TemplateDefinition, TemplateCategory } from './types';
import { TEMPLATES } from './definitions';

export { TEMPLATES };
export type { TemplateDefinition, TemplateCategory, TemplateElement } from './types';

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  announce: 'Announce',
  dev: 'Dev & Product',
  hook: 'Hooks',
  offer: 'Offers',
  basic: 'Basics',
};

/** Display order for the picker — Basics last, since Blank lives beside them. */
export const CATEGORY_ORDER: TemplateCategory[] = ['announce', 'dev', 'hook', 'offer', 'basic'];

/** Every distinct shader the template set uses — derived, not hardcoded. */
export function templateShaderPresets(): ShaderPreset[] {
  const presets = new Set<ShaderPreset>();
  for (const t of TEMPLATES) {
    for (const el of t.elements) {
      if (el.type === 'shader') presets.add(el.shader);
    }
  }
  return [...presets];
}

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
