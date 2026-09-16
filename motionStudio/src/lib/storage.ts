/**
 * Asset cloud storage — uploads files directly to S3 via presigned URLs.
 * The Vercel /api/upload-url endpoint generates the presigned PUT URL;
 * the browser PUTs the file straight to S3 (no Vercel bandwidth used).
 * Returns the S3 object key, which the asset persists so its public URL can be
 * rebuilt on read for Lambda to fetch during cloud renders.
 */

import { getAccessToken } from './authToken';

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

export async function uploadAssetToStorage(
  assetId: string,
  file: File,
): Promise<UploadResult> {
  try {
    // Resolved here, not passed in: an upload can start long after the caller
    // rendered, by which time a captured token may have expired.
    const token = await getAccessToken();

    // Step 1 — get presigned PUT URL from our API
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
      return { ok: false, message: String(error) };
    }

    const { uploadUrl, publicUrl, key } = (await res.json()) as UploadUrlResponse;

    // Step 2 — PUT the file directly to S3 (no Vercel involved)
    const upload = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!upload.ok) {
      return { ok: false, message: `Upload failed (${upload.status})` };
    }

    // `key` is what gets persisted; `url` is returned for immediate use only.
    return { ok: true, url: publicUrl, key };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Network request failed',
    };
  }
}

export async function deleteAssetFromStorage(
  _assetId: string,
  _filename: string,
): Promise<void> {
  // S3 deletion via presigned DELETE would need another endpoint.
  // For now objects are retained — cheap at S3 pricing.
}
