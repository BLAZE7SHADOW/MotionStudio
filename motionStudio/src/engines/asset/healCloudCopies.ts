import { useProjectStore } from '../project/store';
import type { Asset } from '../project/types';
import { getBlob } from './blobStore';
import { uploadAssetToStorage } from '@/lib/storage';
import { keyFromCurrentBucketUrl } from '@/lib/assetUrl';

/**
 * Brings a project's assets onto `storageKey`, re-uploading the ones whose
 * cloud copy no longer exists.
 *
 * Two populations need different things, and telling them apart is the whole
 * job. An asset uploaded before this change carries a resolved `storageUrl`.
 * If that URL points at the bucket we use today, its object is still sitting
 * there and the fix is a rewrite with no network at all. If it points
 * somewhere else — which is every asset uploaded under the previous AWS
 * account — the object is unreachable and the only way back is to upload it
 * again from the bytes in IndexedDB.
 *
 * Which is possible because `putBlob` keeps every imported file locally. On the
 * device that did the original upload nothing was actually lost; only the
 * remote copy was, and the remote copy is exactly what a cloud render needs.
 */
export async function healCloudCopies(projectId: string): Promise<void> {
  const project = useProjectStore.getState().getProject(projectId);
  if (!project) return;

  const stale = project.assets.filter((a) => !a.storageKey && a.storageUrl !== undefined);
  if (stale.length === 0) return;

  /* Sequential, deliberately. This is background repair running against a user
     who is trying to edit — re-uploading a library of video in parallel would
     take the bandwidth they need for playback. The import path fans out because
     the user is waiting on it; this one nobody is waiting on. */
  for (const asset of stale) {
    const patch = await repair(asset);
    if (!patch) continue;

    // Re-read each time: an upload takes seconds, during which the user may
    // have edited, renamed, or deleted assets.
    const latest = useProjectStore.getState().getProject(projectId);
    if (!latest || !latest.assets.some((a) => a.id === asset.id)) continue;

    useProjectStore.getState().updateProject(
      projectId,
      { assets: latest.assets.map((a) => (a.id === asset.id ? { ...a, ...patch } : a)) },
      // Repairing a broken link is not a user edit and must not enter undo.
      { history: false },
    );
  }
}

type Patch = Partial<Pick<Asset, 'storageKey' | 'storageUrl' | 'uploadError'>>;

async function repair(asset: Asset): Promise<Patch | null> {
  // Cheap case: the object is still where the URL says it is.
  const existing = keyFromCurrentBucketUrl(asset.storageUrl);
  if (existing) return { storageKey: existing, storageUrl: undefined, uploadError: undefined };

  const blob = await getBlob(asset.id).catch(() => undefined);
  if (!blob) {
    /* No local bytes and no reachable cloud copy. The editor still works off
       whatever `rehydrate` resolved, so this would otherwise stay invisible
       until a cloud render came back missing the media — which is the failure
       `uploadError` exists to pre-empt. */
    return {
      storageUrl: undefined,
      uploadError: 'This file’s cloud copy is gone. Re-add it to use cloud render.',
    };
  }

  // `uploadAssetToStorage` takes a File for its name/type/size; a Blob out of
  // IndexedDB keeps its type but carries no name.
  const file = new File([blob], asset.name, { type: blob.type });
  const result = await uploadAssetToStorage(asset.id, file);

  return result.ok
    ? { storageKey: result.key, storageUrl: undefined, uploadError: undefined }
    : { uploadError: result.message };
}
