const COOKIE = 'ms_device';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookie(): string | null {
  const m = document.cookie.match(/(?:^|; )ms_device=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function getDeviceId(): string {
  const existing = readCookie();
  if (existing) return existing;
  const id = crypto.randomUUID();
  document.cookie = `${COOKIE}=${id}; max-age=${MAX_AGE}; path=/; SameSite=Lax`;
  return id;
}
