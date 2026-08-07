import { create } from 'zustand';

/**
 * Whether the guided quick start is currently running.
 *
 * `useHelperLayer` reads this to stand down while the tour has the screen —
 * driver.js is already spotlighting one control with its own overlay, and a
 * hover-flash on some other control the user's cursor happens to be resting
 * on would compete with that rather than support it. `useEditorTour` is the
 * only writer.
 *
 * A tiny store rather than a module-level `let` (the shape the old
 * driver.js-hints version of this used, with imperative `pause`/`resume`
 * calls): `useHelperLayer` is a React hook now, so a plain reactive value it
 * can read like any other piece of state is the fit — no separate imperative
 * API for one boolean.
 */
export const useTourActive = create<{ active: boolean; setActive: (active: boolean) => void }>(
  (set) => ({
    active: false,
    setActive: (active) => set({ active }),
  }),
);
