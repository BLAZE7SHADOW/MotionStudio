import { getSupabase } from '@/lib/supabase';
import type { Project } from './types';

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
      data: project,
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

export async function loadProjects(userId: string): Promise<Project[]> {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('data')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[cloudSync] load failed', error.message);
    return [];
  }
  return (data ?? []).map((row) => row.data as Project);
}

export async function deleteCloudProject(projectId: string): Promise<void> {
  const { error } = await getSupabase().from('projects').delete().eq('id', projectId);
  if (error) console.error('[cloudSync] delete failed', error.message);
}
