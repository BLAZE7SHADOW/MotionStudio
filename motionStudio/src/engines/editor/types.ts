export type ActiveTool = 'select' | 'text' | 'shape' | 'hand';

export interface EditorState {
  selectedElementId: string | null;
  currentFrame: number;
  isPlaying: boolean;
  zoom: number;
  activeTool: ActiveTool;
  /**
   * Which shot the timeline is scoped to, or null for the sequence overview.
   *
   * Session state, not project state: which shot you were last looking at is
   * not a property of the video, and persisting it would mean two tabs
   * fighting over it.
   */
  activeSceneId: string | null;
}
