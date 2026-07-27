import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRenderProgress } from '@remotion/lambda-client';
import { verifyToken } from './_lib/auth';
import { recordDeviceRender } from './_lib/device';

const REGION = 'us-east-1';
const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME!;
const BUCKET_NAME = process.env.REMOTION_BUCKET_NAME!;

/**
 * Reports on a render started by /api/render.
 *
 * Polling lives on the client, not here: a serverless function can't outlive
 * the platform's request timeout, so the old approach of waiting inside
 * /api/render capped renders at whatever Vercel allowed (~60s) regardless of
 * how long Lambda was actually willing to work. Each call here is a single
 * fast progress check, so a render can take as long as it needs.
 */
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

  const renderId = typeof req.query.renderId === 'string' ? req.query.renderId : null;
  if (!renderId) return res.status(400).json({ error: 'Missing renderId' });

  const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId : undefined;

  let progress;
  try {
    progress = await getRenderProgress({
      renderId, bucketName: BUCKET_NAME, functionName: FUNCTION_NAME, region: REGION,
    });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }

  if (progress.fatalErrorEncountered) {
    return res.status(200).json({
      status: 'error',
      error: progress.errors[0]?.message ?? 'Render failed',
    });
  }

  if (progress.done) {
    // Lock the device only on a confirmed output — if Lambda failed, the guest
    // hasn't "used" their free render and can try again. This ran in
    // /api/render before; it belongs wherever success is actually observed.
    if (user.is_anonymous && deviceId) {
      await recordDeviceRender(deviceId);
    }
    return res.status(200).json({ status: 'done', url: progress.outputFile ?? null });
  }

  return res.status(200).json({
    status: 'rendering',
    progress: progress.overallProgress ?? 0,
  });
}
