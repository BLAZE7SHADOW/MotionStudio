import { getDeviceId } from './deviceId';

export interface QuotaResult {
  used: number;
  limit: number;
  remaining: number;
}

export interface RenderStarted {
  renderId: string;
}

export type RenderStatus =
  | { status: 'rendering'; progress: number }
  | { status: 'done'; url: string | null }
  | { status: 'error'; error: string };

export type StockType = 'photo' | 'video';

export interface StockResult {
  id: number;
  type: StockType;
  thumbnailUrl: string;
  previewUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  photographer: string;
}

export interface StockSearchResult {
  results: StockResult[];
  page: number;
  totalResults: number;
}

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });

  // An HTML body here means the request never reached a function and hit the
  // SPA fallback instead. Parsing it blindly produced
  // `Unexpected token '<', "<!doctype "...`, which says nothing about the
  // actual problem — so name it.
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `${path} did not return JSON (${res.status}). The API isn't reachable — ` +
        `if you're on the dev server, check the /api proxy in vite.config.ts.`,
    );
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  getQuota: (token: string): Promise<QuotaResult> =>
    apiFetch('/api/quota', token),

  /** Queues a Lambda render and returns immediately — poll getRenderStatus. */
  startRender: (token: string, inputProps: Record<string, unknown>): Promise<RenderStarted> =>
    apiFetch('/api/render', token, {
      method: 'POST',
      body: JSON.stringify({ inputProps, deviceId: getDeviceId() }),
    }),

  getRenderStatus: (token: string, renderId: string): Promise<RenderStatus> =>
    apiFetch(
      `/api/render-status?renderId=${encodeURIComponent(renderId)}&deviceId=${encodeURIComponent(getDeviceId())}`,
      token,
    ),

  searchStock: (token: string, query: string, type: StockType, page = 1): Promise<StockSearchResult> =>
    apiFetch(`/api/stock-search?q=${encodeURIComponent(query)}&type=${type}&page=${page}`, token),
};
