const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BASE_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

function startOfMonth(): string {
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
