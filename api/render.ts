import type { VercelRequest, VercelResponse } from '@vercel/node';
import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda-client';
import { verifyToken } from './_lib/auth';
import { getRenderCount, recordRender } from './_lib/db';
import { hasDeviceUsedFreeRender, recordDeviceRender } from './_lib/device';

const REGION = 'us-east-1';
const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME!;
const SERVE_URL = process.env.REMOTION_SERVE_URL!;
const BUCKET_NAME = process.env.REMOTION_BUCKET_NAME!;

const QUOTA = { authenticated: 5, anonymous: 1 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  let user;
  try {
    user = await verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const { inputProps, deviceId } = req.body as {
    inputProps: Record<string, unknown>;
    deviceId?: string;
  };
  if (!inputProps) return res.status(400).json({ error: 'Missing inputProps' });

  const limit = user.is_anonymous ? QUOTA.anonymous : QUOTA.authenticated;

  // For anonymous users, enforce per-device limit in addition to per-session quota
  if (user.is_anonymous) {
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing device ID' });
    }
    try {
      const deviceUsed = await hasDeviceUsedFreeRender(deviceId);
      if (deviceUsed) {
        return res.status(429).json({
          error: 'Guest render already used on this device. Sign in with Google or email for 5 renders/month.',
        });
      }
    } catch (e) {
      return res.status(500).json({ error: (e as Error).message });
    }
  }

  // Per-user monthly quota check
  let count: number;
  try {
    count = await getRenderCount(user.id);
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }

  if (count >= limit) {
    return res.status(429).json({ error: 'Render limit reached', limit, used: count });
  }

  let renderId: string;
  try {
    ({ renderId } = await renderMediaOnLambda({
      region: REGION,
      functionName: FUNCTION_NAME,
      serveUrl: SERVE_URL,
      composition: 'MotionStudio',
      inputProps,
      codec: 'h264',
      imageFormat: 'jpeg',
      downloadBehavior: { type: 'download', fileName: 'motionstudio-export.mp4' },
    }));
  } catch (e) {
    return res.status(500).json({ error: `Lambda error: ${(e as Error).message}` });
  }

  // Record the render attempt now (quota deducted when Lambda starts, not when it finishes)
  await recordRender(user.id, renderId);

  let outputUrl: string | null = null;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const progress = await getRenderProgress({
      renderId, bucketName: BUCKET_NAME, functionName: FUNCTION_NAME, region: REGION,
    });
    if (progress.fatalErrorEncountered) {
      return res.status(500).json({ error: progress.errors[0]?.message ?? 'Render failed' });
    }
    if (progress.done) { outputUrl = progress.outputFile ?? null; break; }
  }

  if (!outputUrl) return res.status(504).json({ error: 'Render timed out' });

  // Lock the device only after a confirmed successful output — if Lambda failed,
  // the guest hasn't "used" their free render and can try again.
  if (user.is_anonymous && deviceId) {
    await recordDeviceRender(deviceId);
  }

  return res.status(200).json({ url: outputUrl });
}
