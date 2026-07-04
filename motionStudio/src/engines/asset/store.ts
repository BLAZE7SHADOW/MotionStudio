import { useProjectStore } from '../project/store';
import type { Asset } from '../project/types';
import { assetTypeFromFile, probeAsset } from './probe';
import { putBlob, deleteBlob } from './blobStore';

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

    const created: Asset[] = [];
    for (const file of files) {
      const type = assetTypeFromFile(file);
      if (!type) continue; // skip unsupported files
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);
      const meta = await probeAsset(type, url);
      await putBlob(id, file); // persist the bytes for future sessions
      created.push({ id, type, name: file.name, url, ...meta });
    }
    if (created.length === 0) return [];

    // read fresh assets at commit time so concurrent uploads don't clobber
    const current = useProjectStore.getState().getProject(project.id)?.assets ?? [];
    updateProject(project.id, { assets: [...current, ...created] });
    return created;
  }

  function removeAsset(id: string) {
    if (!project) return;
    updateProject(project.id, { assets: assets.filter((a) => a.id !== id) });
    void deleteBlob(id); // drop the persisted bytes too
  }

  function getAsset(id: string): Asset | undefined {
    return assets.find((a) => a.id === id);
  }

  return { assets, uploadFiles, removeAsset, getAsset };
}
