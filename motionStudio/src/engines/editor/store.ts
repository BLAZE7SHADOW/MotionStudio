import { create } from 'zustand';
import type { EditorState, ActiveTool } from './types';

const defaultState: EditorState = {
  selectedElementId: null,
  currentFrame: 0,
  isPlaying: false,
  zoom: 1,
  activeTool: 'select',
  activeSceneId: null,
};

interface EditorStore extends EditorState {
  setSelectedElement: (id: string | null) => void;
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: ActiveTool) => void;
  /** null shows the sequence overview; an id drills into that shot. */
  setActiveScene: (sceneId: string | null) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  ...defaultState,

  setSelectedElement: (id) => set({ selectedElementId: id }),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),

  /* Starting playback clears the selection, and that rule lives here rather
     than in the canvas.

     The reason is a rendering one: a selected element is drawn in its *base*
     pose — keyframes and text effect stripped — so it stays visible and lined
     up with the drag handles while you position it. During playback that would
     mean one element sitting still in a moving composition, which reads as a
     broken effect rather than a paused one.

     It used to be an effect in `CanvasPanel` watching `isPlaying`, which cost a
     second render on every play and, worse, only held while that component was
     mounted. As an invariant of the store it holds for every caller — the
     toolbar, the timeline transport, and the Player's own `ended` handler —
     and no future one has to remember to pair the two calls. */
  setIsPlaying: (playing) =>
    set(playing ? { isPlaying: true, selectedElementId: null } : { isPlaying: false }),
  setZoom: (zoom) => set({ zoom }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveScene: (sceneId) => set({ activeSceneId: sceneId }),
  reset: () => set(defaultState),
}));
