import { create } from 'zustand';
import { toast } from 'react-toastify';
import { isSuppressed, suppress, type NoticeId } from './notices';

/**
 * One contextual hint, shown at the moment the thing it explains happens.
 *
 * The copy lives at the call site rather than in a catalogue here. With a
 * handful of notices a catalogue buys consistency at the cost of putting the
 * words a long way from the code that knows why they are true — and these
 * strings interpolate live values ("Found 128 BPM"), which a catalogue would
 * have to grow a templating story to support.
 */
export interface Notice {
  id: NoticeId;
  message: string;
  /** Shows DON'T SHOW AGAIN. Leave off for hints tied to a state, not an event. */
  suppressible?: boolean;
  /** Auto-dismiss delay. 0 keeps it up until the user closes it. */
  timeoutMs?: number;
}

interface NoticeStore {
  current: Notice | null;
  /**
   * Increments on every `show`. The host keys its auto-dismiss timer on this
   * rather than on the id, so a notice replaced by another one *of the same
   * id* — the read-only pair does exactly that — gets its own full window
   * instead of inheriting whatever was left of the previous one's.
   */
  seq: number;
  /** No-ops if the user has already suppressed this id. */
  show: (notice: Notice) => void;
  dismiss: () => void;
  /** Dismiss and never show this id again. */
  dismissForever: () => void;
}

export const useNoticeStore = create<NoticeStore>((set, get) => ({
  current: null,
  seq: 0,

  show: (notice) => {
    if (isSuppressed(notice.id)) return;
    // Deliberately one at a time, replacing rather than queueing. Stacked
    // toasts are how an app starts feeling like it is nagging, and a hint the
    // user has already scrolled past is worth less than the one describing
    // what just happened.
    set((s) => ({ current: notice, seq: s.seq + 1 }));
  },

  dismiss: () => set({ current: null }),

  dismissForever: () => {
    const id = get().current?.id;
    if (id) suppress(id);
    set({ current: null });
  },
}));

/** Convenience for call sites that don't need the store. */
export const showNotice = (notice: Notice) => useNoticeStore.getState().show(notice);

/** Clears a notice only if it is the one still on screen. */
export function dismissNotice(id: NoticeId): void {
  if (useNoticeStore.getState().current?.id === id) useNoticeStore.getState().dismiss();
}

/**
 * A new element landed on the canvas, already selected, from a one-click
 * action — the toolbar's insert/shader/block buttons, or clicking an asset
 * tile. All of those can be clicked again before the first result is
 * noticed, especially when the visible change is behind a closing popover or
 * (for audio) has no canvas presence at all. One shared helper rather than
 * this composed at each call site, so the id/suppressible shape can't drift
 * between the two places that need it.
 *
 * Routed through react-toastify rather than `showNotice`: unlike the single
 * contextual hint the store/host pair handles (read-only, beat detection,
 * project-from-future — one at a time, by design), clicking insert twice in
 * quick succession is a legitimate double confirmation, not nagging. The
 * toast stack handles that; the notice store deliberately doesn't.
 */
export function notifyAdded(what: string): void {
  if (isSuppressed('element-added')) return;
  toast(
    ({ closeToast }) => (
      <div className="flex items-center gap-3 p-3">
        <p className="text-[13px] leading-relaxed text-studio-text">
          {what} added — look for it on the timeline below.
        </p>
        <button
          type="button"
          onClick={() => {
            suppress('element-added');
            closeToast();
          }}
          className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-studio-text-faint hover:text-studio-text"
        >
          Don't show again
        </button>
      </div>
    ),
    {
      position: 'top-center',
      autoClose: 3_000,
      hideProgressBar: true,
      closeButton: false,
      // `!` variants because ReactToastify.css's own `.Toastify__toast` rule
      // (white background) loads after Tailwind's utilities in the bundle and
      // otherwise wins the cascade outright, not just on specificity ties.
      className:
        '!rounded-studio-lg !border !border-studio-border-strong !bg-studio-panel !shadow-lg !min-h-0',
    },
  );
}
