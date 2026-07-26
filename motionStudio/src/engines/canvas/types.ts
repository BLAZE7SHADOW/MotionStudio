export type { CanvasElement, TextElement, ImageElement, VideoElement, AudioElement, ShaderElement, BaseElement, ShaderPreset, BlockElement, BlockPreset } from '../project/types';

export type AddTextInput = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
};
