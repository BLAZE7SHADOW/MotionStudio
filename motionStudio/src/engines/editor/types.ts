export type ActiveTool = 'select' | 'text' | 'shape' | 'hand';

export interface EditorState {
  selectedElementId: string | null;
  currentFrame: number;
  isPlaying: boolean;
  zoom: number;
  activeTool: ActiveTool;
}
