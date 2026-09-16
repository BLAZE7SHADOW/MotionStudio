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
 * Must stay in step with the server's `S3_ASSETS_BUCKET`. They are two names
 * for one bucket: the server presigns the upload with its copy, the client
 * builds the read URL with this one, and Lambda fetches what the client wrote.
 * Changing the bucket means changing both, in `.env` and in Vercel.
 */
const BUCKET = import.meta.env.VITE_S3_ASSETS_BUCKET as string | undefined;

export const ASSET_BASE = BUCKET
  ? `https://${BUCKET}.s3.${REGION}.amazonaws.com`
  : '';

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
