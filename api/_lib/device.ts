import { startOfMonth } from './db';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

/**
 * Whether this device has already taken its free render **this month**.
 *
 * The allowance used to be once per device forever, which meant a row written
 * in July silently refused someone in September — while the dialog, which reads
 * a per-user count that resets with every new guest identity, cheerfully
 * offered them a render. Scoping the check to the current month is what makes
 * the promise and the enforcement the same statement.
 */
export async function hasDeviceUsedFreeRender(deviceId: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/device_renders` +
      `?device_id=eq.${encodeURIComponent(deviceId)}` +
      `&first_render_at=gte.${startOfMonth()}` +
      `&select=device_id`,
    { headers: HEADERS },
  );
  if (!res.ok) throw new Error(`Device check failed: ${res.status}`);
  const rows = await res.json() as unknown[];
  return rows.length > 0;
}

/**
 * `merge-duplicates`, not `ignore-duplicates`, and the difference is the whole
 * feature. Now that the check above is scoped to the current month, a row left
 * carrying an old timestamp passes it every single time — so ignoring the
 * duplicate would hand that device *unlimited* renders within the month rather
 * than one. Stamping the row on each render is what makes the allowance roll
 * over instead of either locking forever or never locking at all.
 *
 * The column stays honestly named: only one render per month gets through, so
 * the timestamp it holds is that month's first render.
 */
export async function recordDeviceRender(deviceId: string): Promise<void> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/device_renders`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ device_id: deviceId, first_render_at: new Date().toISOString() }),
    });
    /* Loudly, because a silent failure here is expensive in a way the old
       `.catch()`-only version could not see: a non-2xx is a resolved promise,
       so a rejected write looked identical to a successful one. If this stops
       working, every guest gets unlimited free renders and each one costs real
       Lambda money. `ON CONFLICT DO UPDATE` needs UPDATE on the table — which
       `ON CONFLICT DO NOTHING` did not — so a 42501 here means the grant is
       missing: GRANT UPDATE ON public.device_renders TO service_role. */
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(
        `[device] FAILED to record free render for ${deviceId} — guests are ` +
          `currently unlimited. ${res.status} ${body}`,
      );
    }
  } catch (e) {
    console.error('Failed to record device render:', e);
  }
}
