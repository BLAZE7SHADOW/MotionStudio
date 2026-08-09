import { useProjectStore } from './store';
import { deleteBlob } from '../asset/blobStore';
import { deleteAssetFromStorage } from '@/lib/storage';
import { deleteCloudProject, type DeleteResult } from './cloudSync';
import type { Project } from './types';

/**
 * Delete a project: local store, IndexedDB asset bytes, and the cloud row.
 *
 * Not S3 — `deleteAssetFromStorage` is still a stub, so uploaded originals are
 * retained there. The dialog copy in `ProjectCard` is written to match that
 * rather than promising a deletion that doesn't happen; both need updating
 * together if the delete endpoint ever lands.
 */
export async function deleteProjectCompletely(project: Project): Promise<DeleteResult> {
  /* Cloud first. Removing it locally up front is what let a failed delete
     resurrect the project: the row survived, the next sign-in pulled it back,
     and the user had already been told it was gone for good. Now nothing is
     destroyed until the authoritative copy is. */
  const result = await deleteCloudProject(project.id);
  if (!result.ok) return result;

  useProjectStore.getState().deleteProject(project.id);
  await Promise.all(
    project.assets.map((asset) =>
      Promise.all([deleteBlob(asset.id), deleteAssetFromStorage(asset.id, asset.name)]),
    ),
  );
  return { ok: true };
}
