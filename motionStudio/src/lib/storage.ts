/**
 * Asset cloud storage — uploads files directly to S3 via presigned URLs.
 * The Vercel /api/upload-url endpoint generates the presigned PUT URL;
 * the browser PUTs the file straight to S3 (no Vercel bandwidth used).
 * Returns the S3 object key, which the asset persists so its public URL can be
 * rebuilt on read for Lambda to fetch during cloud renders.
 */

import { getAccessToken } from './authToken';
import { ASSET_BASE } from './assetUrl';

interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Why this reports a reason instead of `null`.
 *
 * Every failure used to `console.warn` and return `null`, and the caller
 * dropped it on the floor. The asset still worked locally off its blob URL, so
 * nothing looked wrong — and the failure only surfaced much later as a cloud
 * render that had quietly skipped that media. The API already produces
 * genuinely useful reasons ("File exceeds 500 MB limit", "File type not
 * allowed: …"); they were being thrown away one line after being parsed.
 */
export type UploadResult =
  | { ok: true; url: string; key: string }
  | { ok: false; message: string };

/* Three attempts, ~1s then ~3s apart. Bounded rather than indefinite because an
   import can be a dozen files at once and an unbounded queue behind a genuinely
   broken backend is just a slow way to hang. What is *not* bounded is the
   lifetime of the attempt: `healCloudCopies` retries anything still missing a
   storageKey on every project open, so exhausting these three is a pause, not a
   verdict. */
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1_000, 3_000];

/** Waiting out a wall clock is pointless while the machine is offline. */
const RECONNECT_TIMEOUT_MS = 60_000;

type Attempt =
  | { ok: true; url: string; key: string }
  | { ok: false; message: string; retryable: boolean };

export async function uploadAssetToStorage(
  assetId: string,
  file: File,
): Promise<UploadResult> {
  for (let attempt = 0; ; attempt++) {
    const result = await attemptUpload(assetId, file);
    if (result.ok) return { ok: true, url: result.url, key: result.key };

    const lastAttempt = attempt >= MAX_ATTEMPTS - 1;
    if (!result.retryable || lastAttempt) {
      return { ok: false, message: result.message };
    }
    await pauseBeforeRetry(BACKOFF_MS[attempt]);
  }
}

async function attemptUpload(assetId: string, file: File): Promise<Attempt> {
  let uploadUrl: string;
  let publicUrl: string;
  let key: string;

  try {
    // Resolved per attempt, not once: an upload can start long after the caller
    // rendered, and a retry later still — by which time a captured token may
    // have expired.
    const token = await getAccessToken();

    const res = await fetch('/api/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        assetId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: res.statusText }));
      /* Our own API's 4xx are considered answers, not failures: "File exceeds
         500 MB limit" and "File type not allowed" do not become true on the
         third try, and retrying only delays a message the user needs now. 401
         is included — a token that won't verify now won't verify in a second,
         and the next project open gets a fresh one. */
      return { ok: false, message: String(error), retryable: res.status >= 500 || res.status === 429 };
    }

    ({ uploadUrl, publicUrl, key } = (await res.json()) as UploadUrlResponse);
    warnOnBucketMismatch(uploadUrl);
  } catch (err) {
    // fetch only throws for transport-level problems, which are the retryable
    // ones by definition.
    return { ok: false, message: reason(err), retryable: true };
  }

  try {
    const upload = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!upload.ok) {
      /* A 403 here is S3 refusing the presigned PUT — a misconfigured or
         unreachable bucket, which is a standing condition rather than a blip.
         Retrying it three times just delays the report; the next project open
         is the right moment to try again, by which point the config may have
         been fixed. */
      return {
        ok: false,
        message: `Upload failed (${upload.status})${describeTarget(uploadUrl)}`,
        retryable: upload.status >= 500 || upload.status === 429,
      };
    }
  } catch (err) {
    return { ok: false, message: reason(err), retryable: true };
  }

  return { ok: true, url: publicUrl, key };
}

/**
 * Backoff, except while offline — then wait for the connection instead.
 *
 * Sleeping a fixed 3s on a machine with no network burns an attempt on a
 * question whose answer cannot have changed. Waiting for `online` spends the
 * attempt when there is something to spend it on, which is the difference
 * between "imported on the train" surviving and not.
 */
function pauseBeforeRetry(ms: number): Promise<void> {
  if (navigator.onLine) return new Promise((r) => setTimeout(r, ms));

  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener('online', done);
      clearTimeout(timer);
      resolve();
    };
    // Capped, so a device that never reconnects still reports rather than
    // leaving the asset in a permanent "uploading" state.
    const timer = setTimeout(done, RECONNECT_TIMEOUT_MS);
    window.addEventListener('online', done);
  });
}

/**
 * Names the bucket a failed upload was aimed at.
 *
 * A bare "Upload failed (403)" is what let a whole week pass with nothing
 * reaching storage: the message was true, useless, and identical whether the
 * bucket was misconfigured, missing, or simply not ours any more. The presigned
 * URL's host *is* the server's configured bucket, so the client already knows
 * which one it tried — there is no reason to make anyone guess.
 */
function describeTarget(uploadUrl: string): string {
  const bucket = bucketOf(uploadUrl);
  return bucket ? ` — bucket ${bucket}` : '';
}

/**
 * The client builds read URLs from VITE_S3_ASSETS_BUCKET while the server
 * presigns writes with S3_ASSETS_BUCKET. Two names for one bucket, which is the
 * price of resolving URLs client-side — and the failure mode when they drift is
 * silent: uploads land somewhere the app will never read from. Nothing else
 * compares them, so this does, once.
 */
let mismatchReported = false;
function warnOnBucketMismatch(uploadUrl: string): void {
  if (mismatchReported || !ASSET_BASE) return;
  const signed = bucketOf(uploadUrl);
  const configured = bucketOf(ASSET_BASE);
  if (!signed || !configured || signed === configured) return;

  mismatchReported = true;
  console.error(
    `[assets] bucket mismatch: the API presigns uploads for "${signed}" but this ` +
      `build reads from "${configured}". Uploaded media will not be readable. ` +
      "Make the API's S3_ASSETS_BUCKET and VITE_S3_ASSETS_BUCKET match.",
  );
}

function bucketOf(url: string): string | undefined {
  try {
    // Bucket-style hostname: <bucket>.s3.<region>.amazonaws.com
    return new URL(url).hostname.split('.')[0] || undefined;
  } catch {
    return undefined;
  }
}

function reason(err: unknown): string {
  if (!navigator.onLine) return 'No connection — will retry when you are back online';
  return err instanceof Error ? err.message : 'Network request failed';
}

export async function deleteAssetFromStorage(
  _assetId: string,
  _filename: string,
): Promise<void> {
  // S3 deletion via presigned DELETE would need another endpoint.
  // For now objects are retained — cheap at S3 pricing.
}
