import { create } from 'zustand';

/**
 * Whether helper mode is switched on.
 *
 * Split from the hover-and-render lifecycle in `hooks/useHelperLayer.ts` /
 * `tour/HelperCard.tsx` for the same reason `notices.ts` is split from
 * `noticeStore.ts`: this is a boolean and a storage key, the other two touch
 * the DOM and render, and the toolbar button only needs the boolean.
 *
 * **Default off.** Helper mode's proactive flash-and-card was the only way
 * to learn a control's purpose without hunting for the toggle, which is why
 * it used to default on. `InfoHint` (`components/InfoHint.tsx`) now covers
 * that same "what is this" need at a much lower intrusion cost — a small,
 * static, always-visible icon next to a control rather than a border flash
 * and popover on every hover — so Helper Mode no longer needs to carry that
 * job by default. Only "on" is written to storage: absence means off, so a
 * cleared profile gets the quiet default.
 */

const KEY = 'ms_helper_mode';

function readStored(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false; // private mode — fail towards the quiet default
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
