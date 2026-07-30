import { useProjectStore } from '../project/store';
import type { Asset } from '../project/types';
import { assetTypeFromFile, probeAsset } from './probe';
import { analyzeAudioUrl } from '../audio/analyzeAudio';
import { LOW_CONFIDENCE } from '../audio/beatDetect';
import { showNotice } from '@/lib/noticeStore';
import { putBlob, deleteBlob } from './blobStore';
import { createObjectUrl } from './objectUrls';
import { uploadAssetToStorage, deleteAssetFromStorage } from '@/lib/storage';

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
      const url = createObjectUrl(file);
      const meta = await probeAsset(type, url);
      await putBlob(id, file); // persist bytes for future sessions
      pairs.push({ asset: { id, type, name: file.name, url, ...meta }, file });
    }
    if (pairs.length === 0) return [];

    const created = pairs.map((p) => p.asset);

    // Commit immediately so the editor can use blob: URLs right away
    const current = useProjectStore.getState().getProject(project.id)?.assets ?? [];
    updateProject(project.id, { assets: [...current, ...created] });

    const projectId = project.id;

    /* Background: measure the tempo of any audio.
       Deliberately not awaited alongside `probeAsset` above — decoding a track
       takes a second or two, and the file must appear in the library the moment
       it is dropped. Patched in when it lands, with `history: false` so undo
       never steps back through an analysis the user didn't ask for. */
    void Promise.all(
      pairs
        .filter(({ asset }) => asset.type === 'audio')
        .map(async ({ asset }) => {
          const result = await analyzeAudioUrl(asset.url);
          if (!result) return;
          const { beat, durationSec } = result;
          const latest = useProjectStore.getState().getProject(projectId);
          if (!latest) return;
          updateProject(
            projectId,
            {
              assets: latest.assets.map((a) =>
                a.id === asset.id
                  ? {
                      ...a,
                      // The decode is a more reliable length than the <audio>
                      // metadata probe, which can stall and time out.
                      durationInSeconds: a.durationInSeconds ?? durationSec,
                      bpm: beat.bpm,
                      beatOffsetSec: beat.offsetSec,
                      beatConfidence: beat.confidence,
                    }
                  : a,
              ),
              /* Seed the project's grid from the first track that yields one,
                 and never overwrite a grid already there — it may be a tempo
                 the user typed, which outranks anything we detected. */
              ...(beat.bpm > 0 && !latest.beatGrid
                ? { beatGrid: { bpm: beat.bpm, offsetSec: beat.offsetSec, enabled: true } }
                : null),
            },
            { history: false },
          );

          /* Say what just changed. A grid appearing on the ruler with no
             explanation is the single biggest unexplained state change in the
             app — the user uploaded a track and the timeline grew lines. Fire
             it only when a grid was actually seeded, so a second track added
             to a project that already has a tempo stays quiet. */
          if (beat.bpm > 0 && !latest.beatGrid) {
            const bpm = Math.round(beat.bpm);
            showNotice(
              beat.confidence < LOW_CONFIDENCE
                ? {
                    id: 'beat-low-confidence',
                    message: `This track's tempo is hard to read — ${bpm} BPM is our best guess. Open Beat to type it or tap along.`,
                    suppressible: true,
                    timeoutMs: 12_000,
                  }
                : {
                    id: 'beat-found',
                    message: `Found ${bpm} BPM. Add shot now lands on a beat, and dragging a shot's edge snaps to one.`,
                    suppressible: true,
                    timeoutMs: 10_000,
                  },
            );
          }
        }),
    );

    // Background: upload each file to S3 so Lambda can reach them.
    // Each upload patches its own asset with storageUrl when done — no undo entry.
    void Promise.all(
      pairs.map(async ({ asset, file }) => {
        // uploadAssetToStorage resolves the token itself. Reading it here via
        // getSession() looked fresh but wasn't — getSession returns the *stored*
        // token whether or not it has expired, so a long session uploaded with a
        // dead JWT and got 401 "Invalid session".
        const storageUrl = await uploadAssetToStorage(asset.id, file);
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
