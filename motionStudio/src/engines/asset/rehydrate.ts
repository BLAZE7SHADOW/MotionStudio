import { useProjectStore } from '../project/store';
import { getBlob } from './blobStore';

/**
 * After a reload, a project's persisted asset URLs are dead blob: strings.
 * This reads each asset's bytes back from IndexedDB and mints a fresh object
 * URL, so images/video/audio work again. Runs once when a project opens.
 */
export async function rehydrateAssets(projectId: string): Promise<void> {
  const project = useProjectStore.getState().getProject(projectId);
  if (!project || project.assets.length === 0) return;

  const refreshed = await Promise.all(
    project.assets.map(async (asset) => {
      const blob = await getBlob(asset.id);
      return blob ? { ...asset, url: URL.createObjectURL(blob) } : asset;
    }),
  );

  // silent: relinking URLs is not a user edit and must not enter undo history
  useProjectStore.getState().updateProject(projectId, { assets: refreshed }, { history: false });
}
