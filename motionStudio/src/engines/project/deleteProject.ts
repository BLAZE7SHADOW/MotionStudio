import { useProjectStore } from './store';
import { deleteBlob } from '../asset/blobStore';
import { deleteAssetFromStorage } from '@/lib/storage';
import { deleteCloudProject } from './cloudSync';
import type { Project } from './types';

/** Delete a project everywhere: local store, IndexedDB asset bytes, S3, and the cloud row. */
export async function deleteProjectCompletely(project: Project): Promise<void> {
  useProjectStore.getState().deleteProject(project.id);
  await Promise.all(
    project.assets.map((asset) =>
      Promise.all([deleteBlob(asset.id), deleteAssetFromStorage(asset.id, asset.name)]),
    ),
  );
  await deleteCloudProject(project.id);
}
