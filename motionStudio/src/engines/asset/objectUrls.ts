/**
 * A registry of the object URLs this page session created.
 *
 * `URL.createObjectURL` returns a handle that is only meaningful inside the
 * document that made it. A project persists those strings to localStorage and
 * Supabase, so reopening it later — or on another device — restores URLs that
 * can never resolve. There's no way to ask the browser whether a given
 * `blob:` URL is still alive, so we track the ones we minted and treat every
 * other `blob:` as dead.
 *
 * This matters more than it sounds: `@remotion/media` classifies a failed
 * fetch as retryable and will hammer a dead URL indefinitely, which presents
 * as a frozen editor rather than an error.
 */

const live = new Set<string>();

export function createObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  live.add(url);
  return url;
}

export function revokeObjectUrl(url: string): void {
  live.delete(url);
  URL.revokeObjectURL(url);
}

/**
 * Whether this URL can actually be loaded right now. Remote URLs are assumed
 * fine (a 404 there fails normally instead of hanging); `blob:` URLs are only
 * trusted if this session created them.
 */
export function isUrlUsable(url: string | undefined | null): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) return live.has(url);
  return true;
}
