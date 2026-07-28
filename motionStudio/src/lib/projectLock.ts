/**
 * One editor per project, across tabs.
 *
 * Both persistence paths write the *whole* projects array: zustand's `persist`
 * middleware to IndexedDB, and the cloud autosave in `App.tsx`, which pushes
 * every project every two seconds. Neither reconciles. So a second tab holding
 * a stale copy silently overwrites the first tab's work — and because the cloud
 * save iterates all projects, a tab left idle on the dashboard can clobber
 * edits to a project it isn't even showing. Last writer wins, and the loser is
 * never told.
 *
 * The fix is a lock rather than a merge. Merging edits to a video composition
 * has no obvious right answer (whose element position wins?), while "this is
 * open somewhere else, take over or look without touching" is a question the
 * user can actually answer.
 *
 * localStorage rather than IndexedDB because it is synchronous — a lock you
 * have to await is a lock with a race in it — and because the `storage` event
 * gives us cross-tab notification for free.
 */

/** Distinguishes tabs. Regenerated per page load, which is what we want: a
    reloaded tab is a new claimant, not the previous holder. */
export const TAB_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);

const KEY_PREFIX = 'ms_lock_';
/** How often the holder refreshes its claim. */
const HEARTBEAT_MS = 4_000;
/** A claim older than this is assumed dead — a crashed or force-quit tab never
    releases, and without an expiry the project would be locked forever. Three
    missed heartbeats, so a briefly-throttled background tab isn't evicted. */
const STALE_MS = 13_000;

interface Claim {
  tabId: string;
  ts: number;
}

const key = (projectId: string) => KEY_PREFIX + projectId;

function read(projectId: string): Claim | null {
  try {
    const raw = localStorage.getItem(key(projectId));
    if (!raw) return null;
    const claim = JSON.parse(raw) as Claim;
    if (typeof claim?.tabId !== 'string' || typeof claim?.ts !== 'number') return null;
    return claim;
  } catch {
    return null;
  }
}

function write(projectId: string, claim: Claim) {
  try {
    localStorage.setItem(key(projectId), JSON.stringify(claim));
  } catch {
    // Storage unavailable (private mode, quota). We degrade to the old
    // behaviour rather than blocking the editor — see `isLockable`.
  }
}

/** False when localStorage is unusable, in which case we cannot guard at all
    and must not pretend otherwise. */
export function isLockable(): boolean {
  try {
    const probe = KEY_PREFIX + 'probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const isFresh = (claim: Claim) => Date.now() - claim.ts < STALE_MS;

/** Who, if anyone, is editing this project right now. */
export function holder(projectId: string): 'me' | 'other' | 'nobody' {
  const claim = read(projectId);
  if (!claim || !isFresh(claim)) return 'nobody';
  return claim.tabId === TAB_ID ? 'me' : 'other';
}

/** Takes the lock unconditionally. Used both for a free project and for an
    explicit "take over" — the difference is a question we asked the user, not
    a difference in what we write. */
export function claim(projectId: string) {
  write(projectId, { tabId: TAB_ID, ts: Date.now() });
}

export function release(projectId: string) {
  // Only drop our own claim. If another tab has taken over in the meantime,
  // removing the key would hand the project to nobody and lose their guard.
  if (holder(projectId) !== 'me') return;
  try {
    localStorage.removeItem(key(projectId));
  } catch {
    /* nothing useful to do */
  }
}

/** Keeps our claim fresh. Returns the stop function. */
export function startHeartbeat(projectId: string): () => void {
  const id = setInterval(() => {
    if (holder(projectId) === 'me') claim(projectId);
  }, HEARTBEAT_MS);
  return () => clearInterval(id);
}

/**
 * Fires when another tab writes this project's lock.
 *
 * `storage` only fires in *other* tabs, which is exactly the semantics we
 * want: the tab being taken over is the one that needs to hear about it.
 */
export function subscribe(projectId: string, onChange: () => void): () => void {
  const k = key(projectId);
  const handler = (e: StorageEvent) => {
    if (e.key === k || e.key === null) onChange();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

/* ── read-only registry ───────────────────────────────────────────────────
   The store needs a synchronous, dependency-free way to ask "may I write to
   this project?" without importing React or the lock's lifecycle. A module
   level set is the smallest thing that does that, and it keeps the guard at
   the single chokepoint every mutation already passes through. */

const readOnly = new Set<string>();

export function setReadOnly(projectId: string, value: boolean) {
  if (value) readOnly.add(projectId);
  else readOnly.delete(projectId);
}

/** Checked by `updateProject`, `undo` and `redo` before mutating. */
export function isReadOnly(projectId: string): boolean {
  return readOnly.has(projectId);
}

/** True while any project is open read-only — used by the cloud autosave,
    which pushes every project and would otherwise write a stale copy back
    over the tab that actually holds the lock. */
export function hasReadOnly(): boolean {
  return readOnly.size > 0;
}
