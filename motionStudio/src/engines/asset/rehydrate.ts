import { useProjectStore } from '../project/store';
import { getBlob } from './blobStore';
import { createObjectUrl, isUrlUsable } from './objectUrls';
import { cloudUrl } from '@/lib/assetUrl';
import { healCloudCopies } from './healCloudCopies';

/**
 * After a reload, a project's persisted asset URLs are dead blob: strings.
 * This reads each asset's bytes back from IndexedDB and mints a fresh object
 * URL, so images/video/audio work again. Runs once when a project opens.
 *
 * On a device that never had the file locally (e.g. a project synced from
 * another browser/profile), there's no local blob to read — fall back to
 * the S3 copy the background upload already produced, same fallback
 * ExportDialog uses, instead of leaving the other device's dead blob: URL.
 */
export async function rehydrateAssets(projectId: string): Promise<void> {
  const project = useProjectStore.getState().getProject(projectId);
  if (!project || project.assets.length === 0) return;

  const refreshed = await Promise.all(
    project.assets.map(async (asset) => {
      const blob = await getBlob(asset.id);
      if (blob) return { ...asset, url: createObjectUrl(blob) };
      const cloud = cloudUrl(asset);
      if (cloud) return { ...asset, url: cloud };

      // Neither local bytes nor a cloud copy: the stored `blob:` URL belongs to
      // a session that ended and can never resolve. Blank it rather than
      // leaving it in place — the media decoder treats a failing fetch as
      // retryable and will hammer a dead URL indefinitely, which looks like a
      // frozen editor. An empty url is the signal for "skip this element".
      if (!isUrlUsable(asset.url)) {
        console.warn(`[assets] "${asset.name}" is no longer available on this device`);
        return { ...asset, url: '' };
      }
      return asset;
    }),
  );

  // silent: relinking URLs is not a user edit and must not enter undo history
  useProjectStore.getState().updateProject(projectId, { assets: refreshed }, { history: false });

  /* Then repair any cloud copies the local bytes can cover. Hooked here rather
     than at the two callers because it is meaningless before the store has been
     read, and because both entry points (App and EditorPage) need it. Not
     awaited: the editor is usable the moment the URLs above land. */
  void healCloudCopies(projectId);
}
