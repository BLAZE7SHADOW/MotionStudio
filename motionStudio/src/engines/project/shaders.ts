import type { Project, ShaderPreset } from './types';

/**
 * Every distinct shader a set of projects uses.
 *
 * Used to warm those chunks ahead of time. Deriving it from the projects
 * themselves keeps the cost strictly bounded: this can never fetch more than
 * the thumbnails would fetch anyway as their cards mount — it only moves the
 * work earlier, so scrolling to an off-screen project doesn't stall.
 */
export function projectShaderPresets(projects: Project[]): ShaderPreset[] {
  const presets = new Set<ShaderPreset>();
  for (const project of projects) {
    for (const el of project.canvas.elements) {
      if (el.type === 'shader') presets.add(el.shader);
    }
  }
  return [...presets];
}
