import { getSupabase } from '@/lib/supabase';
import type { Project } from './types';
import { forStorage } from './forStorage';

/**
 * Why this returns a result instead of logging.
 *
 * It used to swallow every failure into `console.error` and return `void`,
 * which meant nothing above it could tell a successful save from a failed one.
 * Lose your connection mid-edit and MotionStudio looked exactly like it did
 * when saving worked. That is the quiet half of data loss — the multi-tab lock
 * fixed the loud half.
 */
export type SaveResult =
  | { ok: true }
  /** The request failed. `offline` distinguishes "no network" from "the server
      said no", because only one of those is worth retrying automatically. */
  | { ok: false; offline: boolean; message: string };

export async function saveProject(project: Project, userId: string): Promise<SaveResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, offline: true, message: 'No internet connection' };
  }
  try {
    const { error } = await getSupabase().from('projects').upsert({
      id: project.id,
      user_id: userId,
      // Session-scoped `blob:` urls are stripped on the way out — a row that
      // carries one hands every future reader a URL that can never resolve,
      // and the cloud copy is the one that wins on load. See `forStorage`.
      data: forStorage(project),
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, offline: false, message: error.message };
    return { ok: true };
  } catch (err) {
    // A thrown fetch is what a dropped connection actually looks like — the
    // `navigator.onLine` check above only catches the case the browser already
    // knows about.
    return {
      ok: false,
      offline: true,
      message: err instanceof Error ? err.message : 'Network request failed',
    };
  }
}

/**
 * The same reasoning as `SaveResult` above, applied to the read side.
 *
 * Returning `[]` on failure made "we couldn't reach your projects" and "you
 * have no projects" the same value, and the dashboard renders the onboarding
 * empty state for the second one — so a transient outage looked exactly like
 * an account whose work had vanished.
 */
export type LoadResult =
  | { ok: true; projects: Project[] }
  | { ok: false; message: string };

export async function loadProjects(userId: string): Promise<LoadResult> {
  try {
    const { data, error } = await getSupabase()
      .from('projects')
      .select('data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) return { ok: false, message: error.message };
    return { ok: true, projects: (data ?? []).map((row) => row.data as Project) };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Network request failed' };
  }
}

export type DeleteResult = { ok: true } | { ok: false; message: string };

/**
 * A failure here used to be logged and nothing else, so the project vanished
 * locally while its row survived — and came back at the next sign-in, after
 * the user had been told it was deleted for good.
 */
export async function deleteCloudProject(projectId: string): Promise<DeleteResult> {
  try {
    const { error } = await getSupabase().from('projects').delete().eq('id', projectId);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Network request failed' };
  }
}
