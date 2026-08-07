import { create } from 'zustand';

/**
 * Whether the helper dots are switched on.
 *
 * Split from the driver.js lifecycle in `features/workspace/tour/helperMode.ts`
 * for the same reason `notices.ts` is split from `noticeStore.ts`: this is a
 * boolean and a storage key, the other one loads a library and touches the DOM,
 * and the toolbar button only needs the boolean.
 *
 * **Default on.** The dots never block a click and never cover a control, so
 * leaving them on costs a first-time user nothing — and a mode nobody discovers
 * is a mode that doesn't exist. Only "off" is written to storage: absence means
 * on, so a cleared profile gets the helpful default rather than the quiet one.
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
