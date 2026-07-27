import { getSupabase } from './supabase';

/**
 * The access token for the current session, refreshed if it's about to expire.
 *
 * Supabase access tokens live about an hour. Components used to read the token
 * from `useAuth` state, captured at mount and updated only when Supabase
 * happens to emit an auth event — so a long editing session ended up sending an
 * expired JWT and every endpoint returned 401 "Invalid session" at once.
 * Fetching it at request time instead means the token can't go stale between
 * render and call.
 */

/** Refresh this far ahead of expiry, to cover clock skew and request latency. */
const EXPIRY_SKEW_MS = 60_000;

export class NotSignedInError extends Error {
  constructor(message = 'Your session has expired. Sign in again to continue.') {
    super(message);
    this.name = 'NotSignedInError';
  }
}

export async function getAccessToken(forceRefresh = false): Promise<string> {
  const supabase = getSupabase();

  if (!forceRefresh) {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) throw new NotSignedInError('You are signed out. Sign in to continue.');

    const msLeft = (session.expires_at ?? 0) * 1000 - Date.now();
    if (msLeft > EXPIRY_SKEW_MS) return session.access_token;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) throw new NotSignedInError();
  return data.session.access_token;
}
