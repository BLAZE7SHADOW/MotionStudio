import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './_lib/auth';
import { getRenderCount } from './_lib/db';
import { hasDeviceUsedFreeRender } from './_lib/device';

const QUOTA = { authenticated: 5, anonymous: 1 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  let user;
  try {
    user = await verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const limit = user.is_anonymous ? QUOTA.anonymous : QUOTA.authenticated;

  let used: number;
  try {
    used = await getRenderCount(user.id);
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }

  /* A guest's row count is not the whole story, and reporting it alone is what
     made the dialog offer a render the server then refused.
     `getRenderCount` is keyed on the anonymous user id, which is issued fresh
     every guest session — so a returning guest always looks untouched. The gate
     that actually decides is per *device* (see /api/render), and it survives
     that new identity. Consulting it here is the difference between finding out
     before the click and finding out after it.

     A failure to reach it is deliberately not fatal: /api/render re-checks and
     is the real authority, so the worst case is the optimistic number this
     endpoint used to return unconditionally. */
  if (user.is_anonymous) {
    const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId : null;
    if (deviceId) {
      try {
        if (await hasDeviceUsedFreeRender(deviceId)) {
          return res.status(200).json({ used: limit, limit, remaining: 0 });
        }
      } catch (e) {
        console.error('[quota] device check failed, reporting user count only', e);
      }
    }
  }

  return res.status(200).json({ used, limit, remaining: limit - used });
}
