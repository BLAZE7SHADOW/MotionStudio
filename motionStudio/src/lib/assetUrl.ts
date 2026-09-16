/**
 * Resolves an asset's cloud URL from its stored S3 key.
 *
 * Why a key and not a URL. The upload endpoint used to hand back a fully
 * resolved `https://<bucket>.s3…/<key>` and that string was persisted onto the
 * asset, which froze the bucket name into every project's data. When the app
 * moved to a new AWS account the old bucket stopped being ours, and every
 * stored URL became a permanent 403 that no amount of reconfiguring could
 * reach — the bucket name was in the database, not in the config.
 *
 * The key is the part that is actually stable (`<assetId>.<ext>`, and nothing
 * else — see api/upload-url.ts). Storing that and rebuilding the URL on read
 * makes a bucket change an env var again.
 */

import type { Asset } from '@/engines/project';

const REGION = 'us-east-1'; // matches api/upload-url.ts and api/render.ts

/**
 * The assets bucket, injected at build time from the server's single
 * `S3_ASSETS_BUCKET` (see vite.config.ts).
 *
 * Not a second env var. Vite only exposes `VITE_`-prefixed variables to the
 * browser, so the obvious way to get this here is to declare one — but that is
 * two names for one value, which is the same class of bug that broke every
 * asset in the first place, and it drifts silently. Deriving it from the
 * server's variable at build time makes a mismatch unrepresentable rather than
 * something to police.
 */
const BUCKET = __ASSETS_BUCKET__ || undefined;

export const ASSET_BASE = BUCKET
  ? `https://${BUCKET}.s3.${REGION}.amazonaws.com`
  : '';

/* Loud, because the silent version cost a week. With the variable missing,
   `cloudUrl` returns undefined for every asset: media still plays locally off
   IndexedDB, so the editor looks completely healthy while every cloud render
   quietly ships without its media. Degrading to local-only is the right
   behaviour — throwing here would white-screen the app over a config typo — but
   it has to announce itself. */
if (!BUCKET) {
  console.error(
    '[assets] S3_ASSETS_BUCKET was not set when this build was made. Asset cloud ' +
      'URLs cannot be built, so cloud renders will be missing their media. Set it ' +
      'in the repo-root .env (local) or the Vercel project settings, and rebuild.',
  );
}

/** The asset's public https URL, or undefined if it has no cloud copy. */
export function cloudUrl(asset: Asset): string | undefined {
  if (!asset.storageKey || !ASSET_BASE) return undefined;
  return `${ASSET_BASE}/${asset.storageKey}`;
}

/**
 * Recover a key from a legacy `storageUrl`, but only when that URL points at
 * the bucket we are configured for right now.
 *
 * The restriction is the whole point: an asset whose URL still matches the
 * current bucket needs a one-line rewrite, while one pointing somewhere else
 * has no reachable cloud copy and must be re-uploaded. Accepting any host would
 * silently keep the dead bucket alive in the data.
 */
export function keyFromCurrentBucketUrl(url: string | undefined): string | undefined {
  if (!url || !ASSET_BASE || !url.startsWith(`${ASSET_BASE}/`)) return undefined;
  const key = url.slice(ASSET_BASE.length + 1);
  return key.length > 0 ? key : undefined;
}
