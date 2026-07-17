/**
 * Asset cloud storage — uploads files directly to S3 via presigned URLs.
 * The Vercel /api/upload-url endpoint generates the presigned PUT URL;
 * the browser PUTs the file straight to S3 (no Vercel bandwidth used).
 * Returns the public S3 URL so Lambda can fetch it during cloud renders.
 */

interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

export async function uploadAssetToStorage(
  assetId: string,
  file: File,
  token: string,
): Promise<string | null> {
  try {
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
      console.warn('[storage] failed to get upload URL:', error);
      return null;
    }

    const { uploadUrl, publicUrl } = (await res.json()) as UploadUrlResponse;

    // Step 2 — PUT the file directly to S3 (no Vercel involved)
    const upload = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!upload.ok) {
      console.warn('[storage] S3 upload failed:', upload.status);
      return null;
    }

    return publicUrl;
  } catch (err) {
    console.warn('[storage] upload error:', err);
    return null;
  }
}

export async function deleteAssetFromStorage(
  _assetId: string,
  _filename: string,
): Promise<void> {
  // S3 deletion via presigned DELETE would need another endpoint.
  // For now objects are retained — cheap at S3 pricing.
}
