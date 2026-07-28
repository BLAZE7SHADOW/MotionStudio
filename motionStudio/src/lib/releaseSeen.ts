import { LATEST_RELEASE_ID } from '@/content/releases';

/**
 * Tracks which release the user has already been shown.
 *
 * Kept out of the dialog module: it's called during render as a lazy state
 * initialiser, and a module that exports both a component and plain functions
 * breaks fast refresh.
 */
const SEEN_KEY = 'ms_last_seen_release';

/** Whether there's a release the user hasn't been shown yet. */
export function hasUnseenRelease(): boolean {
  if (!LATEST_RELEASE_ID) return false;
  try {
    const seen = localStorage.getItem(SEEN_KEY);
    // Someone arriving for the first time shouldn't be met with a changelog —
    // they have no "before" to compare against. Mark it seen silently instead.
    if (seen === null) {
      localStorage.setItem(SEEN_KEY, LATEST_RELEASE_ID);
      return false;
    }
    return seen !== LATEST_RELEASE_ID;
  } catch {
    return false; // storage unavailable — never nag
  }
}

export function markReleasesSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, LATEST_RELEASE_ID);
  } catch {
    // private mode; the dot returns next session, which is harmless
  }
}
