import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

export function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function verifyToken(token: string): Promise<User> {
  const { data: { user }, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !user) throw new Error('Invalid session');
  return user;
}
