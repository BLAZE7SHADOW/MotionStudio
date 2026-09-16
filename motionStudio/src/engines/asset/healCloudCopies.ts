import { useProjectStore } from '../project/store';
import type { Asset } from '../project/types';
import { getBlob } from './blobStore';
import { uploadAssetToStorage } from '@/lib/storage';
import { keyFromCurrentBucketUrl } from '@/lib/assetUrl';
import { useUploadStatus, isUploading } from './uploadStatus';

/**
 * Brings a project's assets onto `storageKey`, re-uploading the ones whose
 * cloud copy no longer exists.
 *
 * Three populations need different things, and telling them apart is the whole
 * job. An asset uploaded before this change carries a resolved `storageUrl`.
 * If that URL points at the bucket we use today, its object is still sitting
 * there and the fix is a rewrite with no network at all. If it points
 * somewhere else — which is every asset uploaded under the previous AWS
 * account — the object is unreachable and the only way back is to upload it
 * again from the bytes in IndexedDB. And an asset with no cloud address at all
 * either never finished uploading or failed trying, which is the same repair.
 *
 * Which is possible because `putBlob` keeps every imported file locally. On the
 * device that did the original upload nothing was actually lost; only the
 * remote copy was, and the remote copy is exactly what a cloud render needs.
 */
export async function healCloudCopies(projectId: string): Promise<void> {
  const project = useProjectStore.getState().getProject(projectId);
  if (!project) return;

  /* Everything without a confirmed cloud copy, not just the migration cases.
     The filter used to require a legacy `storageUrl`, which meant an upload
     interrupted by a closed tab — no key, no legacy URL, no error — was skipped
     forever while looking perfectly healthy in the library. Assets that failed
     and recorded an `uploadError` were skipped too, so a single bad minute of
     network was permanent.

     Including both is what makes the invariant hold: once a project has opened,
     every asset with local bytes either has a `storageKey` or has an error
     saying why not. There is no silent third state, which is the only reason
     "no badge means it's in the cloud" is honest. */
  const stale = project.assets.filter((a) => !a.storageKey);
  if (stale.length === 0) return;

  /* Sequential, deliberately. This is background repair running against a user
     who is trying to edit — re-uploading a library of video in parallel would
     take the bandwidth they need for playback. The import path fans out because
     the user is waiting on it; this one nobody is waiting on. */
  for (const asset of stale) {
    /* Skip anything the import path is already uploading. Re-opening a project
       while its files are still going up would otherwise upload them twice —
       harmless, since the key is the same, but it wastes the user's bandwidth
       at the exact moment they are least likely to have it spare. */
    if (isUploading(asset.id)) continue;

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
    /* No local bytes and no reachable cloud copy — nothing left to upload from.
       The editor still plays whatever `rehydrate` resolved, so this would
       otherwise stay invisible until a cloud render came back missing the media,
       which is the failure `uploadError` exists to pre-empt. The two wordings
       are not interchangeable: one file had a copy and lost it, the other never
       had one, and only the first is worth a user wondering what happened. */
    return {
      storageUrl: undefined,
      uploadError: asset.storageUrl
        ? 'This file’s cloud copy is gone. Re-add it to use cloud render.'
        : 'This file was never uploaded and isn’t on this device. Re-add it to use cloud render.',
    };
  }

  // `uploadAssetToStorage` takes a File for its name/type/size; a Blob out of
  // IndexedDB keeps its type but carries no name.
  const file = new File([blob], asset.name, { type: blob.type });
  useUploadStatus.getState().begin(asset.id);
  const result = await uploadAssetToStorage(asset.id, file);
  const upload = useUploadStatus.getState();
  if (result.ok) upload.settle(asset.id);
  else upload.clear(asset.id);

  return result.ok
    ? { storageKey: result.key, storageUrl: undefined, uploadError: undefined }
    : { uploadError: result.message };
}
