import { supabase } from '@/lib/supabase';
import type { Project } from './types';

export async function saveProject(project: Project, userId: string): Promise<void> {
  const { error } = await supabase.from('projects').upsert({
    id: project.id,
    user_id: userId,
    data: project,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('[cloudSync] save failed', error.message);
}

export async function loadProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
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
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) console.error('[cloudSync] delete failed', error.message);
}
