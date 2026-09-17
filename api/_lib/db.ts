const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BASE_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

/**
 * Exported so `device.ts` measures the same month this file does. Two
 * independently-written date boundaries is exactly how the per-user and
 * per-device gates drift apart, which is the bug class this quota already
 * shipped once.
 */
export function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export async function getRenderCount(userId: string): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/renders?user_id=eq.${userId}&created_at=gte.${startOfMonth()}&select=*`,
    { method: 'HEAD', headers: { ...BASE_HEADERS, Prefer: 'count=exact' } },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`DB quota check failed: ${res.status} ${body}`);
  }
  const range = res.headers.get('content-range') ?? '0/0';
  return parseInt(range.split('/')[1] ?? '0', 10);
}

export async function recordRender(userId: string, renderId: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/renders`, {
    method: 'POST',
    headers: BASE_HEADERS,
    body: JSON.stringify({ user_id: userId, render_id: renderId }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Failed to record render:', res.status, body);
  }
}

/**
 * Give a render back after it failed inside Lambda.
 *
 * The charge happens when Lambda *accepts* the job, not when it finishes, and
 * that is deliberate — it is what stops someone firing off five renders at once
 * before any of them completes. The cost of charging early is that a render
 * which then dies in Lambda still counts, which is not something a user should
 * pay for. Refunding on observed failure keeps the protection and drops the
 * cost.
 *
 * "Observed" is the honest limit: if the tab closes mid-render nothing watches
 * it fail, so the charge stands. That errs toward charging, which is the safe
 * direction for a paid resource.
 */
export async function refundRender(renderId: string): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/renders?render_id=eq.${encodeURIComponent(renderId)}`,
    { method: 'DELETE', headers: BASE_HEADERS },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Logged rather than thrown: the caller is reporting a render failure to
    // the user, and replacing that message with a billing error would be worse.
    console.error('Failed to refund render:', renderId, res.status, body);
  }
}
