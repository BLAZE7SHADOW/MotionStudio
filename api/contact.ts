import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory rate limiter: resets on cold start, which is fine for a contact form.
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
    (req.headers['x-real-ip'] as string) ??
    'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait before trying again.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || 'ishivamgovindrao@gmail.com';

  if (!apiKey) {
    // No key configured yet — client falls back to a mailto link.
    return res.status(200).json({ fallback: true });
  }

  const { name, email, message } = (req.body ?? {}) as {
    name?: string; email?: string; message?: string;
  };

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (name.trim().length > 100 || email.trim().length > 254 || message.trim().length > 5000) {
    return res.status(400).json({ error: 'Input too long' });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'MotionStudio <onboarding@resend.dev>', // swap to a verified domain after DNS setup
      to,
      replyTo: email,
      subject: `MotionStudio contact from ${name}`,
      text: `${message}\n\n— ${name} (${email})`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] Resend error:', err);
    return res.status(500).json({ error: 'Send failed' });
  }
}
