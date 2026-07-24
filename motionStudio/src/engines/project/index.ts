export { useProjectStore } from './store';
export { getCompositionDimensions, DEFAULT_DURATION_SECONDS } from './dimensions';
export type { CompositionDimensions } from './dimensions';
export type {
  Project, AspectRatio, CreateProjectInput, CanvasElement, TextElement, ImageElement, VideoElement, AudioElement, ShaderElement, BaseElement,
  Animation, AnimationProperty, AnimationEasing,
  Asset, AssetType,
  TextEffect, ShaderPreset,
} from './types';
export { TEXT_EFFECTS, SHADER_PRESETS } from './types';
export type { UpdateProjectInput } from './store';
export { saveProject, loadProjects, deleteCloudProject } from './cloudSync';
export { deleteProjectCompletely } from './deleteProject';
