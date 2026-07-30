import { create } from 'zustand';

/**
 * Whether your work has reached the cloud.
 *
 * Local persistence (IndexedDB, via zustand `persist`) is a separate path and
 * keeps working regardless — which is why the offline copy says *changes are
 * kept on this device* rather than anything alarming. Overstating the problem
 * would be its own bug: a user who thinks their work is gone will do something
 * drastic to recover it.
 */
export type SaveStatus =
  /** Nothing to report — signed out, or nothing has changed yet. */
  | 'idle'
  | 'saving'
  | 'saved'
  /** The browser or a thrown request says there is no connection. */
  | 'offline'
  /** The server refused. Not automatically retried — it would just refuse again. */
  | 'failed';

interface SaveState {
  status: SaveStatus;
  /** Epoch ms of the last successful cloud save, for "saved 2 minutes ago". */
  lastSavedAt: number | null;
  /** Server message on `failed`, shown on hover rather than in the label. */
  error: string | null;
  set: (status: SaveStatus, error?: string | null) => void;
}

export const useSaveState = create<SaveState>((set) => ({
  status: 'idle',
  lastSavedAt: null,
  error: null,
  set: (status, error = null) =>
    set((s) => ({
      status,
      error,
      lastSavedAt: status === 'saved' ? Date.now() : s.lastSavedAt,
    })),
}));

export const setSaveStatus = (status: SaveStatus, error?: string | null) =>
  useSaveState.getState().set(status, error);

/** "just now" / "2 minutes ago" / "14:03" — deliberately vague up close. */
export function describeLastSaved(at: number | null, now = Date.now()): string {
  if (at === null) return '';
  const secs = Math.max(0, Math.round((now - at) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
