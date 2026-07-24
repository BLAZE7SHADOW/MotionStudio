import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — constructing the client eagerly at module scope crashes
// any bundle that pulls this file in without Vite's import.meta.env
// replacement (e.g. the Remotion composition, bundled by @remotion/bundler
// for Lambda/CLI rendering, transitively imports this via the
// engines/project barrel for cloudSync — it never calls getSupabase(), so
// staying lazy means the client is simply never constructed there).
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    );
  }
  return client;
}
