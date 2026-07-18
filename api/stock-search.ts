import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './_lib/auth';

const PEXELS_KEY = process.env.PEXELS_API_KEY!;

type StockType = 'photo' | 'video';

interface StockResult {
  id: number;
  type: StockType;
  thumbnailUrl: string;
  previewUrl: string;   // video only: a short preview clip URL
  downloadUrl: string;  // full-resolution asset to import
  width: number;
  height: number;
  photographer: string;
}

/**
 * Server-side proxy for Pexels search — the API key never reaches the browser.
 * Requires a signed-in session (same gate as the other endpoints) so the
 * shared key's rate limit isn't open to anonymous abuse.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  try {
    await verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const query = String(req.query.q ?? '').trim();
  const type: StockType = req.query.type === 'video' ? 'video' : 'photo';
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const perPage = Math.min(24, Math.max(1, parseInt(String(req.query.per_page ?? '20'), 10) || 20));

  if (!query) return res.status(400).json({ error: 'Missing search query' });

  const base = type === 'video' ? 'https://api.pexels.com/videos/search' : 'https://api.pexels.com/v1/search';
  const url = `${base}?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;

  let pexelsRes: Response;
  try {
    pexelsRes = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  } catch (e) {
    return res.status(502).json({ error: `Pexels request failed: ${(e as Error).message}` });
  }

  if (!pexelsRes.ok) {
    return res.status(pexelsRes.status).json({ error: `Pexels error: ${pexelsRes.statusText}` });
  }

  const data = (await pexelsRes.json()) as { photos?: any[]; videos?: any[]; total_results?: number };

  const results: StockResult[] =
    type === 'video'
      ? (data.videos ?? []).map((v: any) => {
          // pick the largest non-4K file for a reasonable import size
          const files = [...(v.video_files ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
          const file = files.find((f) => (f.width ?? 0) <= 1920) ?? files[files.length - 1];
          return {
            id: v.id,
            type: 'video',
            thumbnailUrl: v.image,
            previewUrl: file?.link ?? '',
            downloadUrl: file?.link ?? '',
            width: file?.width ?? v.width,
            height: file?.height ?? v.height,
            photographer: v.user?.name ?? 'Pexels',
          };
        })
      : (data.photos ?? []).map((p: any) => ({
          id: p.id,
          type: 'photo',
          thumbnailUrl: p.src.medium,
          previewUrl: p.src.medium,
          downloadUrl: p.src.large2x ?? p.src.original,
          width: p.width,
          height: p.height,
          photographer: p.photographer,
        }));

  return res.status(200).json({ results, page, totalResults: data.total_results ?? results.length });
}
