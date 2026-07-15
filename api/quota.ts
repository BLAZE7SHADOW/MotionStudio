import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './_lib/auth';
import { getRenderCount } from './_lib/db';

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

  return res.status(200).json({ used, limit, remaining: limit - used });
}
