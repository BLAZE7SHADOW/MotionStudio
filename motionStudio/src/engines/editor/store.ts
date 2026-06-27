import { create } from 'zustand';
import type { EditorState, ActiveTool } from './types';

const defaultState: EditorState = {
  selectedElementId: null,
  currentFrame: 0,
  isPlaying: false,
  zoom: 1,
  activeTool: 'select',
};

interface EditorStore extends EditorState {
  setSelectedElement: (id: string | null) => void;
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: ActiveTool) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  ...defaultState,

  setSelectedElement: (id) => set({ selectedElementId: id }),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setZoom: (zoom) => set({ zoom }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  reset: () => set(defaultState),
}));
