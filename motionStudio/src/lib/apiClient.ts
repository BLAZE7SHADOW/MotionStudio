import { getDeviceId } from './deviceId';

export interface QuotaResult {
  used: number;
  limit: number;
  remaining: number;
}

export interface RenderResult {
  url: string;
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  getQuota: (token: string): Promise<QuotaResult> =>
    apiFetch('/api/quota', token),

  startRender: (token: string, inputProps: Record<string, unknown>): Promise<RenderResult> =>
    apiFetch('/api/render', token, {
      method: 'POST',
      body: JSON.stringify({ inputProps, deviceId: getDeviceId() }),
    }),
};
