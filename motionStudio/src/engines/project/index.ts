export { useProjectStore } from './store';
export { getCompositionDimensions, DEFAULT_DURATION_SECONDS } from './dimensions';
export type { CompositionDimensions } from './dimensions';
export type {
  Project, AspectRatio, CreateProjectInput, CanvasElement, TextElement, ImageElement, VideoElement, AudioElement, ShaderElement, BaseElement,
  Animation, AnimationProperty, AnimationEasing,
  Asset, AssetType,
  TextEffect, ShaderPreset, BlockElement, BlockPreset, BlockProps,
} from './types';
export {
  TEXT_EFFECTS, SHADER_PRESETS, BLOCK_PRESETS,
  LIST_TEXT_EFFECTS, TWO_VALUE_TEXT_EFFECTS, NUMBER_TEXT_EFFECTS,
  isTwoValueEffect, isListEffect, isNumberEffect, parseEffectNumber,
} from './types';
export type { Scene, BeatGrid } from './types';
export {
  sceneOffsets, sceneSpan, sceneAtFrame, sceneLabel, scenesOf, elementsInScene,
  ensureScenes, spansAllShots, ALL_SHOTS, MIN_SCENE_FRAMES, MAX_PROJECT_SECONDS,
  gridActive, snapFrameToBeat, barFrames, framesInBeats, setSceneTransition,
} from './scenes';
export { TRANSITIONS, buildTransition, transitionFrames } from '../animation/transitions';
export type { TransitionId } from '../animation/transitions';
export type { UpdateProjectInput } from './store';
export { detectBeat, beatTimeSec, beatIndexAt, nearestBeatSec, beatPeriodSec, BEATS_PER_BAR } from '../audio/beatDetect';
export type { BeatAnalysis } from '../audio/beatDetect';
export { saveProject, loadProjects, deleteCloudProject } from './cloudSync';
export { deleteProjectCompletely } from './deleteProject';
