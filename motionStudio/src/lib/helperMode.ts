import { create } from 'zustand';

/**
 * Whether helper mode is switched on.
 *
 * Split from the hover-and-render lifecycle in `hooks/useHelperLayer.ts` /
 * `tour/HelperCard.tsx` for the same reason `notices.ts` is split from
 * `noticeStore.ts`: this is a boolean and a storage key, the other two touch
 * the DOM and render, and the toolbar button only needs the boolean.
 *
 * **Default on.** Helper mode never blocks a click and never covers a control
 * — a card only ever appears while the cursor rests on the one thing it
 * describes — so leaving it on costs a first-time user nothing, and a mode
 * nobody discovers is a mode that doesn't exist. Only "off" is written to
 * storage: absence means on, so a cleared profile gets the helpful default
 * rather than the quiet one.
 */

const KEY = 'ms_helper_mode';

function readStored(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true; // private mode — fail towards explaining things
  }
}

interface HelperModeStore {
  on: boolean;
  setOn: (on: boolean) => void;
}

export const useHelperMode = create<HelperModeStore>((set) => ({
  on: readStored(),
  setOn: (on) => {
    try {
      localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      // storage unavailable; the choice just won't survive a reload
    }
    set({ on });
  },
}));
