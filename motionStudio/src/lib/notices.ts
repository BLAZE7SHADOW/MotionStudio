/**
 * Which one-time hints the user has told us to stop showing.
 *
 * Split from the store and the component for the same reason as
 * `releaseSeen.ts`: a module exporting both a component and plain functions
 * breaks fast refresh. It is also the only part of the notice system worth
 * testing, and staying free of React and zustand is what makes that cheap —
 * `tests/notices.test.mjs` bundles this file alone.
 *
 * A notice earns its place by firing at the moment of confusion and nowhere
 * else. If it would fire on every visit it is documentation, not a notice, and
 * belongs in the tour or the guide.
 */

/**
 * Ids are stable strings, deliberately decoupled from the copy: rewording a
 * hint must not resurrect it for everyone who already dismissed it. Renaming
 * an id is therefore a decision to show it again, and should be one you meant.
 */
export type NoticeId =
  /** A tempo was found in an uploaded track and the grid just appeared. */
  | 'beat-found'
  /** A tempo was found but we do not trust it. */
  | 'beat-low-confidence'
  /** This tab is watching a project another tab is editing. */
  | 'read-only'
  /** A project was written by a build newer than this one. */
  | 'project-from-future';

const KEY = 'ms_suppressed_notices';

/** Every id the user has hit DON'T SHOW AGAIN on. */
export function readSuppressed(): NoticeId[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Anything could be in storage — another build, a hand-edited value, a key
    // collision. Filter to strings rather than trusting the shape, because the
    // failure mode is a crash on every render of the host.
    return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === 'string') as NoticeId[]) : [];
  } catch {
    return []; // storage unavailable or corrupt — show the hint, never crash
  }
}

export function isSuppressed(id: NoticeId): boolean {
  return readSuppressed().includes(id);
}

export function suppress(id: NoticeId): void {
  try {
    const next = new Set(readSuppressed());
    next.add(id);
    localStorage.setItem(KEY, JSON.stringify([...next]));
  } catch {
    // private mode; the hint returns next session, which is the harmless
    // direction to fail in
  }
}

/** Brings every dismissed hint back. Paired with "restart tour" in the ? menu. */
export function clearSuppressions(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing was stored to begin with
  }
}
