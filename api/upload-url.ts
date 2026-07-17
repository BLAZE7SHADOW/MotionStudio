import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { verifyToken } from './_lib/auth';

const REGION = 'us-east-1';
const BUCKET = process.env.S3_ASSETS_BUCKET!;

const s3 = new S3Client({ region: REGION });

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4',
]);

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth — must be logged in (guest or authenticated)
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  try {
    await verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const { assetId, filename, contentType, size } = req.body as {
    assetId: string;
    filename: string;
    contentType: string;
    size: number;
  };

  if (!assetId || !filename || !contentType) {
    return res.status(400).json({ error: 'assetId, filename and contentType are required' });
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ error: `File type not allowed: ${contentType}` });
  }
  if (size > MAX_BYTES) {
    return res.status(400).json({ error: 'File exceeds 500 MB limit' });
  }

  const ext = filename.split('.').pop() ?? 'bin';
  const key = `${assetId}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  // Presigned URL valid for 10 minutes
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return res.status(200).json({ uploadUrl, publicUrl });
}
