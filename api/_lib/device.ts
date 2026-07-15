const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

export async function hasDeviceUsedFreeRender(deviceId: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/device_renders?device_id=eq.${encodeURIComponent(deviceId)}&select=device_id`,
    { headers: HEADERS },
  );
  if (!res.ok) throw new Error(`Device check failed: ${res.status}`);
  const rows = await res.json() as unknown[];
  return rows.length > 0;
}

export async function recordDeviceRender(deviceId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/device_renders`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify({ device_id: deviceId }),
  }).catch((e) => console.error('Failed to record device render:', e));
}
