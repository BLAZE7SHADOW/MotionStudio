import { create } from 'zustand';

/**
 * Lets any failure surface open the feedback form.
 *
 * A `?` menu only catches people who go looking, and by then they've usually
 * given up or forgotten the detail that mattered. The moment worth capturing is
 * the failure itself — so an export error or a missing file can hand the user
 * straight into the form with the situation already described.
 *
 * A store rather than prop-drilling because the reporting points (export
 * dialog, assets panel) are nowhere near where the dialog is mounted.
 */
interface FeedbackState {
  open: boolean;
  /** Seeds the message box, so the user only adds what we can't know. */
  prefill: string;
  openFeedback: (prefill?: string) => void;
  closeFeedback: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  open: false,
  prefill: '',
  openFeedback: (prefill = '') => set({ open: true, prefill }),
  closeFeedback: () => set({ open: false, prefill: '' }),
}));
