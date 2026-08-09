/**
 * Who the projects on this device belong to, and what to do when that changes.
 *
 * `clearAll()` exists to stop one account's projects leaking into another on a
 * shared device. That is a real concern, but the rule it was enforcing — "any
 * change of user id wipes local projects" — destroyed work it had no business
 * touching. A guest who built a project and then signed up lost all of it.
 *
 * **The line is whether the data has a copy the user can still get back to.**
 * Guests do sync — an anonymous Supabase session is a real user row, and
 * `CloudSync` pushes for it like any other. But that row belongs to an
 * identity nobody can sign into again: the moment they sign in with Google,
 * the anonymous session is gone for good and its projects with it. So the
 * local copy `clearAll` was deleting really was the last reachable one.
 *
 * A permanent account is the opposite — its projects are in Supabase under an
 * identity the user can sign back into, so clearing them locally costs
 * nothing and the next pull restores them. Hence: protect a permanent
 * account's data from the *next* person, and protect a guest's data from
 * being deleted at all.
 *
 * Split from `App.tsx` and kept free of React for the same reason as
 * `notices.ts`: this is the one decision in the app that can permanently
 * destroy a user's work, and `decideTransition` being a pure function is what
 * makes it cheap to test every path (`tests/projectOwner.test.mjs`).
 */

const OWNER_KEY = 'ms_last_user';
const OWNER_ANON_KEY = 'ms_last_user_anon';

/** The account whose projects are sitting in local storage right now. */
export interface Owner {
  id: string;
  /** A Supabase anonymous session — no cloud copy of anything they make. */
  anonymous: boolean;
}

export type Transition =
  /** Same account, or nobody signed in — local projects stay put. */
  | { kind: 'keep' }
  /** The local projects now belong to the incoming account. */
  | { kind: 'adopt' }
  /** A different person, and the outgoing account's work is safe in the cloud. */
  | { kind: 'wipe' };

/**
 * `owner` is who local projects currently belong to; `next` is whoever just
 * signed in (or `null` for signed out).
 */
export function decideTransition(owner: Owner | null, next: Owner | null): Transition {
  // Signing out is not a handover. The projects stay, the owner marker stays,
  // and if a different person signs in next *that* is when the wipe fires —
  // which is why the marker has to outlive the session. Wiping here instead
  // would lose work every time a session simply expired.
  if (!next) return { kind: 'keep' };

  // Nothing owned locally yet: whoever arrives first takes it.
  if (!owner) return { kind: 'adopt' };

  if (owner.id === next.id) return { kind: 'keep' };

  // The outgoing owner was a guest, so the identity holding their cloud copy
  // is already unreachable — this local copy is the only one left. Hand it to
  // the incoming account instead. Overwhelmingly this is the same person,
  // either upgrading to a real account or landing in a fresh guest session.
  if (owner.anonymous) return { kind: 'adopt' };

  // A real account owned these and someone else is here now. Safe to clear:
  // the outgoing account's projects are in Supabase under an identity they can
  // sign back into, and come back on their next pull.
  return { kind: 'wipe' };
}

export function readOwner(): Owner | null {
  try {
    const id = localStorage.getItem(OWNER_KEY);
    if (!id) return null;
    return { id, anonymous: localStorage.getItem(OWNER_ANON_KEY) === 'true' };
  } catch {
    return null; // storage unavailable — treat as unowned and never wipe
  }
}

export function writeOwner(owner: Owner | null): void {
  try {
    if (!owner) {
      localStorage.removeItem(OWNER_KEY);
      localStorage.removeItem(OWNER_ANON_KEY);
      return;
    }
    localStorage.setItem(OWNER_KEY, owner.id);
    localStorage.setItem(OWNER_ANON_KEY, String(owner.anonymous));
  } catch {
    // private mode; the marker just won't survive a reload
  }
}

/**
 * Set when projects were adopted across an account change, and read by
 * `CloudSync` on its next pull.
 *
 * Without it that pull calls `setProjects(cloud)`, which *replaces* the array
 * — so projects rescued from the wipe above would be dropped a second later by
 * the sync instead, and the fix would look like it had done nothing.
 *
 * Module state, not storage: it only has to survive the moment between the
 * auth effect and the pull effect in the same session.
 */
let pendingMerge = false;

export function markPendingMerge(): void {
  pendingMerge = true;
}

/** Reads the flag and clears it, so a later pull replaces as usual. */
export function takePendingMerge(): boolean {
  const value = pendingMerge;
  pendingMerge = false;
  return value;
}
