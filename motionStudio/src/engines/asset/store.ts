import { useProjectStore } from '../project/store';
import type { Asset } from '../project/types';
import { assetTypeFromFile, probeAsset } from './probe';
import { putBlob, deleteBlob } from './blobStore';
import { uploadAssetToStorage, deleteAssetFromStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

/**
 * Asset Engine — service layer over the project's asset library.
 * Like the Canvas Engine, it owns no state; it reads the active project and
 * writes assets back through the Project store (the aggregate root).
 */
export function useAssetEngine() {
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === s.activeProjectId) ?? null,
  );
  const updateProject = useProjectStore((s) => s.updateProject);
  const assets = project?.assets ?? [];

  /** import files: object-URL them, probe their metadata, append to the library */
  async function uploadFiles(files: File[]): Promise<Asset[]> {
    if (!project) return [];

    // Build asset + file pairs together so we can reference the file later
    const pairs: { asset: Asset; file: File }[] = [];
    for (const file of files) {
      const type = assetTypeFromFile(file);
      if (!type) continue; // skip unsupported files
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);
      const meta = await probeAsset(type, url);
      await putBlob(id, file); // persist bytes for future sessions
      pairs.push({ asset: { id, type, name: file.name, url, ...meta }, file });
    }
    if (pairs.length === 0) return [];

    const created = pairs.map((p) => p.asset);

    // Commit immediately so the editor can use blob: URLs right away
    const current = useProjectStore.getState().getProject(project.id)?.assets ?? [];
    updateProject(project.id, { assets: [...current, ...created] });

    // Background: upload each file to S3 so Lambda can reach them.
    // Each upload patches its own asset with storageUrl when done — no undo entry.
    const projectId = project.id;
    void Promise.all(
      pairs.map(async ({ asset, file }) => {
        // Get token fresh — hook state may be stale by the time upload runs
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return; // not signed in; upload skipped, Lambda won't be used
        const storageUrl = await uploadAssetToStorage(asset.id, file, token);
        if (!storageUrl) return;
        const latest = useProjectStore.getState().getProject(projectId);
        if (!latest) return;
        updateProject(
          projectId,
          { assets: latest.assets.map((a) => (a.id === asset.id ? { ...a, storageUrl } : a)) },
          { history: false },
        );
      }),
    );

    return created;
  }

  function removeAsset(id: string) {
    if (!project) return;
    const asset = assets.find((a) => a.id === id);
    updateProject(project.id, { assets: assets.filter((a) => a.id !== id) });
    void deleteBlob(id);
    if (asset) void deleteAssetFromStorage(id, asset.name);
  }

  function getAsset(id: string): Asset | undefined {
    return assets.find((a) => a.id === id);
  }

  return { assets, uploadFiles, removeAsset, getAsset };
}
